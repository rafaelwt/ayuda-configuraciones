#!/usr/bin/env node
/**
 * List Tailwind CSS IntelliSense diagnostics (including suggested canonical classes).
 * No project dependencies; requires the VS Code Tailwind CSS IntelliSense extension.
 *
 * Usage: node docs/script/tailwind-diagnostics/tailwind-diagnostics.mjs [--root PATH] [--dir PATH]
 *        [--server PATH] [--timeout MILLISECONDS]
 * Run from the project root, or pass --root. Does not change any files.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function usage() {
  console.log('Usage: node tailwind-diagnostics.mjs [--root PATH] [--dir PATH] [--server PATH] [--timeout MS]');
  console.log('Requires the VS Code Tailwind CSS IntelliSense extension. Lists diagnostics and suggestions; does not fix files.');
}

const args = process.argv.slice(2);
const options = { root: process.cwd(), dir: null, server: null, timeout: 30000 };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help' || args[i] === '-h') {
    usage();
    process.exit(0);
  }
  const key = args[i]?.slice(2);
  if (!['root', 'dir', 'server', 'timeout'].includes(key) || !args[i]?.startsWith('--') || !args[i + 1]) {
    usage();
    process.exit(2);
  }
  options[key] = args[++i];
}
const root = resolve(options.root);
const directory = resolve(root, options.dir ?? (existsSync(join(root, 'src')) ? 'src' : '.'));
const timeout = Number(options.timeout);
if (!existsSync(directory) || !statSync(directory).isDirectory() || !Number.isFinite(timeout) || timeout <= 0) {
  console.error('Invalid --dir or --timeout.');
  process.exit(2);
}

function findServer() {
  if (options.server) return resolve(options.server);
  const home = homedir();
  const locations = [
    process.env.VSCODE_EXTENSIONS,
    join(home, '.vscode', 'extensions'),
    join(home, '.vscode-server', 'extensions'),
    join(home, '.vscode-insiders', 'extensions'),
    join(home, '.vscode-server-insiders', 'extensions'),
  ];
  const candidates = locations.filter(Boolean).flatMap((location) => {
    if (!existsSync(location)) return [];
    return readdirSync(location)
      .filter((name) => name.startsWith('bradlc.vscode-tailwindcss-'))
      .map((name) => join(location, name, 'dist', 'tailwindServer.js'))
      .filter(existsSync);
  });
  return candidates.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
}
const server = findServer();
if (!server || !existsSync(server)) {
  console.error('Tailwind CSS IntelliSense server not found. Install the VS Code extension or pass --server PATH.');
  process.exit(2);
}

const ignored = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.angular', '.next', '.nuxt',
  '.cache', 'playwright-report', 'test-results',
]);
const languageIds = {
  '.html': 'html', '.css': 'css', '.js': 'javascript', '.jsx': 'javascriptreact',
  '.ts': 'typescript', '.tsx': 'typescriptreact', '.vue': 'vue', '.svelte': 'svelte',
  '.scss': 'scss', '.less': 'less', '.astro': 'astro', '.mdx': 'mdx', '.php': 'php',
};
function collectFiles(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const file = join(path, entry.name);
    if (entry.isDirectory()) return ignored.has(entry.name) ? [] : collectFiles(file);
    if (!entry.isFile()) return [];
    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    return languageIds[extension] ? [file] : [];
  });
}
const files = collectFiles(directory);
if (!files.length) {
  console.error(`No supported source files found in ${directory}.`);
  process.exit(2);
}

const child = spawn(process.execPath, [server, '--stdio'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
const diagnostics = new Map();
let buffer = Buffer.alloc(0);
let initialized = false;
let finished = false;
let failure = null;
let warning = null;
let lastMessage = '';
child.stderr.on('data', (chunk) => { lastMessage = String(chunk).trim(); });
child.on('error', (error) => { failure = error.message; finish(); });
child.on('exit', (code) => {
  if (!finished) {
    failure = `Language server exited unexpectedly (${code}): ${lastMessage}`;
    finish();
  }
});

function send(message) {
  const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }));
  child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  child.stdin.write(body);
}
function finish() {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  child.kill();
  if (failure) {
    console.error(failure);
    process.exitCode = 2;
    return;
  }
  let count = 0;
  for (const file of files) {
    const uri = pathToFileURL(file).href;
    for (const diagnostic of diagnostics.get(uri) ?? []) {
      count++;
      const line = diagnostic.range.start.line + 1;
      const column = diagnostic.range.start.character + 1;
      console.log(`${relative(root, file)}:${line}:${column} [${diagnostic.code ?? 'tailwindcss'}] ${diagnostic.message}`);
    }
  }
  console.log(`${count} diagnostics in ${files.length} files.`);
  if (warning) console.error(warning);
  process.exitCode = warning ? 2 : count ? 1 : 0;
}
const timer = setTimeout(() => {
  if (!initialized || diagnostics.size === 0) {
    failure = `Timed out waiting for Tailwind diagnostics. ${lastMessage}`;
  } else if (diagnostics.size < files.length) {
    warning = `Incomplete: ${files.length - diagnostics.size} files did not publish diagnostics before the timeout. Try a larger --timeout.`;
  }
  finish();
}, timeout);

child.stdout.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const end = buffer.indexOf('\r\n\r\n');
    if (end === -1) break;
    const header = buffer.subarray(0, end).toString();
    const length = /(?:^|\r\n)Content-Length:\s*(\d+)/i.exec(header);
    if (!length) { failure = `Invalid LSP header: ${header}`; finish(); return; }
    const bytes = Number(length[1]);
    if (buffer.length < end + 4 + bytes) break;
    const message = JSON.parse(buffer.subarray(end + 4, end + 4 + bytes).toString());
    buffer = buffer.subarray(end + 4 + bytes);
    if (message.id !== undefined && message.method) {
      const result = message.method === 'workspace/configuration'
        ? message.params?.items?.map(() => ({})) ?? []
        : message.method === 'workspace/workspaceFolders'
          ? [{ uri: pathToFileURL(root + sep).href, name: basename(root) }]
          : null;
      send({ id: message.id, result });
    } else if (message.id === 1 && message.result) {
      initialized = true;
      send({ method: 'initialized', params: {} });
      for (const file of files) {
        const extension = file.slice(file.lastIndexOf('.'));
        send({ method: 'textDocument/didOpen', params: {
          textDocument: { uri: pathToFileURL(file).href, languageId: languageIds[extension], version: 1, text: readFileSync(file, 'utf8') },
        } });
      }
    } else if (message.method === 'textDocument/publishDiagnostics') {
      diagnostics.set(message.params.uri, message.params.diagnostics);
      if (diagnostics.size === files.length) finish();
    }
  }
});
const workspaceUri = pathToFileURL(root + sep).href;
send({ id: 1, method: 'initialize', params: {
  processId: process.pid, rootUri: workspaceUri, rootPath: root,
  workspaceFolders: [{ uri: workspaceUri, name: basename(root) }],
  capabilities: { workspace: { configuration: true, workspaceFolders: true }, textDocument: { publishDiagnostics: { relatedInformation: true } } },
  initializationOptions: {},
} });

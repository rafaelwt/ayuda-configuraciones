# Diagnosing Phantom TypeScript Errors in the Editor

Guidance for agents working on TypeScript projects.

## The rule

**When the editor reports a TypeScript error but the compiler does not, the code is not the problem — the configuration is.**

The compiler is the source of truth. The editor's language server is an *opinion* about which `tsconfig.json` applies to the open file. When those two disagree, fix the configuration, not the code.

## Step 0 — Always verify before acting

Never trust the editor's error message alone, and never trust a user's report of an editor error without reproducing it against the compiler.

```bash
npx tsc --noEmit -p tsconfig.json; echo "EXIT: $?"
```

| Result | Meaning | Action |
| --- | --- | --- |
| Exit `0`, editor shows errors | **Phantom error.** Configuration issue. | Continue to the sections below. |
| Non-zero, same errors as editor | Real error. | Fix the code normally. This document does not apply. |

Do not modify source code until this check is done. Editing correct code to silence a phantom error introduces a real defect.

> Note on shells: `echo "${PIPESTATUS[0]}"` behaves differently in zsh and bash. To read an exit code reliably, run the command on its own line and use `$?` on the next line.

## Symptom 1 — Missing test globals

**Editor reports:**
```
Cannot find name 'describe'.
Cannot find name 'it'.
Cannot find name 'expect'.
Do you need to install type definitions for a test runner?
```

**The suggested fix in that message is usually wrong.** Verify before installing anything:

```bash
test -e node_modules/@types/jest && echo "PRESENT" || echo "MISSING"
```

If the types are present, installing them again changes nothing and the error persists.

### Root cause

The test file is not being matched by the `tsconfig.json` the language server picked. A file that belongs to no project falls back to *inferred project* mode, which has no `types` and therefore no test globals.

This commonly happens when:

- The root `tsconfig.json` declares no `include` and no `files`, relying on the implicit `**/*` default.
- A sibling config (typically `tsconfig.build.json`) explicitly excludes test files, and the language server resolves the file against that config instead.

The CLI compiler works because you pass `-p tsconfig.json` explicitly. The language server has to guess.

### Fix

Make the scope explicit in the root `tsconfig.json`. Do not rely on implicit defaults.

```jsonc
{
  "compilerOptions": {
    // ...existing options...
    "types": ["jest", "node"]   // or ["mocha", "node"], ["vitest", "node"]
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Leave the build config untouched. It should keep excluding tests so they never reach the build output.

### Caution: `types` is a whitelist

Adding `types` **disables** automatic inclusion of every package under `node_modules/@types`. Any ambient package the project relies on must now be listed explicitly. Verify after the change, and add whatever the compiler reports as missing.

## Symptom 2 — CommonJS default import not constructable or callable

**Editor reports:**
```
TS2351: This expression is not constructable.
  Type 'typeof X' has no construct signatures.

TS2349: This expression is not callable.
  Type '{ default: ... }' has no call signatures.
```

...on a line using `new X(...)` or `X(...)`, where the import is `import * as X from 'x'`.

### Root cause

Check how the package declares its types:

```bash
rg -n 'export =|export default' node_modules/@types/<pkg>/index.d.ts | tail -5
rg -n 'export =|export default' node_modules/<pkg>/index.d.ts | tail -5
```

If the declaration ends in `export = X`, the package is **pure CommonJS**.

A namespace import (`import * as X`) of an `export =` module produces a *namespace object*, not the class or function. Namespaces have no construct or call signature.

Whether this is an error depends on one flag:

| `esModuleInterop` | `import * as X` + `new X()` |
| --- | --- |
| `false` | Allowed — legacy compatibility behavior |
| `true` | **Error** — this is the correct diagnostic |

So a project with `esModuleInterop: false` compiles fine, while the language server — evaluating the file under inferred settings where the flag defaults to `true` — reports the error.

**The code is fragile regardless of the editor.** It only works while the flag stays off, and modern framework templates ship with it on.

### Fix

Use the import form designed as the counterpart to `export =`:

```typescript
// Before — works only while esModuleInterop is false
import * as X from 'x';

// After — correct under either setting
import X = require('x');
```

This preserves the type, the constructor, and the emitted JavaScript (both emit `require()` under `"module": "commonjs"`).

### Do not change namespace imports that are genuinely namespaces

Only imports used with `new` or called directly are affected. An import accessed by property is correct as-is and must be left alone:

```typescript
import * as winston from 'winston';   // winston.format  — correct, do not touch
import * as nodemailer from 'nodemailer'; // nodemailer.createTransport() — correct, do not touch
```

Find the ones that actually need fixing:

```bash
rg -n "import \* as" src/ test/ --type ts
```

Then inspect each usage. Property access is fine. `new X(...)` or `X(...)` is not.

### Restriction

`import X = require('x')` is only valid when emitting CommonJS. Under `"module": "esnext"` / `"nodenext"` with ESM output, use a default import plus `esModuleInterop: true` instead.

## Scope check before editing

Before changing any import, confirm the blast radius:

```bash
rg -n "<package-name>" src/ test/ --type ts
```

Report how many files are affected. A single-file change is safe to apply directly. A broad change should be confirmed with the user first.

## Verification — required, not optional

Never report success without running these. Report the actual exit codes.

```bash
# 1. Project typecheck passes
npx tsc --noEmit -p tsconfig.json
echo "TYPECHECK: $?"

# 2. Build config still passes and still excludes tests
npx tsc --noEmit -p tsconfig.build.json
echo "BUILD: $?"

# 3. The import fix survives the flag flip (Symptom 2 only)
npx tsc --noEmit -p tsconfig.json --esModuleInterop
echo "INTEROP: $?"

# 4. Tests are discovered and actually run
npx jest --listTests
npx jest
echo "TESTS: $?"
```

Step 3 is the real proof for Symptom 2: the fixed file must not appear in the output. Errors in *other* files under that flag are pre-existing issues of the same class — report them, do not silently fix them unless asked.

## After the fix

Tell the user to restart the editor's TypeScript language server (`TypeScript: Restart TS Server`) so it reloads the configuration.

If a restart was already tried and failed, that is evidence **against** a stale cache and **for** a configuration mismatch. Treat repeated restarts as a signal to investigate the config, not to restart again.

## Why this cluster appears after a package-manager migration

Switching between npm, pnpm, and yarn rewrites `node_modules` layout. pnpm in particular uses a symlinked store, which changes how modules resolve. Configurations that worked by implicit default can stop resolving the same way, and the language server surfaces it first because it is the component doing the guessing.

The durable fix is the same in every case: **declare scope and types explicitly instead of relying on implicit defaults.**

### Verifying a symlinked store

When checking whether a package exists under pnpm, use a test that follows symlinks. A directory search that does not follow them reports a false negative:

```bash
# Unreliable — may miss symlinked packages
fd -t d '<pkg>' node_modules -d 2

# Reliable
test -e node_modules/@types/<pkg> && echo "OK" || echo "MISSING"
eza -la node_modules/@types/ | rg '<pkg>'
```

## Summary

| Editor says | Compiler says | Conclusion |
| --- | --- | --- |
| Error | Error | Real bug — fix the code |
| Error | Clean | Config mismatch — fix `tsconfig`, never the code |
| Clean | Error | Language server is stale — restart it |

**Verify with the compiler first. Always.**

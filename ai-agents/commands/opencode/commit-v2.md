---
description: Create a semantic git commit from Git diff
agent: build
---

# Commit Command

Create a git commit with a clear semantic commit message based on the current Git changes.

Your goal is to generate a commit message that explains the **purpose** of the changes, not only the files changed.

You may inspect Git diffs, but you must **not** open or read full file contents directly.

---

## Allowed Commands

You may run **only** these commands:

1. `git status --short`
2. `git diff --name-status`
3. `git diff --stat`
4. `git diff`
5. `git log -10 --pretty=format:"%s"`
6. `git add .`
7. `git diff --cached --name-status`
8. `git diff --cached --stat`
9. `git diff --cached`
10. `git commit -m "<subject>"`
11. `git commit -m "<subject>" -m "<body>"`

---

## Required Flow

Follow this exact sequence — do not skip or reorder steps:

1. Run `git status --short` to understand the working tree.
2. **Stop immediately** if `git status --short` returns empty output. Say: `No changes to commit.`
3. **Stop immediately** if any file shows conflict status `UU`, `AA`, `DD`, `AU`, `UA`, `DU`, or `UD` (unresolved merge conflict). Say: `Merge conflict detected in: <file>. Resolve conflicts before committing.`
4. Inspect the changed file list for **sensitive files** (see Sensitive Files Rule below). Stop and confirm before continuing if any are found.
5. Run `git diff --name-status` to identify changed files by status.
6. Run `git diff --stat` to summarize unstaged changes.
7. Run `git diff` to inspect the actual unstaged code changes. If the diff exceeds 500 lines, rely primarily on diff stats and file paths. **Note:** untracked files (`??`) do not appear in `git diff` before staging — always use `git diff --cached` after `git add .` as the final source of truth.
8. Run `git log -10 --pretty=format:"%s"` to understand the repository commit style.
9. Run `git add .` — **Note:** this stages ALL untracked and modified files. If `git status` showed many untracked files (`??`) that seem unrelated to the current work, warn the user before staging.
10. Run `git diff --cached --name-status` to confirm staged files.
11. Run `git diff --cached --stat` to confirm the staged summary.
12. Run `git diff --cached` to inspect the exact staged changes.
13. Generate the commit message based **only** on the staged diff.
14. Run the appropriate `git commit` command.

---

## Staged Diff Authority Rule

The final commit message must be based **only** on the staged diff shown by `git diff --cached`.

- Use `git diff` (before staging) only as preliminary context.
- After `git add .`, ignore the unstaged diff entirely.
- If the unstaged diff and staged diff differ, the **staged diff is the source of truth**.

---

## Sensitive Files Rule

Before running `git add .`, inspect the changed file list from `git status --short` and `git diff --name-status`.

If any file matches the patterns below, **stop and ask the user** before staging or committing:

```text
.env / .env.*
*.pem / *.key / *.p12 / *.pfx / *.crt / *.cer / *.jks / *.keystore
id_rsa / id_dsa / id_ecdsa / id_ed25519
credentials.json / secrets.json / service-account.json
firebase-service-account.json / google-services.json / aws-credentials
*-secret.* / *-secrets.* / *-credentials.*
*credential* / *secret* / *token*
```

If detected, stop and respond with:

```
Sensitive file detected: <file path>

Confirm if you want to include this file in the commit.
```

Do not continue until the user confirms.

---

## Commit Message Reasoning Rules

Before writing the commit message, infer the best message using this priority:

1. Analyze the **staged diff** thoroughly to understand what changed.
2. Use file names and paths to identify the affected module, feature, or layer.
3. Use added/removed lines to infer **behavior changes**, not just syntactic changes.
4. Use recent commit messages **only as style reference** — never copy them.
5. Prefer a message that explains **why** the change exists, not just what files changed.
6. Do not include issue numbers, ticket IDs, author names, tags, or metadata unless required by repository convention.
7. If multiple areas changed, identify the **dominant purpose** of the staged changes.

---

## Commit Type Rules

Choose the most appropriate semantic type:

| Type | Use when |
|------|----------|
| `feat` | New functionality or user-visible behavior |
| `fix` | Bug fix or correction of broken/incorrect behavior |
| `refactor` | Internal code improvement without behavior change |
| `perf` | Performance improvement |
| `docs` | Documentation-only changes |
| `style` | Formatting, whitespace, linting, or visual code style |
| `test` | Tests added or changed |
| `build` | Build system, dependencies, Docker, or build config |
| `ci` | CI/CD workflow changes |
| `chore` | Maintenance tasks that do not affect production code |
| `revert` | Revert a previous change |

If multiple types apply, choose the **dominant purpose**. Prefer `feat` for new behavior, `fix` for corrections, `refactor` for equivalent rewrites.

---

## Subject Rules

The subject line must:

- Use lowercase semantic type with format: `type: subject`
- Be written in **imperative mood** (`add`, `fix`, `remove` — not `added`, `fixing`)
- Start the subject after the colon with **lowercase** (unless the first word is a proper noun)
- Not end with a period
- Stay **under 72 characters**
- Avoid vague subjects: `changes`, `updates`, `fix bugs`, `misc`, `work`
- Prefer English unless recent commits are clearly in another language

**Good examples:**
```text
feat: add payment order validation
fix: handle expired provider tokens
refactor: simplify commit prompt generation
docs: update api configuration guide
build: update project dependencies
ci: adjust deployment workflow
```

**Bad examples:**
```text
feat: Added new things.
fix: bug
update files
changes
misc updates
```

---

## Body Rules

Use a multiline commit when the staged diff affects multiple areas or needs context.

- Use **2–4 bullets maximum**
- Omit bullets for single-area or very small changes
- Each bullet explains a behavior or implementation change visible in the staged diff
- Do not mention implementation details not visible in the diff
- Do not quote large portions of the diff

**Preferred format:**
```text
type: subject

- Explain the main behavior or implementation change.
- Mention another relevant changed module or file group.
- Add context only when useful.
```

---

## Commit Command Format

Single-line commit:
```bash
git commit -m "type: subject"
```

Multiline commit:
```bash
git commit -m "type: subject" -m "- Main behavior or implementation change.
- Another relevant changed area.
- Additional context if useful."
```

---

## Ambiguity Handling

If the staged changes are too ambiguous to infer a reliable commit message, ask **one short question** before committing.

Only ask if absolutely necessary. Prefer making a reasonable decision from: staged diff, file names, changed paths, Git status, diff stats, and recent commit style.

---

## Forbidden

You must **not** run any command outside the allowed list. Specifically:

- No `find`, `dir`, `ls`, `tree`, `pwd`, or file exploration commands
- No `cd`
- No opening, reading, or printing full file contents
- No `git show`
- No running tests, installing packages, or modifying files manually
- No `git amend`, `push`, `pull`, `fetch`, `branch`, `checkout`, `stash`, `reset`, `restore`
- No `Co-Authored-By` or trailers
- No explanations or commentary after a successful commit

---

## Final Output

After the commit succeeds, respond with only:

```
Commit created: <commit message subject>
```
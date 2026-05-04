---
description: Create a semantic git commit
agent: build
---

# Commit Command

Create a git commit using a semantic commit message.

## Allowed Commands

You may run ONLY these commands:

1. `git status --short`
2. `git diff --stat`
3. `git diff --cached --stat`
4. `git add .`
5. `git commit -m "<message>"`

## Required Flow

1. Run `git status --short` to understand changed files.
2. Run `git diff --stat` to summarize unstaged changes.
3. Run `git add .`.
4. Run `git diff --cached --stat` to confirm what will be committed.
5. Create the commit using `git commit -m "<message>"`.

## Forbidden

- Do not run `find`, `dir`, `ls`, `tree`, or file exploration commands.
- Do not run `cd`.
- Do not open or read file contents.
- Do not use `git diff` without `--stat`.
- Do not add `Co-Authored-By` or any trailers.
- Do not run tests.
- Do not modify files.
- Do not ask me for the commit type unless the changes are truly ambiguous.

## Commit Message Format

Use this format:

```text
type: Subject line describing the main change

- Specific change or file group added/modified with brief explanation.
- Another specific change with context.
- Additional changes as needed.
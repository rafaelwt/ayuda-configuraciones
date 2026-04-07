---
description: Create a git commit with semantic format
---

# Commit Command

## Allowed Commands (ONLY these)

1. `git add .`
2. `git commit -m "<message>"`

## Special Rule for .claude/settings.local.json

If `.claude/settings.local.json` was modified during the process and is not staged after `git add .`, run `git add .` again before committing to ensure it's included.

## Forbidden

- Do not run `find`, `dir`, `ls`, or any file exploration commands
- Do not run `cd` to other directories
- Do not check file contents or project structure
- Do not add `Co-Authored-By` or any trailers
- Do not run any command other than `git add` and `git commit`

## Commit Message Format
```
type: subject (max 48 chars)

Detailed description explaining what was changed and WHY.
Include context, reasoning, and implementation details.
Can be multiple lines.
```

### Types
`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### Rules
1. **Subject**: imperative mood, lowercase, no period, max 48 chars
2. **Description**: explain the WHY, not just the WHAT - be comprehensive

### Example
```
feat: integrate Pino logger for structured logging

Replaced console.log with Pino logger across gateway services
for better observability and production-ready logging. Added
file transports for persistent log storage and configured
log levels per environment. Updated error handling to use
structured logging format.
```
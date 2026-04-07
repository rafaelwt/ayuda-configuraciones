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
type: subject line describing the main change (max 72 chars)

- Specific change or file added/modified with brief explanation
- Another specific change with context
- Additional changes as needed
```

### Types
`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### Rules
1. **Subject**: imperative mood (Add, Create, Update, Fix), can use capital letter, no period, max 72 chars
2. **Body**: bullet points starting with `-`, each describing a specific change
3. **Each bullet**: starts with past tense verb (Introduced, Added, Created, Implemented, Updated, Refactored)
4. **Be specific**: mention file names and what they do

### Example
```
feat: Add new components and layout partials for module

- Introduced mainLayout.php for the primary layout structure.
- Added modalsComponent.php containing Bootstrap 5 modals.
- Created configService.js for handling client-side logic.
- Implemented validation helpers for form processing.
```

### Another Example
```
refactor: Extract reusable code into separate files

- Extracted inline JavaScript into dedicated script files.
- Created view partials for better code organization.
- Added utility classes for common styling patterns.
- Updated controllers to use new middleware.
```

### Another Example
```
fix: Resolve authentication and session handling issues

- Fixed token validation logic in AuthMiddleware.
- Updated session timeout configuration.
- Corrected redirect URLs after login failure.
- Added error logging for failed attempts.
```

### Another Example
```
chore: Update dependencies and configuration files

- Updated package.json with latest versions.
- Modified environment configuration with new variables.
- Added Docker configuration for local development.
- Cleaned up unused imports across files.
```
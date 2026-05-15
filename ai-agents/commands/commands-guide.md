---
description: Guide for creating global commands in Claude Code and OpenCode
---

# Global Commands Guide

## Mac OS & Linux

### Claude Code

Location: `~/.claude/commands/`

1. Create the `commands` folder if it doesn't exist:
   ```
   mkdir -p ~/.claude/commands
   ```
2. Copy the command file (e.g., `commit.md`) to:
   ```
   ~/.claude/commands/commit.md
   ```

3. The command will be available as `/commit` in Claude Code.

### OpenCode

Location: `~/.config/opencode/commands/`

1. Create the `commands` folder if it doesn't exist:
   ```
   mkdir -p ~/.config/opencode/commands
   ```
2. Copy the command file (e.g., `commit.md`) to:
   ```
   ~/.config/opencode/commands/commit.md
   ```

3. The command will be available as `/commit` in OpenCode.

---

## Windows 11

### Claude Code

Location: `C:\Users\<username>\.claude\commands\`

1. Create the `commands` folder if it doesn't exist:
   ```
   mkdir %USERPROFILE%\.claude\commands
   ```
2. Copy the command file (e.g., `commit.md`) to:
   ```
   C:\Users\<username>\.claude\commands\commit.md
   ```

3. The command will be available as `/commit` in Claude Code.

### OpenCode

Location: `C:\Users\<username>\.config\opencode\commands\`

1. Create the `commands` folder if it doesn't exist:
   ```
   mkdir %USERPROFILE%\.config\opencode\commands
   ```
2. Copy the command file (e.g., `commit.md`) to:
   ```
   C:\Users\<username>\.config\opencode\commands\commit.md
   ```

3. The command will be available as `/commit` in OpenCode.

---

## Notes

- The filename (without extension) becomes the command name
- Commands are invoked with `/` prefix (e.g., `/commit`)
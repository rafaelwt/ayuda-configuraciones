---
description: Guide for creating global commands in Claude Code and OpenCode
---

# Global Commands Guide

## Claude Code (Mac OS)

Location: `~/.claude/commands/`

1. Copy the command file (e.g., `commit.md`) to:
   ```
   ~/.claude/commands/commit.md
   ```

2. The command will be available as `/commit` in Claude Code.

---

## OpenCode (Mac OS)

Location: `~/.config/opencode/`

1. Copy the command file (e.g., `commit.md`) to:
   ```
   ~/.config/opencode/commit.md
   ```

2. The command will be available as `/commit` in OpenCode.

---

## Notes

- The filename (without extension) becomes the command name
- Commands are invoked with `/` prefix (e.g., `/commit`)
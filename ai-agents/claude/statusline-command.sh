#!/usr/bin/env bash
input=$(cat)

# --- Inputs ---
model=$(echo "$input" | jq -r '.model.display_name // "Unknown Model"')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
worktree=$(echo "$input" | jq -r '.worktree.name // empty')
total_cost=$(echo "$input" | jq -r '.cost.total_cost_usd // empty')
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // .worktree.original_cwd // empty')

# --- Fallback cwd ---
if [ -z "$current_dir" ] || [ "$current_dir" = "null" ]; then
  current_dir=$(pwd)
fi

display_path="$current_dir"
git_path="$current_dir"

# --- Windows path support (para git) ---
if [[ "$current_dir" =~ ^[A-Za-z]:\\ ]]; then
  display_path="$current_dir"
  git_path=$(echo "$current_dir" | sed 's#\\#/#g' | sed -E 's#^([A-Za-z]):#/mnt/\L\1#')
fi

# --- Worktree ---
if [ -n "$worktree" ] && [ "$worktree" != "null" ]; then
  worktree_str="$worktree"
else
  worktree_str="no worktree"
fi

# --- Colors ---
GREEN='\033[32m'
YELLOW='\033[33m'
RESET='\033[0m'

# --- Git info ---
git_str=""
if git -C "$git_path" rev-parse --git-dir > /dev/null 2>&1; then
  branch=$(git -C "$git_path" symbolic-ref --short HEAD 2>/dev/null \
    || git -C "$git_path" rev-parse --short HEAD 2>/dev/null)

  staged=$(git -C "$git_path" diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
  modified=$(git -C "$git_path" diff --numstat 2>/dev/null | wc -l | tr -d ' ')

  git_str="$branch"
  [ "$staged" -gt 0 ] && git_str="${git_str} $(printf "${GREEN}+${staged}${RESET}")"
  [ "$modified" -gt 0 ] && git_str="${git_str} $(printf "${YELLOW}~${modified}${RESET}")"
else
  git_str="no branch"
fi

# --- Output FINAL ---
printf "📁 %s | 🌳 %s | 🌿 %s" \
  "$display_path" \
  "$worktree_str" \
  "$git_str"
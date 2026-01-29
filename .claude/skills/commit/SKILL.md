---
name: commit
description: Stage and commit changes with a descriptive message
---

# Commit Changes

Stage and commit changes with a descriptive message.

## Usage
/commit [description of changes to include]

## Examples
- `/commit` — commit all changes
- `/commit the skill files` — only commit changes to skill files
- `/commit just the checklist updates` — only commit checklist changes

## Instructions
1. Run `git status` to see what files have changed
2. Run `git diff` to understand the changes
3. If `$ARGUMENTS` is provided, identify which files match the user's description and only stage those. Otherwise, stage all changes.
4. Check recent commit messages with `git log --oneline -5` to match the project's commit style
5. Present the staged changes to the user and propose a concise, one-line commit message (e.g., `feat: add login button`, `fix: resolve null pointer in auth`)
6. Ask the user to confirm before creating the commit
7. Do NOT push to remote unless explicitly asked

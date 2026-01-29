---
name: create-branch
description: Create and checkout a new git branch
---

# Create Branch

Create and checkout a new git branch.

## Usage
/create-branch [branch-name]

## Instructions
1. If `$ARGUMENTS` is empty, generate a descriptive branch name based on recent changes or conversation context (e.g., `feat/add-claude-skills`, `fix/login-error`). Otherwise create a branch with name `$ARGUMENTS`.
2. Create and checkout a new branch with the name
3. Push the branch to origin with `git push -u origin <branch-name>`
4. Confirm the branch was created, is active, and is tracking the remote

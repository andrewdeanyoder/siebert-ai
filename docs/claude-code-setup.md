# Claude Code Setup Checklist

This checklist covers useful features to configure in Claude Code.

## Essential Setup:

### 1. Install Claude in Terminal and Try It Out
a. [x] Install Claude Code CLI (`brew install claude-code` or `curl -fsSL https://claude.ai/install.sh | bash`)
b. [x] Authenticate with `claude login`
c. [x] Verify installation with `claude doctor`
d. [x] Try basic commands: `claude "what files are in this directory?"` or just `claude` for interactive mode

### 2. Migrate Existing Preferences
a. [x] Migrate .cursorrules file to Claude docs folder
b. [x] Review and convert cursor-specific settings to Claude format

### 3. Custom Global Instructions
a. [x] Set up custom global instructions in Claude Code settings
b. [ ] Define preferences for coding style, and response format
c. [ ] Configure how Claude should interact and make decisions

### 4. Skills and Prompts Setup
a. [x] Create `.claude/skills/` directory for custom commands
b. [ ] Create `.claude/prompts/` directory for reusable prompt templates
c. [ ] Look for examples online to populate with project-specific workflows
d. [ ] Create project-specific commands (like `/test-auth` or `/run-e2e`)
e. [ ] Install GitHub CLI (`brew install gh && gh auth login`) for PR/issue commands
f. [ ] Refine guidelines for what is a feat, chore, etc. in the commit skill

### 5. Renable auto completes
a. [ ] explore using claude code terminal inside cursor just for the autocompletes
b. [ ] claude extension work inside cursor?

### 6. Git Hooks Configuration
a. [x] Set up pre-commit hooks to run linters/formatters automatically
b. [ ] Explore post-edit hook to log/display changes without blocking Claude

### 7. Test Runner Integration
a. [x] Define the overall testing stratgy.
b. [x] Configure automatic test running before committing
c. [x] Set up which test commands to use (Vitest & Playwright)
d. [x] Enable/disable auto-run based on preference

### 8. MCP (Model Context Protocol) Servers
a. [ ] Install GitHub MCP server for seamless PR/issue management
b. [ ] Install Database MCP server if needed for direct DB access
c. [ ] Explore custom MCP servers for Supabase, Deepgram, or other frequently-used services

### 9. Working Directory Preferences
a. [ ] Pin frequently accessed directories
b. [ ] Set default paths for tests, components, etc.

### 10. Permission Presets
a. [ ] Pre-approve common bash commands (npm, git, test runners)
b. [ ] Set file write permissions for src/test directories

### 11. Model Selection
a. [ ] Choose default model (Sonnet for most work, Haiku for quick tasks)
b. [ ] Configure when to use different models

### 12. Explore 'Plan locally, execute remotely'
a. [ ] Set up Claude Code on the web: Visit [claude.ai/code](https://claude.ai/code), connect GitHub account, install Claude GitHub app in repositories
b. [ ] Configure default environment (network access level, environment variables) via environment settings
c. [ ] Test running a simple task remotely using `&` prefix (e.g., `& Run the tests`)
d. [ ] Practice monitoring remote sessions with `/tasks` and teleporting them back with `/teleport`

**Resources:**
- [Claude Code on the web - Official Docs](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Common workflows - Official Docs](https://code.claude.com/docs/en/common-workflows)

## Priority Items for This Project:
Given the stack (Next.js, Supabase, Deepgram, Vitest, Playwright), prioritize:
1. **Git hooks** for linting/testing
2. **MCP servers** for GitHub and potentially Supabase
3. **Permission presets** for npm/test commands

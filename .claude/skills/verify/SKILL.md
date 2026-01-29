---
name: verify
description: Run lint, type check, and unit tests to verify code quality
---

# Verify

Run verification commands to check code quality before committing.

## Usage
/verify

## Instructions
1. Run `pnpm test:run` to run unit tests. Fix any failures before proceeding.
2. Run `pnpm types` to verify TypeScript types. Fix any errors before proceeding.
3. Run `pnpm lint` to check for linting errors. Fix any errors before proceeding.
4. Report success when all checks pass.
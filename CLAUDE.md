# Project Instructions for Siebert Science AI

## Project Overview
This is an AI-powered anatomy and physiology tutoring application built with Next.js, TypeScript, and Tailwind CSS. The AI tutor specializes in evidence-based learning strategies and cognitive neuroscience principles.

## Key Technologies
- Next.js 15.4.2 with App Router
- React 19.1.0
- TypeScript
- Tailwind CSS v4 for styling
- AI SDK for OpenAI integration
- Eslint and Prettier for linting
- pnpm as package manager

## Architecture Guidelines
- **Component Extraction**: When a component becomes longer than 50-60 lines, consider extracting reusable parts into separate components.
- **Single Responsibility**: Each component should have one clear purpose. If a component handles multiple concerns, break it down.
- Keep constants centralized in `src/constants.ts`.
- Use the App Router pattern with `src/app/` directory structure.
- Reference `docs/architecture/current-architecture.md` before planning any new work.
- Update `docs/architecture/current-architecture.md` after performing any work.
- The system prompt in `prompts.ts` is critical. Do NOT change it unless explicitly instructed.

## Development Workflow
- CRITICAL: Always work in small increments. Implement the smallest change needed to complete a task. NO EXCEPTIONS.
- PREOPTIMIZATION FORBIDDEN: Do not add complexity, variants, or "future-proofing" features. Build exactly what is requested, nothing more.
- Follow test driven development. Before writing production code, write failing tests first.
- When writing production code, attempt to make the failing tests pass. Do NOT attempt to modify the test to make it pass.
- After completing each unit of work, run the lint, typecheck, build and test commands and attempt to fix any failures.
- Do NOT commit code unless explicitly instructed.
- Use pnpm for package management (`pnpm install`, `pnpm dev`, etc.)

## Code Style
- Use TypeScript interfaces for all component props
- Prefer explicit types instead of `any`
- Follow React functional component patterns with hooks
- Use Tailwind CSS classes for styling
- Maintain consistent error handling patterns
- Prefer destructuring props in component parameters
- Always run `pnpm types` to verify TypeScript types before committing changes

## Planning Guidelines

When entering plan mode for any feature or fix:

### Test Strategy Priority
Follow TDD. When deciding what tests to write, use this priority order:
1. **Integration tests** should be used for most tests. Avoid internal mocks, only mock at the boundary of 3rd party libraries or at network calls. If the behavior under test depends on both UI and Server logic, consider implementing an E2E test instead.
2. **E2E tests** (Playwright). Use to test main workflows, or when the behavior under test depends on both UI and Server behavior. If possible, `page.route()` to mock backend API calls.
3. **Unit tests** only as a last resort, or for pure utility functions with no meaningful integration surface.

When choosing a test level, explain in the plan *why* a test in a higher priority was ruled out.

### Pseudocode
Include pseudocode for non-trivial logic — especially for new data flows, state management changes, and stream parsing. Pseudocode should be close enough to the real implementation to be directly translatable.

### Plan Output
Save plans as `.md` files to `.claude/plans/` in the project root (not `~/.claude/plans/`).

### Test Philosophy
- Test user-visible behavior, not implementation details.
- Prefer fewer, broader tests over many narrow ones.
- Minimize mocks; use real implementations where possible. When mocking is necessary (e.g., external APIs, LLMs), mock at the network boundary (e.g., `page.route()`, `vi.stubGlobal('fetch', ...)`), not at the module level.

### Test File Organization
- Unit tests: `tests/unit/ComponentName.test.tsx`
- Integration tests: `tests/integration/FeatureName.test.ts`
- E2E tests: `tests/e2e/UserWorkflow.spec.ts`

## File Organization
- Keep components in `src/components/`
- API routes in `src/app/api/`
- Constants and configuration in `src/constants.ts`
- System prompts in `src/app/prompts.ts`
- Global styles in `src/app/globals.css`

## UI/UX Guidelines
- Maintain the existing chat interface design
- Keep the responsive design with max-width constraints
- Preserve any loading states and disabled states
- Maintain accessibility with proper ARIA labels and keyboard navigation

## Environment
- Run `nvm use` before running commands in this project

## Playwright
- Don't automatically open the report after running end-to-end tests

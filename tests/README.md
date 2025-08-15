# Testing Setup

This project uses Vitest for unit/integration tests and Playwright for end-to-end tests.

## Directory Structure

```
tests/
├── unit/          # Unit tests for individual components
├── integration/   # Integration tests for API endpoints
├── e2e/          # End-to-end tests using Playwright
├── setup.ts      # Test setup configuration
└── README.md     # This file
```

## Running Tests

### Unit and Integration Tests (Vitest)

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
pnpm test:e2e:install

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## Writing Tests

### Unit Tests
- Use `@testing-library/react` for React component testing
- Place unit tests in `tests/unit/`
- Test individual components and functions

### Integration Tests
- Test API endpoints and component interactions
- Place integration tests in `tests/integration/`
- Use Vitest's HTTP server capabilities

### E2E Tests
- Test complete user workflows
- Place E2E tests in `tests/e2e/`
- Use Playwright's browser automation

## Test Configuration

- **Vitest**: Configured in `vitest.config.ts`
- **Playwright**: Configured in `playwright.config.ts`
- **Setup**: Global test setup in `tests/setup.ts`

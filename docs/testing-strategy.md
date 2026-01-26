# Testing Strategy

## Core Principles

- **Follow Test-Driven Development (TDD)**: Write failing tests first, then implement code to make them pass. Important: if the tests do not run, do not continue with development!
- **Test User Behavior, Not Implementation**: Test what users can do/see, not internal functions
- **Prefer Integration Tests**: Test components and features working together, not isolated units
- **Minimize Mocks**: Only mock external dependencies (APIs, file system), not internal logic
- **Use Arrange-Act-Assert Pattern**: Structure tests as setup → action → verification
- **Coverage Focus**: Aim for meaningful coverage of user workflows, not 100% line coverage

## Test File Organization

- Unit tests: `tests/unit/ComponentName.test.tsx`
- Integration tests: `tests/integration/FeatureName.test.ts`
- E2E tests: `tests/e2e/UserWorkflow.spec.ts`

## Test Naming

Use descriptive names like "should display error when API fails" not "test1"

## Selectors

Prefer semantic elements (button, input, etc.) and aria-role attributes over CSS classes. Fall back to data-testid for complex selectors.

## Test Template on a React Component (Arrange-Act-Assert)

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  beforeEach(() => {
    // any setup used by all tests can be setup here
    global.fetch = vi.fn();
    const user = userEvent.setup()

  })

  afterEach(vi.restoreAllMocks)

  it('should display success message when form is submitted', async () => {
    // Arrange
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    render(<MyComponent />)

    // Act
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    })
    expect(fetch).toHaveBeenCalledWith('/api/forms', expect.objectContaining({
      method: 'POST',
    }))
  })
})
```

## Test Template for API Route (with upstream API and database)

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/chat/route'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { NextRequest } from 'next/server'

// Mock external dependencies
vi.mock('@/lib/supabase/server')
vi.mock('ai')

describe('POST /api/chat', () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

  beforeEach(() => {
    // Mock AI SDK
    vi.mocked(generateText).mockResolvedValue({
      text: 'Hello!',
    } as any)

    // Mock database client
    vi.mocked(createClient).mockReturnValue({
      from: mockFrom,
    } as any)
  })

  afterEach(vi.restoreAllMocks)

  it('should return response from AI', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.content).toBe('Hello!')

    // Verify AI SDK was called correctly
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hi' }],
      })
    )

    // Verify database was called correctly
    expect(mockFrom).toHaveBeenCalledWith('chat_history')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Hello!',
      })
    )
  })
})
```

## Tools

### Vitest (Unit/Integration)
- **Config**: Uses defaults (no vitest.config.ts)
- **Libraries**: @testing-library/react, @testing-library/jest-dom, jsdom
- **Commands**:
  - `pnpm test` — watch mode
  - `pnpm test:run` — single run
  - `pnpm test:ui` — interactive UI
  - `pnpm test:coverage` — with coverage report

### Playwright (E2E)
- **Config**: `playwright.config.ts`
- **Test directory**: `tests/e2e/`
- **Browsers**: Chromium, Firefox, WebKit
- **Base URL**: http://localhost:3000
- **Commands**:
  - `pnpm test:e2e` — run all E2E tests
  - `pnpm test:e2e:ui` — interactive UI mode
  - `pnpm test:e2e:install` — install browsers

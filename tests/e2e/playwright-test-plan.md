# Playwright E2E Test Plan

## Overview
This plan follows the Testing Guidelines: **Test User Behavior, Not Implementation** and focuses on **meaningful coverage of user workflows** rather than 100% line coverage.

## Core User Flows to Test

### 1. Authentication & Initial Page Load - DONE
**File**: `tests/e2e/page-load.spec.ts`

**User Behaviors to Test**:
- User is redirected to login page when not authenticated
- User can log in with valid credentials
- After successful login, user is redirected to main page
- Main page loads with correct title "A&P Memory Lab Tutor"
- Teacher image displays correctly
- Chat interface is visible and accessible
- Model information displays correctly
- Page is responsive on different screen sizes
- Main page logs out

**Test Cases**:
- `should redirect to login page when not authenticated`
- `should allow login with valid test credentials`
- `should redirect to main page after successful login`
- `should load the main page with all elements visible`
- `should display teacher image and title correctly`
- `should be responsive on mobile and desktop`
- `should show correct model information`
- `should logout again`

### 2. Chat Interface Interaction
**File**: `tests/e2e/chat-interface.spec.ts`

**User Behaviors to Test**:
- User can type in the input field
- Send button is disabled when input is empty
- Send button is disabled during AI response
- Input field is disabled during AI response
- User can submit messages by pressing Enter
- User can submit messages by clicking send button

**Test Cases**:
- `should allow typing in chat input`
- `should disable send button when input is empty`
- `should disable input and send button during AI response`
- `should submit message on Enter key press`
- `should submit message on send button click`

### 3. Message Display & History
**File**: `tests/e2e/message-display.spec.ts`

**User Behaviors to Test**:
- User messages appear immediately after sending
- Messages are displayed in chronological order
- Messages scroll to bottom when new message arrives
- Loading indicator shows "AI is thinking..." during response
- Sticky banner appears when enough messages are added to scroll past 300px

**Test Cases**:
- `should display user message immediately after sending`
- `should show loading indicator during AI response`
- `should display AI response when received`
- `should scroll to bottom for new messages`
- `should show sticky banner when scrolling down`


### 4. AI Response & Error Handling
**File**: `tests/e2e/ai-response.spec.ts`

**User Behaviors to Test**:
- Error message displays if API fails
- User can continue chatting after errors
- Response time is reasonable (within 30 seconds)

**Test Cases**:
- `should display error message when API fails`
- `should allow continued conversation after error`
- `should complete response within reasonable time`

### 5. Accessibility & Keyboard Navigation
**File**: `tests/e2e/accessibility.spec.ts`

**User Behaviors to Test**:
- All interactive elements are keyboard accessible
- Focus indicators are visible
- Screen reader compatibility
- ARIA labels are present and meaningful

**Test Cases**:
- `should be navigable by keyboard only`
- `should have visible focus indicators`
- `should have proper ARIA labels`
- `should work with screen readers`

### Arrange-Act-Assert Pattern:
```typescript
// Arrange - Set up the test scenario
await page.goto('/')
await page.fill('[placeholder="Type your message..."]', 'What is the heart?')

// Act - Perform the user action
await page.click('button[type="submit"]')

// Assert - Verify the expected behavior
await expect(page.locator('.message')).toContainText('What is the heart?')
await expect(page.locator('.loading')).toBeVisible()
```

## Test File Organization

```
tests/e2e/
├── page-load.spec.ts          # Page loading and navigation
├── chat-interface.spec.ts     # Chat input and submission
├── message-display.spec.ts    # Message rendering and history
├── ai-response.spec.ts        # AI responses and error handling
└── accessibility.spec.ts      # Accessibility and keyboard navigation
```


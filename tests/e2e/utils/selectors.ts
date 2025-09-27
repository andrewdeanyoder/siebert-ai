/**
 * Common selectors used across e2e tests
 * Centralized for consistency and easier maintenance
 */

export const selectors = {
  mainLayout: 'main',
  pageHeading: 'h1',
  teacherImage: 'img[alt="Teacher"]',
  emailInput: 'input[name="email"]',
  passwordInput: 'input[name="password"]',
  messageInput: 'textarea[placeholder*="message"]',
  loginButton: 'button:has-text("Log in")',
  signupButton: 'button:has-text("Sign up")',
  submitButton: 'button[type="submit"]',
  logoutButton: 'button:has-text("Log Out")',
  poweredBySpan: 'span:has-text("Powered by")',
  systemPromptUpdatedSpan: 'text=System Prompt last updated',
} as const

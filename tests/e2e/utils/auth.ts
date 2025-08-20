import { Page } from '@playwright/test'
import { selectors } from './selectors'

/**
 * Helper function to log in a user for e2e tests
 * @param page - Playwright page object
 */
export async function loginUser(
  page: Page,
) {
  // Navigate to login page
  await page.goto('/login')

  // Fill in credentials
  await page.fill(selectors.emailInput, process.env.TEST_USER_EMAIL || 'test@example.com')
  await page.fill(selectors.passwordInput, process.env.TEST_USER_PASSWORD || 'testpassword')

  // Submit login form
  await page.click(selectors.loginButton)

  // Wait for redirect to main page
  await page.waitForURL('/')
}

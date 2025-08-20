import { test, expect } from '@playwright/test'
import { loginUser } from './utils/auth'
import { selectors } from './utils/selectors'

test.describe('Authentication & Initial Page Load', () => {
  test('should redirect to login page when not authenticated', async ({ page }) => {
    // Arrange - Navigate to the page without authentication
    await page.goto('/')

    // Assert - Should be redirected to login page
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator(selectors.emailInput)).toBeVisible()
    await expect(page.locator(selectors.passwordInput)).toBeVisible()

    // Assert - Login and signup buttons are present
    await expect(page.locator(selectors.loginButton)).toBeVisible()
    await expect(page.locator(selectors.signupButton)).toBeVisible()
  })

  test('should load the main page with all elements visible after login', async ({ page }) => {
    // Arrange - Login first
    await loginUser(page)

    // Assert - Check that all main elements are visible
    await expect(page).toHaveURL('/')
    await expect(page).toHaveTitle(/A&P Memory Lab Tutor/)
    await expect(page.locator(selectors.pageHeading)).toContainText('A&P Memory Lab Tutor')
    await expect(page.locator(selectors.teacherImage)).toBeVisible()
    await expect(page.locator(selectors.messageInput)).toBeVisible()
    await expect(page.locator(selectors.submitButton)).toBeVisible()
  })

  test('should display teacher image and title correctly after login', async ({ page }) => {
    // Arrange - Login first
    await loginUser(page)

    // Assert - Check teacher image and title
    const teacherImage = page.locator(selectors.teacherImage)
    await expect(teacherImage).toBeVisible()
    // Next.js optimizes images, so we check that src contains the original filename
    await expect(teacherImage).toHaveAttribute('src', /teacher\.jpeg/)

    const title = page.locator(selectors.pageHeading)
    await expect(title).toContainText('A&P Memory Lab Tutor')
    await expect(title).toHaveClass(/text-3xl/)
  })

  test('should be responsive on mobile and desktop after login', async ({ page }) => {
    // Arrange - Login first
    await loginUser(page)

    // Assert - Desktop layout (default)
    await expect(page.locator(selectors.mainLayout)).toHaveClass(/sm:items-start/)

    // Act - Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Assert - Mobile layout adjustments
    await expect(page.locator(selectors.mainLayout)).toHaveClass(/items-center/)

    // Act - Switch back to desktop
    await page.setViewportSize({ width: 1280, height: 720 })

    // Assert - Desktop layout restored
    await expect(page.locator(selectors.mainLayout)).toHaveClass(/sm:items-start/)
  })

  test('should show correct model information after login', async ({ page }) => {
    // Arrange - Login first
    await loginUser(page)

    // Assert - Model information is displayed
    await expect(page.locator(selectors.poweredBySpan)).toBeVisible()
    // TODO: Check the actual model name from constants
    await expect(page.locator(selectors.poweredBySpan)).toContainText('gpt')
  })

  test.only('should logout and redirect to login page', async ({ page }) => {
    // Arrange - Login first
    await loginUser(page)

    // Assert - Verify we're on the main page
    await expect(page).toHaveURL('/')

    // Assert - Logout button is visible
    await expect(page.locator(selectors.logoutButton)).toBeVisible()

    // Act - Click logout button
    await page.click(selectors.logoutButton)

    // Assert - Should be redirected to login page
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator(selectors.emailInput)).toBeVisible()
    await expect(page.locator(selectors.passwordInput)).toBeVisible()
  })
})

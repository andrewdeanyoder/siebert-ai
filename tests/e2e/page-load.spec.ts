import { test, expect } from '@playwright/test'

test.describe('Page Load & Navigation', () => {
  test('should load the main page with all elements visible', async ({ page }) => {
    // Arrange - Navigate to the page
    await page.goto('/')

    // Assert - Check that all main elements are visible
    await expect(page).toHaveTitle(/A&P Memory Lab Tutor/)
    await expect(page.locator('h1')).toContainText('A&P Memory Lab Tutor')
    await expect(page.locator('img[alt="Teacher"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="message"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display teacher image and title correctly', async ({ page }) => {
    // Arrange - Navigate to the page
    await page.goto('/')

    // Assert - Check teacher image and title
    const teacherImage = page.locator('img[alt="Teacher"]')
    await expect(teacherImage).toBeVisible()
    // Next.js optimizes images, so we check that src contains the original filename
    await expect(teacherImage).toHaveAttribute('src', /teacher\.jpeg/)

    const title = page.locator('h1')
    await expect(title).toContainText('A&P Memory Lab Tutor')
    await expect(title).toHaveClass(/text-3xl/)
  })

  test('should be responsive on mobile and desktop', async ({ page }) => {
    // Arrange - Navigate to the page
    await page.goto('/')

    // Assert - Desktop layout (default)
    await expect(page.locator('main')).toHaveClass(/sm:items-start/)

    // Act - Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Assert - Mobile layout adjustments
    await expect(page.locator('main')).toHaveClass(/items-center/)

    // Act - Switch back to desktop
    await page.setViewportSize({ width: 1280, height: 720 })

    // Assert - Desktop layout restored
    await expect(page.locator('main')).toHaveClass(/sm:items-start/)
  })

  test('should show correct model information', async ({ page }) => {
    // Arrange - Navigate to the page
    await page.goto('/')

    // Assert - Model information is displayed
    await expect(page.locator('span:has-text("Powered by")')).toBeVisible()
    // Note: We'll need to check the actual model name from constants
    await expect(page.locator('span:has-text("Powered by")')).toContainText('gpt')
  })
})

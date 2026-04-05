import { test, expect } from '@playwright/test'
import { loginUser } from './utils/auth'
import { selectors } from './utils/selectors'

const MOCK_STREAM = [
  '2:[{"references":[{"documentName":"anatomy.pdf","pageNumber":1,"snippet":"The heart has four chambers.","similarity":0.9},{"documentName":"physiology.pdf","pageNumber":3,"snippet":"The ventricles pump blood.","similarity":0.75}]}]\n',
  '0:"The "\n',
  '0:"heart "\n',
  '0:"has "\n',
  '0:"four "\n',
  '0:"chambers."\n',
  'd:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":5}}\n',
].join('')

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/chat', (route) =>
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-vercel-ai-data-stream': 'v1',
        },
        body: MOCK_STREAM,
      })
    )
    await loginUser(page)
  })

  test('streams response text into the assistant message', async ({ page }) => {
    await page.fill(selectors.messageInput, 'How many chambers does the heart have?')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=How many chambers does the heart have?')).toBeVisible()
    await expect(page.locator('text=The heart has four chambers.')).toBeVisible({ timeout: 10000 })
  })

  test('hides the thinking indicator after streaming completes', async ({ page }) => {
    await page.fill(selectors.messageInput, 'What is the heart?')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=The heart has four chambers.')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=AI is thinking...')).not.toBeVisible()
  })

  test('displays references after streaming completes', async ({ page }) => {
    await page.fill(selectors.messageInput, 'What is the heart?')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=The heart has four chambers.')).toBeVisible({ timeout: 10000 })

    // Toggle is collapsed by default showing the source count
    await expect(page.locator('text=2 sources')).toBeVisible()

    // Expand references
    await page.getByRole('button', { name: /2 sources/ }).click()

    // Both references should now be visible with correct metadata
    await expect(page.locator('text=anatomy.pdf')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=(Page 1)')).toBeVisible()
    await expect(page.locator('text=90% match')).toBeVisible()

    await expect(page.locator('text=physiology.pdf')).toBeVisible()
    await expect(page.locator('text=(Page 3)')).toBeVisible()
    await expect(page.locator('text=75% match')).toBeVisible()
  })

  test('input re-enables after streaming completes', async ({ page }) => {
    await page.fill(selectors.messageInput, 'What is the heart?')
    await page.keyboard.press('Enter')

    await expect(page.locator('text=The heart has four chambers.')).toBeVisible({ timeout: 10000 })
    await expect(page.locator(selectors.messageInput)).toBeEnabled()
  })
})

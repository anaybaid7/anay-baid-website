import { test, expect } from '@playwright/test'

test('loads with every section', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (const name of ['Experience', 'Projects', 'Education', 'Skills', 'Recently on GitHub']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
  }
})

test('the resume button downloads the real PDF', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Resume' })).toBeVisible()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PDF' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('Anay_Baid_Resume.pdf')
})


test('no horizontal scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(375)
})

test('the service worker registers', async ({ page }) => {
  await page.goto('/')
  const registered = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready
    return Boolean(reg.active)
  })
  expect(registered).toBe(true)
})

test('the theme switch flips to dark and remembers it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /switch to dark mode/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('the search menu finds a project and opens it', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox').fill('pashu')
  await page.keyboard.press('Enter')
  await expect(page.locator('#project-pashu')).toHaveAttribute('open', '')
  await expect(page).toHaveURL(/#project-pashu$/)
})

test('a skill shows where it was used', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Docker', exact: true }).click()
  await expect(page.locator('.evidence')).toContainText('Purolator')
})

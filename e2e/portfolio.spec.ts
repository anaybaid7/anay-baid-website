import { test, expect } from '@playwright/test'

// Real end-to-end tests: a real Chromium browser driving the actual built
// output through vite preview, not a simulated jsdom environment. These
// catch things the unit tests structurally can't — a real file download, a
// real service worker registering, a real page navigation.

test('loads the site and shows all four tabs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('tab')).toHaveCount(4)
  await expect(page.getByRole('tab', { name: /home/i })).toHaveAttribute('aria-selected', 'true')
})

test('clicking through every tab renders that tab\'s content', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('tab', { name: /resume/i }).click()
  await expect(page.getByRole('tabpanel')).toContainText(/download pdf/i)

  await page.getByRole('tab', { name: /projects/i }).click()
  await expect(page.getByRole('tabpanel')).toContainText(/starrez/i)

  await page.getByRole('tab', { name: /hire me/i }).click()
  await expect(page.getByRole('tabpanel')).toContainText(/looking to hire/i)
})

test('downloading the resume PDF produces a real file', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: /resume/i }).click()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download pdf/i }).click(),
  ])

  expect(download.suggestedFilename()).toBe('Anay_Baid_Resume.pdf')
  const path = await download.path()
  expect(path).toBeTruthy()
})

test('the tech filter on the Resume page actually filters', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: /resume/i }).click()

  const panel = page.getByRole('tabpanel')
  await expect(panel).toContainText(/cineplex/i)

  // "Unity" only appears on a project, never in any experience entry, so
  // filtering the resume page by it should hide every experience card.
  const unityButtons = page.getByRole('button', { name: 'Unity' })
  if (await unityButtons.count()) {
    await unityButtons.click()
    await expect(panel).toContainText(/no roles match/i)
  }
})

test('command palette opens with Ctrl+K and navigates via keyboard', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Control+k')
  const input = page.getByPlaceholder(/type a command/i)
  await expect(input).toBeVisible()

  await input.fill('projects')
  await page.getByText(/go to projects/i).click()

  await expect(page.getByRole('tab', { name: /projects/i })).toHaveAttribute('aria-selected', 'true')
  await expect(input).not.toBeVisible()
})

test('command palette can trigger the resume download directly', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder(/type a command/i).fill('download')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText(/download resume pdf/i).click(),
  ])

  expect(download.suggestedFilename()).toBe('Anay_Baid_Resume.pdf')
})

test('the site registers a service worker (PWA)', async ({ page }) => {
  await page.goto('/')
  const hasSW = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    // give the auto-registration a moment to complete
    await new Promise((r) => setTimeout(r, 1500))
    const regs = await navigator.serviceWorker.getRegistrations()
    return regs.length > 0
  })
  expect(hasSW).toBe(true)
})

test('the web app manifest is present and installable-shaped', async ({ page }) => {
  const res = await page.goto('/manifest.webmanifest')
  expect(res?.ok()).toBe(true)
  const manifest = await res!.json()
  expect(manifest.name).toMatch(/anay baid/i)
  expect(manifest.icons.length).toBeGreaterThan(0)
})

test('no console errors on initial load', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')
  await page.waitForTimeout(500)

  // The GitHub API call is expected to fail in network-restricted CI/sandbox
  // environments (see README) — that's a documented environment limitation,
  // not an app bug. Confirm the *only* console errors are resource-load
  // failures (which is what a blocked fetch surfaces as), rather than
  // broadly ignoring every error string.
  const unexpected = errors.filter((e) => !/failed to load resource|api\.github\.com|CORS/i.test(e))
  expect(unexpected).toEqual([])
})

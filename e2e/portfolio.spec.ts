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
  await page.getByRole('button', { name: /dark mode/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('the search menu finds a project and opens it', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox').fill('pashu')
  await page.keyboard.press('Enter')
  await expect(page.locator('#project-pashu')).toBeInViewport()
  await expect(page).toHaveURL(/#project-pashu$/)
})

test('settings open as a popover, apply, and stick after a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByText('Results only').click()
  // let the crossfade finish, clicks during a view transition land on its snapshot
  await page.waitForTimeout(400)
  await page.getByText('Red', { exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-view', 'skim')
  await expect(page.locator('#job-purolator .dashes')).toBeHidden()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'red')
})

test('a pasted job posting filters the page and the filter survives in the link', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('m')
  await page.getByRole('textbox', { name: 'Job posting' }).fill('Selenium and Mocha for test automation')
  await page.getByRole('button', { name: /show only/i }).click()
  await expect(page.locator('#job-iotum')).not.toHaveClass(/dim/)
  await expect(page.locator('#job-purolator')).toHaveClass(/dim/)
  const shared = page.url()
  await page.goto(shared)
  await expect(page.locator('.filterbar')).toContainText('Selenium')
  await page.keyboard.press('Escape')
  await expect(page.locator('.filterbar')).toHaveCount(0)
})

test('the contact card downloads', async ({ page }) => {
  await page.goto('/')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Save contact card' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('anay-baid.vcf')
})

test("a project's build steps open and explain each step", async ({ page }) => {
  await page.goto('/')
  const card = page.locator('#project-insightvault')
  await card.getByText("How it's built").click()
  await card.getByRole('button', { name: 'Spring Boot API' }).click()
  await expect(card.locator('.flow-note')).toContainText('rule engine')
})

test('the build publishes the resume as plain text and JSON Resume', async ({ request }) => {
  const txt = await request.get('/resume.txt')
  expect(txt.ok()).toBe(true)
  expect(await txt.text()).toContain('Software & Network Optimization Engineer, Purolator Inc')
  const json = await (await request.get('/resume.json')).json()
  expect(json.basics.name).toBe('Anay Baid')
})

test('the skills table sorts and filters the page', async ({ page }) => {
  await page.goto('/')
  const table = page.locator('.skill-table')
  await table.getByRole('button', { name: /^Skill/ }).click()
  await expect(table.locator('tbody th').first()).toHaveText('Airflow')
  await table.getByRole('button', { name: 'Terraform' }).click()
  await expect(page.locator('.filterbar')).toContainText('Terraform')
})

test('a shared view link reorders and hides sections', async ({ page }) => {
  await page.goto('/?lead=projects&hide=github,colophon')
  const projectsTop = await page.locator('#projects').evaluate((el) => el.getBoundingClientRect().top)
  const experienceTop = await page.locator('#experience').evaluate((el) => el.getBoundingClientRect().top)
  expect(projectsTop).toBeLessThan(experienceTop)
  await expect(page.locator('[data-part="github"]')).toBeHidden()
  await expect(page.locator('[data-part="colophon"]')).toBeHidden()
})

test('the page map jumps to a project', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const mark = page.locator('.minimap a[href="#project-pashu"]')
  await mark.click()
  await expect(page).toHaveURL(/#project-pashu$/)
  await expect(page.locator('#project-pashu')).toBeInViewport()
})

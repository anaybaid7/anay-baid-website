import { test, expect } from '@playwright/test'

test('loads with every section', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (const name of ['Experience', 'Projects', 'Education', 'Skills', 'Code']) {
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
  await expect(page.locator('dialog.drawer #drawer-title')).toHaveText('Pashu (Animal Welfare Game)')
  await expect(page).toHaveURL(/open=project-pashu/)
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
  await page.goto('/?me')
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

test('the build publishes the resume as plain text and JSON Resume', async ({ request }) => {
  const txt = await request.get('/resume.txt')
  expect(txt.ok()).toBe(true)
  expect(await txt.text()).toContain('Software & Network Optimization Engineer, Purolator Inc')
  const json = await (await request.get('/resume.json')).json()
  expect(json.basics.name).toBe('Anay Baid')
})

test('clicking a skill filters the page', async ({ page }) => {
  await page.goto('/')
  await page.locator('.skill-list').getByRole('button', { name: 'Terraform' }).click()
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

test('a job opens into a drawer with a working diagram, and Esc closes it', async ({ page }) => {
  await page.goto('/')
  await page.locator('#job-purolator .entry-tabs').getByRole('button', { name: 'How it works' }).click()
  const drawer = page.locator('dialog.drawer')
  await expect(drawer).toBeVisible()
  await expect(page).toHaveURL(/open=job-purolator/)
  await drawer.locator('.arch-node[data-node="sm"]').click()
  await expect(drawer.locator('.flow-detail')).toContainText('forecasting model')
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(page).not.toHaveURL(/open=/)
})

test('a Battleship round sends shots over the socket and the bot answers', async ({ page }) => {
  await page.goto('/?open=project-battleship-for-purolator&tab=play')
  await page.getByRole('button', { name: 'Random' }).click()
  await page.getByRole('button', { name: 'Lock in routes' }).click()
  await page.getByRole('button', { name: 'D4', exact: true }).click()
  const log = page.locator('dialog.drawer .log')
  await expect(log).toContainText('emit fire { index: 27 }')
  await expect(log).toContainText('nextTurn: "you"')
})

test('the pipeline stops on a bad record and recovers when the task is cleared', async ({ page }) => {
  await page.goto('/?open=job-purolator&tab=try&motion=reduced')
  const drawer = page.locator('dialog.drawer')
  await drawer.getByLabel('Add a bad record to the export').check()
  await drawer.getByRole('button', { name: 'Trigger a run' }).click()
  await drawer.getByRole('button', { name: 'Fix the record, clear validate' }).click()
  await expect(drawer.locator('.pipe-facts')).toContainText('success')
})

test('a flow plays through and a demo responds', async ({ page }) => {
  await page.goto('/?open=project-insightvault&tab=how')
  const drawer = page.locator('dialog.drawer')
  await drawer.getByRole('button', { name: 'Next step' }).click()
  await expect(drawer.locator('.arch-count')).toHaveText(/Step 1 of/)
  await expect(drawer.locator('.flow-payload')).toContainText('POST /api/transactions/score')
  await drawer.getByRole('tab', { name: 'Try it' }).click()
  await drawer.getByRole('tab', { name: 'Score one transaction' }).click()
  await drawer.getByLabel(/Different country/).check()
  await drawer.getByLabel(/New merchant/).check()
  await expect(drawer.locator('.verdict')).toContainText('Alert')
})

test('the terminal runs commands and opens the drawer', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('`')
  const cmd = page.getByRole('textbox', { name: 'Command' })
  await cmd.fill('grep sagemaker')
  await cmd.press('Enter')
  await expect(page.locator('.term-screen')).toContainText('purolator')
  await cmd.fill('open insi')
  await cmd.press('Tab')
  await expect(cmd).toHaveValue('open insightvault ')
  await cmd.fill('open insightvault code')
  await cmd.press('Enter')
  await expect(page.locator('dialog.drawer .code figcaption')).toContainText('score.ts')
})

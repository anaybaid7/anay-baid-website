import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// WCAG 2.1 AA checks on the page and every drawer tab, in both themes
const scan = (page: import('@playwright/test').Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

const show = (v: { id: string; impact?: string | null; nodes: { target: unknown[] }[] }[]) =>
  v.map((x) => `${x.id} (${x.impact}): ${x.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`)

for (const theme of ['light', 'dark']) {
  test(`the page has no accessibility violations, ${theme}`, async ({ page }) => {
    await page.goto(`/?theme=${theme}&motion=reduced`)
    await page.waitForTimeout(400)
    const r = await scan(page)
    expect(show(r.violations)).toEqual([])
  })

  for (const tab of ['how', 'decisions', 'screens', 'try', 'code']) {
    test(`a drawer's ${tab} tab has no accessibility violations, ${theme}`, async ({ page }) => {
      await page.goto(`/?open=project-battleship-for-purolator&tab=${tab}&theme=${theme}&motion=reduced`)
      await page.locator('dialog.drawer #drawer-title').waitFor()
      await page.waitForTimeout(300)
      const r = await scan(page)
      expect(show(r.violations)).toEqual([])
    })
  }
}

const ENTRIES = [
  'job-purolator',
  'job-iotum',
  'job-nationwide-appraisals',
  'job-cineplex-entertainment',
  'project-insightvault',
  'project-starrez-enterprise-automation-suite',
  'project-ci-cd-build-automation-tool',
  'project-pashu',
  'project-client-side-routing-system',
]

for (const id of ENTRIES) {
  test(`every tab of ${id} has no accessibility violations`, async ({ page }) => {
    for (const tab of ['how', 'decisions', 'screens', 'try', 'code']) {
      await page.goto(`/?open=${id}&tab=${tab}&motion=reduced`)
      await page.locator('dialog.drawer #drawer-title').waitFor()
      await page.waitForTimeout(200)
      const r = await scan(page)
      expect(show(r.violations), `${id} ${tab}`).toEqual([])
    }
  })
}

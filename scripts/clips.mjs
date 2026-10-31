// Records a short loop of each featured demo being used, in light and dark,
// into public/clips. Run against a built preview, like shots.mjs:
// node scripts/clips.mjs [base url]. Needs ffmpeg with libvpx-vp9 and libx264.
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] ?? 'http://localhost:4173'
const W = 1100
const H = 1500
const pause = (p, ms) => p.waitForTimeout(ms)

// what each clip does, a few seconds of real use
const CLIPS = {
  planner: {
    id: 'job-purolator',
    async play(p) {
      const rows = p.locator('.demo tbody tr')
      await rows.nth(6).click()
      await rows.nth(9).click({ modifiers: ['Shift'] })
      await pause(p, 500)
      await p.getByRole('spinbutton', { name: 'Value' }).fill('12')
      await pause(p, 400)
      await p.getByRole('button', { name: 'Apply' }).click()
      await pause(p, 1400)
      await rows.nth(2).click()
      await pause(p, 400)
      await p.getByRole('button', { name: 'Apply' }).click()
      await pause(p, 1600)
      await p.getByRole('button', { name: 'Revert all' }).click()
      await pause(p, 900)
    },
  },
  evaluate: {
    id: 'project-insightvault',
    async play(p) {
      const slider = p.locator('.eval input[type=range]')
      for (const v of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]) {
        await slider.fill(String(v))
        await pause(p, 330)
      }
    },
  },
  extension: {
    id: 'project-starrez-enterprise-automation-suite',
    async play(p) {
      await p.getByRole('button', { name: /Copy 2 pkgs/ }).click()
      await pause(p, 2200)
      await p.getByRole('button', { name: 'Copy Lockout' }).click()
      await pause(p, 500)
      const reason = p.getByRole('textbox', { name: 'Reason' })
      await reason.fill('')
      await reason.pressSequentially('locked out', { delay: 70 })
      await pause(p, 300)
      await p.locator('.sr-modal .demo-primary').click()
      await pause(p, 4500)
    },
  },
}

mkdirSync('public/clips', { recursive: true })
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
for (const theme of ['light', 'dark']) {
  // ONLY=extension rerecords just that one
  for (const [kind, clip] of Object.entries(CLIPS).filter(([k]) => !process.env.ONLY || process.env.ONLY.split(',').includes(k))) {
    const dir = mkdtempSync(join(tmpdir(), 'clip-'))
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, colorScheme: theme, recordVideo: { dir, size: { width: W, height: H } } })
    const p = await ctx.newPage()
    const t0 = Date.now()
    await p.goto(`${base}/?open=${clip.id}&tab=try&demo=${kind}`)
    await p.locator('.demo').first().waitFor()
    await pause(p, 1600)
    const d = await p.locator('.demo').first().boundingBox()
    const w = Math.min(d.width, 760)
    const box = { x: Math.round(d.x), y: Math.round(d.y), w: Math.round(w), h: Math.round(w / 1.6) }
    const start = (Date.now() - t0) / 1000
    await clip.play(p)
    const length = (Date.now() - t0) / 1000 - start
    await ctx.close()
    const raw = join(dir, readdirSync(dir).find((f) => f.endsWith('.webm')))
    // VP9 WebM for most browsers, H.264 MP4 for the ones without VP9
    const input = ['-y', '-loglevel', 'error', '-ss', String(start), '-t', String(length), '-i', raw, '-vf', `crop=${box.w}:${box.h}:${box.x}:${box.y},scale=960:-2`, '-an']
    execFileSync('ffmpeg', [...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', `public/clips/${kind}-${theme}.webm`])
    execFileSync('ffmpeg', [...input, '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `public/clips/${kind}-${theme}.mp4`])
    console.log(kind, theme, `${length.toFixed(1)}s`)
  }
}
await browser.close()

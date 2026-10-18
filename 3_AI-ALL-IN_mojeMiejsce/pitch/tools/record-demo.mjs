#!/usr/bin/env node
/**
 * Record the product walkthrough of Moje Miejsce for the showcase video.
 *
 * One continuous session (intro → survey → map → cinematic flyover → osiedle panel → 3D layers),
 * captured with the CDP screencast at device resolution (1600×900 CSS × 1.2 = 1920×1080), with a
 * drawn cursor and click ripples. Writes:
 *   assets/clips/walkthrough.mp4   (H.264, 30 fps CFR, rebuilt from frame timestamps)
 *   assets/clips/markers.json      (seconds from clip start for every scripted beat)
 *
 * Playwright is a one-off tool (kept out of package.json):
 *   mkdir -p /tmp/rec && cd /tmp/rec && npm i playwright && npx playwright install chromium
 *   cd application && npx vite --port 5176
 *   PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs node 3_AI-ALL-IN_mojeMiejsce/pitch/tools/record-demo.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE ?? 'http://localhost:5176'
const OUT = path.resolve(here, '../assets/clips')
const FRAMES = path.join(OUT, '.frames')
const FPS = 30

const pwPath = process.env.PLAYWRIGHT ?? 'playwright'
const { chromium } = await import(path.isAbsolute(pwPath) ? pathToFileURL(pwPath).href : pwPath)

/** Drawn cursor: macOS-style arrow + ripple on press (headless screencasts have no cursor). */
const CURSOR_SCRIPT = `
addEventListener('DOMContentLoaded', () => {
  const c = document.createElement('div')
  c.id = '__cursor'
  c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.3 4.2 7.6-2.8 1.5-4.2-7.6L5 19z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none',
    transform: 'translate(-100px,-100px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))', transition: 'opacity .3s' })
  document.documentElement.appendChild(c)
  addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + (e.clientX - 5) + 'px,' + (e.clientY - 3) + 'px)' }, true)
  addEventListener('mousedown', (e) => {
    const r = document.createElement('div')
    Object.assign(r.style, { position: 'fixed', left: e.clientX - 22 + 'px', top: e.clientY - 22 + 'px', width: '44px', height: '44px',
      borderRadius: '50%', border: '2px solid rgba(255,107,74,.9)', background: 'rgba(255,107,74,.18)', zIndex: 2147483646,
      pointerEvents: 'none', transform: 'scale(.3)', opacity: '1', transition: 'transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s' })
    document.documentElement.appendChild(r)
    requestAnimationFrame(() => { r.style.transform = 'scale(1.25)'; r.style.opacity = '0' })
    setTimeout(() => r.remove(), 600)
  }, true)
})`

rmSync(FRAMES, { recursive: true, force: true })
mkdirSync(FRAMES, { recursive: true })

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'] })
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.2 })
await ctx.addInitScript(CURSOR_SCRIPT)
const page = await ctx.newPage()
page.setDefaultTimeout(15000)

// ── screencast ─────────────────────────────────────────────────────────────
const frames = [] // { file, t }
let t0 = null
const cdp = await ctx.newCDPSession(page)
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  if (t0 === null) return
  const file = path.join(FRAMES, `${String(frames.length).padStart(6, '0')}.jpg`)
  writeFileSync(file, Buffer.from(data, 'base64'))
  frames.push({ file, t: metadata.timestamp })
})
const markers = {}
const mark = (name) => {
  markers[name] = +(Date.now() / 1000 - t0).toFixed(2)
  console.log('mark', name, markers[name])
}

// ── human-ish input ────────────────────────────────────────────────────────
let mouse = { x: 800, y: 450 }
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
async function moveTo(x, y, ms = 700) {
  const from = { ...mouse }
  const steps = Math.max(8, Math.round(ms / 16))
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps)
    await page.mouse.move(from.x + (x - from.x) * k, from.y + (y - from.y) * k)
    await page.waitForTimeout(ms / steps)
  }
  mouse = { x, y }
}
async function center(locator) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('no box for ' + locator)
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
async function hover(locator, ms) {
  const p = await center(locator)
  await moveTo(p.x, p.y, ms)
}
async function click(locator, ms = 700) {
  await hover(locator, ms)
  await page.waitForTimeout(140)
  await page.mouse.down()
  await page.waitForTimeout(90)
  await page.mouse.up()
}
async function dragSlider(locator, fraction, ms = 900) {
  const b = await locator.boundingBox()
  const thumb = await locator.evaluate((el) => (Number(el.value) - Number(el.min)) / (Number(el.max) - Number(el.min)))
  const pad = 8
  const xAt = (f) => b.x + pad + (b.width - 2 * pad) * f
  await moveTo(xAt(thumb), b.y + b.height / 2, 600)
  await page.mouse.down()
  await moveTo(xAt(fraction), b.y + b.height / 2, ms)
  await page.mouse.up()
}
async function wheel(dy, steps = 14, at) {
  if (at) await moveTo(at.x, at.y, 500)
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps)
    await page.waitForTimeout(28)
  }
}
const wait = (ms) => page.waitForTimeout(ms)
const cursorVisible = (on) => page.evaluate((on) => { const c = document.getElementById('__cursor'); if (c) c.style.opacity = on ? '1' : '0' }, on)

// ── script ─────────────────────────────────────────────────────────────────
// warm the HTTP cache (survey photos, tiles, 3D data) so the take has no loading stalls
await page.goto(BASE + '/mapa/natolin', { waitUntil: 'networkidle' })
await page.waitForTimeout(9000)
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.mouse.move(mouse.x, mouse.y)
await wait(1500)
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
t0 = Date.now() / 1000
mark('intro')
await moveTo(1150, 520, 1400)
await wait(400)
for (const name of ['Rodzina', 'Senior', 'Student']) {
  const chip = page.locator('button, [role=radio], span', { hasText: new RegExp('^' + name + '$') }).last()
  if (await chip.count()) { await click(chip, 650); await wait(900) }
}
await wait(300)
mark('start')
await click(page.getByRole('button', { name: 'Zacznij' }), 900)
await wait(1800)

mark('survey')
await click(page.getByRole('button', { name: 'Dalej' }))
await wait(1100)
mark('profile')
await hover(page.getByRole('radio', { name: /^Student/ }), 700)
await wait(300)
await hover(page.getByRole('radio', { name: /^Senior/ }), 700)
await wait(300)
await click(page.getByRole('radio', { name: /^Rodzina/ }), 700)
await wait(1500)
mark('priorities')
await click(page.locator('.priority-tile', { hasText: 'Gastronomia' }), 800)
await wait(700)
await click(page.locator('.priority-tile', { hasText: 'Kultura' }), 700)
await wait(700)
await click(page.getByRole('button', { name: 'Dalej' }), 800)
await wait(1100)
mark('horizon')
await click(page.getByRole('radio', { name: /^Kupno/ }), 800)
await wait(700)
await click(page.getByRole('button', { name: 'Pokaż mapę' }), 700)
await wait(500)
mark('map')
await wait(2600)
const gotIt = page.getByRole('button', { name: 'Rozumiem' })
if (await gotIt.count()) { await click(gotIt, 900); await wait(700) }

mark('sliders')
const sliders = page.locator('.smap-flt input[type=range]')
await dragSlider(sliders.nth(1), 1, 900) // Zieleń → 5
await wait(1300)
await dragSlider(sliders.nth(0), 0.2, 900) // Cisza → 1
await wait(1500)
mark('solo')
await hover(page.getByRole('button', { name: 'Sport', exact: true }), 800)
await wait(1700)
await hover(page.getByRole('button', { name: 'Edukacja', exact: true }), 600)
await wait(1700)
await hover(page.getByRole('button', { name: 'Komunikacja', exact: true }), 500)
await wait(1500)
await moveTo(1100, 560, 700)
await wait(900)

mark('pick')
await click(page.getByRole('button', { name: /^Natolin/ }), 1000)
mark('flyover')
await wait(350)
await cursorVisible(false)
await page.locator('.op__scroll').waitFor({ state: 'visible', timeout: 30000 })
mark('panel')
await page.mouse.move(1150, 480)
mouse = { x: 1150, y: 480 }
await wait(600)
await cursorVisible(true)
await wait(2600)

mark('compare')
await click(page.locator('.op-switch'), 900)
await wait(2200)

const panelPt = { x: 230, y: 600 }
mark('places')
await wheel(520, 18, panelPt)
await wait(2200)
mark('routes')
await page.locator('[data-section="Droga do…"]').evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
await wait(1200)
await click(page.getByRole('radio', { name: 'Przedszkole' }).first(), 900)
await wait(2600)
const bike = page.getByRole('tab', { name: /Rower/ })
if (await bike.count()) { await click(bike.first(), 700); await wait(1800) }

mark('commute')
await wheel(520, 18, panelPt)
await wait(2600)
mark('prices')
await wheel(560, 18, panelPt)
await wait(2600)
mark('timeline')
await page.locator('.op-tl, [data-section^="Oś czasu"]').first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
await wait(1300)
const teaser = page.locator('.op-teaser__btn')
if (await teaser.count()) { await click(teaser, 800); await wait(1200) }
const play = page.locator('.op-tl__play')
if (await play.count()) { await click(play, 800); await wait(5200) }

mark('layers')
await click(page.locator('summary.m3d-advanced__sum'), 1000)
await wait(900)
await click(page.locator('label.m3d-advanced__opt', { hasText: 'Kolory budynków' }), 700)
await wait(2600)
await click(page.locator('label.m3d-advanced__opt', { hasText: 'Korki na drogach' }), 700)
await wait(2200)
const dayPlay = page.getByRole('button', { name: 'Odtwórz dobę' })
if (await dayPlay.count()) { await click(dayPlay, 900); await wait(6000) }
mark('end')
await wait(500)

await cdp.send('Page.stopScreencast')
await browser.close()

// ── encode: frames carry wall-clock timestamps → concat with durations → CFR ──
const list = []
for (let i = 0; i < frames.length; i++) {
  const dur = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 1 / FPS
  list.push(`file '${frames[i].file}'`, `duration ${Math.max(dur, 0.001).toFixed(4)}`)
}
list.push(`file '${frames.at(-1).file}'`)
const listFile = path.join(FRAMES, 'list.txt')
writeFileSync(listFile, list.join('\n'))
// markers are relative to t0 (wall clock); the first frame may arrive a moment later
const offset = frames[0].t - t0
for (const k of Object.keys(markers)) markers[k] = +(markers[k] - offset).toFixed(2)
writeFileSync(path.join(OUT, 'markers.json'), JSON.stringify({ fps: FPS, frames: frames.length, duration: +(frames.at(-1).t - frames[0].t).toFixed(2), markers }, null, 2))
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
  '-vf', `scale=1920:1080:flags=lanczos,fps=${FPS}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', path.join(OUT, 'walkthrough.mp4')], { stdio: 'inherit' })
if (!process.argv.includes('--keep-frames')) rmSync(FRAMES, { recursive: true, force: true })
console.log(`frames ${frames.length}, avg fps ${(frames.length / (frames.at(-1).t - frames[0].t)).toFixed(1)}`)

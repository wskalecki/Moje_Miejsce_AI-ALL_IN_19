#!/usr/bin/env node
/**
 * Record the system walkthrough of Moje Miejsce for the silent system presentation (composition "System").
 *
 * One continuous session: intro → survey as a senior → map (preview layers, the top 3 reshuffling when
 * cisza/zieleń are dropped and gastronomia raised, then the profile restored) → Groszówka fly-in →
 * every section of the osiedle panel → timeline with investments → 3D map layers. CDP screencast at
 * 3200×1800 (DPR 2, sharp under the edit's zooms), drawn cursor. Writes:
 *   assets/clips/system.mp4          (H.264, 30 fps CFR)
 *   assets/clips/system-markers.json (seconds from clip start for every scripted beat)
 *
 * Playwright is a one-off tool (kept out of package.json):
 *   mkdir -p /tmp/rec && cd /tmp/rec && npm i playwright && npx playwright install chromium
 *   cd application && npx vite --port 5176
 *   PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs node "3_AI-ALL IN_Moje Miejsce/pitch/tools/record-system.mjs"
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE ?? 'http://localhost:5176'
const OUT = path.resolve(here, '../assets/clips')
const FRAMES = path.join(OUT, '.frames-system')
const FPS = 30
/** Device pixel ratio: 2 records 3200×1800 so the edit can zoom ~2× and stay sharp (1.2 = plain 1920×1080). */
const DPR = Number(process.env.DPR ?? 2)
const W = Math.round(1600 * DPR)
const H = Math.round(900 * DPR)

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
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: DPR })
await ctx.addInitScript(CURSOR_SCRIPT)
const page = await ctx.newPage()
page.setDefaultTimeout(8000)

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
const box = async (loc) => (await loc.boundingBox()) ?? (() => { throw new Error('no box') })()
/** Drag a 0–5 range input to `value`. */
async function setRange(loc, value, ms = 900) {
  const { min, max } = await loc.evaluate((el) => ({ min: Number(el.min || 0), max: Number(el.max || 100) }))
  await dragSlider(loc, (value - min) / (max - min), ms)
}
const panelScroll = (sel, block = 'start') =>
  page.locator(sel).first().evaluate((el, block) => el.scrollIntoView({ behavior: 'smooth', block }), block)
/** Current top 3 as the map pills announce it, e.g. "1. Groszówka 84%" (the System edit shows these). */
const pills = async () =>
  (await page.locator('.smap-fm__pill:visible').evaluateAll((e) => e.map((x) => {
    const l = x.getAttribute('aria-label')
    return `${l.match(/(\d)\. miejsce/)[1]}. ${l.split(':')[0]} ${l.match(/(\d+) procent/)[1]}%`
  }))).sort().join(', ')

// warm the HTTP cache (tiles, 3D data, photos) so the take has no loading stalls
await page.goto(BASE + '/mapa/groszowka', { waitUntil: 'networkidle' })
await page.waitForTimeout(10000)
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.mouse.move(mouse.x, mouse.y)
await wait(1500)
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: W, maxHeight: H, everyNthFrame: 1 })
t0 = Date.now() / 1000
mark('intro')
await moveTo(900, 520, 1400)
await wait(900)
mark('start')
await click(page.getByRole('button', { name: 'Zacznij' }), 1000)
await wait(1700)

mark('modal')
await moveTo(1000, 380, 900)
await wait(1800)
await click(page.getByRole('button', { name: 'Dalej' }), 800)
await wait(1100)
mark('profile')
await hover(page.getByRole('radio', { name: /^Student/ }), 700)
await wait(500)
await hover(page.getByRole('radio', { name: /^Rodzina/ }), 600)
await wait(500)
await click(page.getByRole('radio', { name: /^Senior/ }), 700)
await wait(1400)
mark('priorities')
for (const name of ['Cisza', 'Zieleń', 'Kultura']) { await hover(page.locator('.priority-tile', { hasText: name }), 520); await wait(380) }
await wait(500)
await click(page.getByRole('button', { name: 'Dalej' }), 800)
await wait(1000)
mark('horizon')
await click(page.locator('.horizon-card', { hasText: 'Kupno' }), 800)
await wait(800)
await click(page.getByRole('button', { name: 'Pokaż mapę' }), 700)
mark('matching')
await wait(2400)
mark('map')
await moveTo(1180, 470, 900)
await wait(1800)
const gotIt = page.getByRole('button', { name: 'Rozumiem' })
if (await gotIt.count()) { await click(gotIt, 900); await wait(600) }
console.log('top3 profile:', await pills())
await wait(1000)

/** Optional beat: log and carry on if the UI changed, so one missing control doesn't kill the take. */
async function opt(name, fn) {
  try { await fn() } catch (e) { console.warn('skip', name, String(e.message).split('\n')[0]) }
}
mark('solo')
for (const name of ['Cisza', 'Zieleń', 'Kultura']) {
  const row = await box(page.locator('.smap-flt__row', { has: page.getByRole('slider', { name: 'Jak ważne: ' + name }) }))
  await moveTo(row.x + 120, row.y + row.height / 2, 650)
  await wait(1500)
}
mark('preview')
/** Open a category's place picker, tick `labels`, close it with "Gotowe". */
async function preview(cat, labels) {
  await click(page.locator('button.smap-flt__cat', { hasText: cat }), 800)
  await wait(900)
  const pop = page.locator('.smap-flt-detail:visible').last()
  for (const l of labels) { await click(pop.locator('label', { hasText: l }), 550); await wait(900) }
  await wait(1200)
  await click(pop.getByRole('button', { name: 'Gotowe' }), 650)
  await wait(1800)
}
await preview('Zdrowie', ['Przychodnie i kliniki', 'Apteki'])
await preview('Kultura', ['Biblioteki', 'Uniwersytety III wieku'])

mark('reweight')
await click(page.getByRole('button', { name: 'Przenieś „Cisza” do: Podgląd na mapie' }), 900)
await wait(2200)
console.log('top3 −cisza:', await pills())
mark('noGreen')
await click(page.getByRole('button', { name: 'Przenieś „Zieleń” do: Podgląd na mapie' }), 800)
await wait(2200)
console.log('top3 −zieleń:', await pills())
mark('gastro')
await setRange(page.getByRole('slider', { name: 'Jak ważne: Gastronomia' }), 5, 1100)
await wait(2600)
console.log('top3 +gastronomia:', await pills())

mark('restore')
await click(page.getByRole('button', { name: 'Przywróć profil' }), 1000)
await wait(1800)
const green = page.getByRole('slider', { name: 'Jak ważne: Zieleń' })
if (Number(await green.inputValue()) !== 4) { await setRange(green, 4, 800); await wait(1600) }
console.log('top3 restored:', await pills())
mark('top3')
await moveTo(1150, 600, 900)
await wait(1600)

mark('pick')
await click(page.getByRole('button', { name: /^Groszówka/ }), 1000)
mark('flyover')
await wait(300)
await cursorVisible(false)
await page.locator('.op__scroll').waitFor({ state: 'visible', timeout: 40000 })
mark('panel')
await page.mouse.move(1150, 480)
mouse = { x: 1150, y: 480 }
await wait(900)
await cursorVisible(true)
await wait(1200)

mark('photos')
await opt('photos', async () => {
  await click(page.getByRole('button', { name: 'Następne zdjęcie' }), 900)
  await wait(1300)
  await click(page.getByRole('button', { name: 'Następne zdjęcie' }), 400)
  await wait(1500)
})

mark('scores')
await panelScroll('[data-section="Jak wypada dla Ciebie"]')
await moveTo(260, 520, 800)
await wait(3400)

mark('places')
await panelScroll('[data-section="Ważne miejsca"]')
await wait(1200)
for (const i of [0, 3, 5]) await opt('place ' + i, async () => { await hover(page.locator('button.op-place').nth(i), 650); await wait(1300) })

mark('routes')
await panelScroll('[data-section="Droga do…"]')
await wait(1200)
await opt('clinic route', async () => { await click(page.locator('button.op-pill', { hasText: /^Przychodnia$/ }), 800); await wait(2400) })
await opt('bike', async () => { await click(page.locator('button.op-mode', { hasText: 'Rower' }).first(), 800); await wait(2200) })
await opt('culture route', async () => { await click(page.locator('button.op-pill', { hasText: /^Kultura$/ }), 800); await wait(2600) })

mark('commute')
await panelScroll('[data-section="Dojazd"]')
await moveTo(260, 480, 700)
await wait(3000)

mark('traffic')
await panelScroll('[data-section="Korki w ciągu doby"]')
await wait(1100)
const chart = page.locator('[data-section="Korki w ciągu doby"] svg').first()
if (await chart.count()) {
  const b = await box(chart)
  await moveTo(b.x + b.width * 0.2, b.y + b.height * 0.5, 700)
  await moveTo(b.x + b.width * 0.75, b.y + b.height * 0.5, 1800)
}
await wait(1500)

mark('prices')
await panelScroll('[data-section="Ceny"]')
await moveTo(260, 520, 700)
await wait(3200)

mark('timeline')
await panelScroll('[data-section^="Oś czasu"]')
await wait(1300)
await click(page.locator('.op-tl__play'), 800)
await wait(9500)
mark('investments')
await page.locator('[data-section^="Oś czasu"]').evaluate((el) => {
  const s = el.closest('.op__scroll'); s.scrollBy({ top: 330, behavior: 'smooth' })
})
await wait(1200)
const inv = page.locator('[data-section^="Oś czasu"] :is(li, article, button)', { hasText: 'Tunel pod torami' }).last()
if (await inv.count()) { await hover(inv, 800); await wait(2000) }
const inv2 = page.locator('[data-section^="Oś czasu"] :is(li, article, button)', { hasText: 'Kanalizacja' }).last()
if (await inv2.count()) { await hover(inv2, 600); await wait(2000) }

mark('layers')
await opt('layers', async () => {
  await click(page.locator('summary.m3d-advanced__sum'), 1000)
  await wait(1000)
  mark('layerBuildings')
  await click(page.locator('label.m3d-advanced__opt', { hasText: 'Kolory budynków' }), 700)
  await wait(3000)
  mark('layerTraffic')
  await click(page.locator('label.m3d-advanced__opt', { hasText: 'Korki na drogach' }), 700)
  await wait(2500)
})
const dayPlay = page.getByRole('button', { name: 'Odtwórz dobę' })
if (await dayPlay.count()) { await click(dayPlay, 900); await wait(6500) }
await moveTo(1250, 650, 1200)
await wait(1500)
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
writeFileSync(path.join(OUT, 'system-markers.json'), JSON.stringify({ fps: FPS, frames: frames.length, duration: +(frames.at(-1).t - frames[0].t).toFixed(2), markers }, null, 2))
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
  '-vf', `scale=${W}:${H}:flags=lanczos,fps=${FPS}`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', path.join(OUT, 'system.mp4')], { stdio: 'inherit' })
if (!process.argv.includes('--keep-frames')) rmSync(FRAMES, { recursive: true, force: true })
console.log(`frames ${frames.length}, avg fps ${(frames.length / (frames.at(-1).t - frames[0].t)).toFixed(1)}`)

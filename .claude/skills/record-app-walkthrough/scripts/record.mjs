#!/usr/bin/env node
/**
 * Generic web-app walkthrough recorder (template for the record-app-walkthrough skill).
 *
 * One continuous browser session captured with the CDP screencast at 1920×1080 (1600×900 CSS × 1.2),
 * with a drawn cursor and click ripples, plus a JSON of named beats ("markers") so the video edit can
 * cut by name. Copy this file next to your project, edit only the SCRIPT section, then run:
 *
 *   mkdir -p /tmp/rec && cd /tmp/rec && npm i playwright && npx playwright install chromium
 *   BASE=http://localhost:5173 NAME=walkthrough OUT_DIR=./assets/clips \
 *   PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs node record.mjs [--keep-frames]
 *
 * Writes OUT_DIR/NAME.mp4 (H.264, 30 fps CFR) and OUT_DIR/NAME-markers.json.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE ?? 'http://localhost:5173'
const NAME = process.env.NAME ?? 'walkthrough'
const OUT = path.resolve(process.env.OUT_DIR ?? path.join(here, 'clips'))
const FRAMES = path.join(OUT, `.frames-${NAME}`)
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

// ── helpers ───────────────────────────────────────────────────────────────
const box = async (loc) => (await loc.boundingBox()) ?? (() => { throw new Error('no box') })()
/** Drag a range input to `value` (reads min/max from the element). */
async function setRange(loc, value, ms = 900) {
  const { min, max } = await loc.evaluate((el) => ({ min: Number(el.min || 0), max: Number(el.max || 100) }))
  await dragSlider(loc, (value - min) / (max - min), ms)
}
/** Smoothly scroll an element (e.g. a panel section) into view inside its scroll container. */
const scrollTo = (sel, block = 'start') =>
  page.locator(sel).first().evaluate((el, block) => el.scrollIntoView({ behavior: 'smooth', block }), block)
/** Optional beat: log and carry on if a control is missing, so one UI change doesn't kill a long take. */
async function opt(name, fn) {
  try { await fn() } catch (e) { console.warn('skip', name, String(e.message).split('\n')[0]) }
}

// ── SCRIPT: edit only this section ────────────────────────────────────────
// 1. Warm the HTTP cache (tiles, images, 3D data) with a throwaway visit, then reset app state.
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(5000)
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.mouse.move(mouse.x, mouse.y)
await wait(1500)

// 2. Start capturing. Everything after this is in the video.
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
t0 = Date.now() / 1000

// 3. Beats: mark() BEFORE each action; give the viewer 1.5–3 s to read after each change.
mark('intro')
await moveTo(900, 520, 1200)
await wait(1500)
mark('start')
await click(page.getByRole('button', { name: 'Start' }), 900)   // ← replace with your app's controls
await wait(2000)
// await opt('optional thing', async () => { await click(page.locator('.maybe-missing'), 700); await wait(1500) })
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
writeFileSync(path.join(OUT, `${NAME}-markers.json`), JSON.stringify({ fps: FPS, frames: frames.length, duration: +(frames.at(-1).t - frames[0].t).toFixed(2), markers }, null, 2))
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
  '-vf', `scale=1920:1080:flags=lanczos,fps=${FPS}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', path.join(OUT, `${NAME}.mp4`)], { stdio: 'inherit' })
if (!process.argv.includes('--keep-frames')) rmSync(FRAMES, { recursive: true, force: true })
console.log(`frames ${frames.length}, avg fps ${(frames.length / (frames.at(-1).t - frames[0].t)).toFixed(1)}`)

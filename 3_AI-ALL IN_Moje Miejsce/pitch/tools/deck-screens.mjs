#!/usr/bin/env node
/** Screenshot every slide of deck/index.html to deck/export/slide-N.png (for the PDF/PPTX export).
 *  PLAYWRIGHT=/path/to/playwright/index.mjs node deck-screens.mjs */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const deck = path.resolve(here, '../deck')
const out = path.join(deck, 'export')
mkdirSync(out, { recursive: true })
const pwPath = process.env.PLAYWRIGHT ?? 'playwright'
const { chromium } = await import(path.isAbsolute(pwPath) ? pathToFileURL(pwPath).href : pwPath)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 })
const url = pathToFileURL(path.join(deck, 'index.html')).href
const count = await (async () => { await page.goto(url); return page.locator('.slide').count() })()
for (let n = 1; n <= count; n++) {
  await page.goto(`${url}#${n}`)
  await page.reload()
  await page.evaluate(() => document.getElementById('demo')?.pause())
  await page.waitForTimeout(1800)
  await page.screenshot({ path: path.join(out, `slide-${n}.png`) })
}
await browser.close()
console.log(`${count} slides → ${out}`)

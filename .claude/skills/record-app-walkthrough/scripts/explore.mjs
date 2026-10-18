#!/usr/bin/env node
/**
 * Reconnaissance before scripting a take: screenshot a page and list every visible control with the
 * name a Playwright locator would use. Run it once per screen/state you plan to show.
 *
 *   PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs node explore.mjs http://localhost:5173/some/route OUT_DIR [label]
 *
 * To reach a deeper state (after a modal, a click…), copy this file and add the steps before `dump()`.
 */
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const [url, outDir = './explore', label = 'page'] = process.argv.slice(2)
if (!url) throw new Error('usage: explore.mjs URL [OUT_DIR] [label]')
const pwPath = process.env.PLAYWRIGHT ?? 'playwright'
const { chromium } = await import(path.isAbsolute(pwPath) ? pathToFileURL(pwPath).href : pwPath)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage()
page.setDefaultTimeout(15000)

async function dump(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`) })
  const controls = await page
    .locator('button:visible, a[href]:visible, [role=radio]:visible, [role=tab]:visible, [role=switch]:visible, summary:visible, label:visible, input:visible, select:visible')
    .evaluateAll((els) =>
      els.map((el) => {
        const cls = (el.className + '').split(' ').filter(Boolean)[0] ?? ''
        const name = (el.getAttribute('aria-label') || el.innerText || el.value || el.type || '').replace(/\s+/g, ' ').trim().slice(0, 90)
        const extra = el.type === 'range' ? ` value=${el.value} min=${el.min} max=${el.max}` : ''
        const sect = el.closest('[data-section]')?.getAttribute('data-section')
        return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} :: ${name}${extra}${sect ? `  [section: ${sect}]` : ''}`
      }),
    )
  console.log(`\n=== ${name} (${page.url()}) — screenshot ${path.join(outDir, name + '.png')}\n` + controls.join('\n'))
}

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await dump(label)
await browser.close()

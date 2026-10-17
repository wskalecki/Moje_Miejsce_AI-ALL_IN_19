#!/usr/bin/env node
/**
 * Render the flyover clips of the 3 featured osiedla from our own 3D map (spec T8).
 *
 * The DEV page `record.html` (src/cinematic/__record/main.ts) draws the map in a golden-hour look
 * and moves the camera deterministically, one frame at a time. This script screenshots every frame
 * with Playwright and grades + encodes them with ffmpeg into
 *   public/osiedla/<slug>/flyover.mp4   (H.264, yuv420p, faststart, ≤ ~4 MB)
 *   public/osiedla/<slug>/flyover.webm  (VP9, optional, --webm)
 *   public/osiedla/<slug>/poster.jpg
 * The clip loops seamlessly: one extra second is rendered and crossfaded into its head.
 *
 * Playwright is a one-off tool — keep it OUT of package.json:
 *   mkdir -p /tmp/rec && cd /tmp/rec && npm i playwright && npx playwright install chromium
 *   cd application && npx vite --port 5176            # in another terminal
 *   PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs node scripts/record-flyovers.mjs \
 *     [--base http://localhost:5176] [--slugs powisle,saska-kepa,miasteczko-wilanow] \
 *     [--seconds 9] [--fps 30] [--scale 1.5] [--webm] [--keep-frames]
 * Requires ffmpeg (with libx264, libvpx-vp9 for --webm) on PATH.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}
const flag = (name) => args.includes(`--${name}`)

const BASE = opt('base', 'http://localhost:5176')
const SLUGS = opt('slugs', 'powisle,saska-kepa,miasteczko-wilanow').split(',')
const SECONDS = Number(opt('seconds', '9'))
const FPS = Number(opt('fps', '30'))
const SCALE = Number(opt('scale', '1.5'))
const W = 1600
const H = 900
const OUT = path.resolve(here, '..', opt('out', 'public/osiedla'))
const FRAMES = path.resolve(opt('frames', path.join(tmpdir(), 'siatka-flyovers')))

const pwPath = process.env.PLAYWRIGHT ?? 'playwright'
const { chromium } = await import(path.isAbsolute(pwPath) ? pathToFileURL(pwPath).href : pwPath)

/**
 * "Drone render" look: tilt-shift depth of field (blur away from the focal band), teal shadows and
 * warm highlights, contrast, highlight bloom, vignette and fine film grain.
 */
const TILT_SHIFT = (mask) =>
  `split[ts0][ts1];[ts1]gblur=sigma=4.5,format=yuva444p[tsb];[${mask}]format=gray[tsm];[tsb][tsm]alphamerge[tsa];` +
  `[ts0]format=yuva444p[tss];[tss][tsa]overlay,format=gbrp`
const GRADE = [
  'eq=contrast=1.1:saturation=1.1:gamma=1.05',
  'colorbalance=rs=-0.03:gs=-0.005:bs=0.05:rm=0.04:gm=-0.02:bm=-0.01:rh=0.045:gh=-0.015:bh=-0.02',
  'split[g0][g1]',
  '[g1]gblur=sigma=26,curves=all=0/0 0.6/0.25 1/1[bloom]',
  '[g0][bloom]blend=all_mode=screen:all_opacity=0.3',
  'vignette=angle=PI/4.6',
  'noise=alls=4:allf=t+u',
].join(',')

function ffmpeg(argv) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...argv], { stdio: 'inherit' })
}

const browser = await chromium.launch({
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=metal', '--enable-unsafe-swiftshader'],
})

for (const slug of SLUGS) {
  const dir = path.join(FRAMES, slug)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE })
  page.on('pageerror', (e) => console.error(`[${slug}] page error:`, e.message))
  await page.goto(`${BASE}/record.html?slug=${slug}&fps=${FPS}&seconds=${SECONDS}`)
  await page.waitForFunction(() => window.__ready, null, { timeout: 30000 })
  await page.evaluate(() => window.__ready)
  const { total, loop } = await page.evaluate(() => window.__frames)
  const clip = total - loop
  const t0 = Date.now()
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => window.__seek(n), i)
    await page.screenshot({ path: path.join(dir, `f_${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 })
    if (i % 30 === 0) console.log(`[${slug}] frame ${i}/${total} · ${((Date.now() - t0) / 1000).toFixed(0)} s`)
  }
  await page.close()

  const out = path.join(OUT, slug)
  mkdirSync(out, { recursive: true })
  // tilt-shift mask: sharp band at 62 % of the height, blur growing towards top and bottom
  const mask = path.join(FRAMES, 'tilt-mask.png')
  ffmpeg(['-f', 'lavfi', '-i', `color=black:s=${W}x${H}`, '-vf', "format=gray,geq=lum='255*min(1\\,pow(abs(Y/H-0.62)/0.45\\,1.8))'", '-frames:v', '1', mask])
  const graph = [
    `[0:v]scale=${W}:${H}:flags=lanczos,format=gbrp,fps=${FPS},split=2[s1][s2]`,
    `[s1]trim=start_frame=${clip}:end_frame=${total},setpts=PTS-STARTPTS[tail]`,
    `[s2]trim=start_frame=0:end_frame=${clip},setpts=PTS-STARTPTS[head]`,
    `[tail][head]xfade=transition=fade:duration=${loop / FPS}:offset=0[loop]`,
    `[loop]${TILT_SHIFT('1:v')},${GRADE},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`,
  ].join(';')
  const mp4 = path.join(out, 'flyover.mp4')
  ffmpeg([
    '-framerate', String(FPS), '-i', path.join(dir, 'f_%05d.jpg'), '-loop', '1', '-i', mask,
    '-filter_complex', graph, '-map', '[v]', '-frames:v', String(clip),
    '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-crf', '23',
    '-maxrate', '3200k', '-bufsize', '6400k', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(FPS),
    '-movflags', '+faststart', '-an', mp4,
  ])
  ffmpeg(['-i', mp4, '-frames:v', '1', '-q:v', '3', path.join(out, 'poster.jpg')])
  if (flag('webm')) {
    ffmpeg([
      '-i', mp4, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1',
      '-deadline', 'good', '-cpu-used', '2', '-an', path.join(out, 'flyover.webm'),
    ])
  }
  const mb = (f) => (statSync(f).size / 1024 / 1024).toFixed(2)
  console.log(`[${slug}] flyover.mp4 ${mb(mp4)} MB${flag('webm') ? ` · flyover.webm ${mb(path.join(out, 'flyover.webm'))} MB` : ''}`)
  if (!flag('keep-frames')) rmSync(dir, { recursive: true, force: true })
}

await browser.close()

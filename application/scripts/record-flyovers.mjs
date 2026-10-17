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
 *     [--base http://localhost:5176] [--slugs muranow,natolin,stare-bielany] \
 *     [--seconds 9] [--fps 30] [--scale 1.5] [--webm] [--keep-frames]
 * Requires ffmpeg (with libx264, libvpx-vp9 for --webm) on PATH.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
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
const SLUGS = opt('slugs', 'muranow,natolin,stare-bielany').split(',')
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
 * "Premium drone render" look (graded after capture):
 *  - tilt-shift depth of field (blur away from the focal band),
 *  - a 3D LUT (written below): luma S-curve for depth, neutral-cool desaturated shade, sunlit
 *    highlights kept ivory with a light golden lift, greens held back so they stay natural,
 *  - a warm golden-hour glow from the upper right (soft light, so shade stays cool),
 *  - gentle highlight bloom, vignette and fine film grain.
 */
const TILT_SHIFT = (mask) =>
  `split[ts0][ts1];[ts1]gblur=sigma=4.5,format=yuva444p[tsb];[${mask}]format=gray[tsm];[tsb][tsm]alphamerge[tsa];` +
  `[ts0]format=yuva444p[tss];[tss][tsa]overlay,format=gbrp`
const LOOK = {
  contrast: 0.26,
  lift: 0.03,
  gain: 0.985,
  shadowCool: [-0.045, -0.006, 0.062],
  shadowDesat: 0.55,
  highWarm: [0.026, 0.01, -0.012],
  highDesat: 0.15,
  sat: 1.08,
  greenSat: 0.85,
}
const GRADE = (lut, sun) =>
  [
    `lut3d=file=${lut}:interp=tetrahedral[lut]`,
    `[lut][${sun}]blend=all_mode=softlight:all_opacity=0.9`,
    'split[g0][g1]',
    "[g1]gblur=sigma=24,curves=all='0/0 0.65/0.15 1/1'[bloom]",
    '[g0][bloom]blend=all_mode=screen:all_opacity=0.2',
    'vignette=angle=PI/5',
    'noise=alls=3:allf=t+u',
  ].join(',')

/** Write the look as a 33³ .cube LUT. */
function writeLut(file, P = LOOK) {
  const N = 33
  const sstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  const lines = [`LUT_3D_SIZE ${N}`]
  for (let bi = 0; bi < N; bi++)
    for (let gi = 0; gi < N; gi++)
      for (let ri = 0; ri < N; ri++) {
        const c = [ri / (N - 1), gi / (N - 1), bi / (N - 1)]
        const Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
        const sY = Y + P.contrast * (Y - 0.5) * (1 - Math.abs(2 * Y - 1)) * 2
        const Yn = P.lift + (P.gain - P.lift) * Math.min(1, Math.max(0, sY))
        const wS = 1 - sstep(0.2, 0.62, Y) // shade
        const wH = sstep(0.55, 0.92, Y) // sunlit
        const greenDom = Math.max(0, Math.min(1, (c[1] - Math.max(c[0], c[2])) * 6))
        const k = P.sat * (1 - P.shadowDesat * wS) * (1 - P.highDesat * wH) * (1 - (1 - P.greenSat) * greenDom)
        const o = c.map((v, i) => Math.min(1, Math.max(0, Yn + (v - Y) * k + wS * P.shadowCool[i] + wH * P.highWarm[i])))
        lines.push(o.map((v) => v.toFixed(6)).join(' '))
      }
  writeFileSync(file, `${lines.join('\n')}\n`)
}

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
  // golden-hour glow: warm towards the upper-right corner, neutral 50 % grey (no-op in soft light) elsewhere
  const sun = path.join(FRAMES, 'sun-glow.png')
  ffmpeg([
    '-f', 'lavfi', '-i', `color=black:s=${W}x${H}`, '-vf',
    "format=gray,geq=lum='255*pow(max(0\\,1-hypot((X-W*1.02)/(W*0.95)\\,(Y+H*0.15)/(H*1.25)))\\,1.6)'," +
      "format=rgb24,geq=r='128+r(X\\,Y)/255*127':g='128+g(X\\,Y)/255*68':b='128-b(X\\,Y)/255*8'",
    '-frames:v', '1', sun,
  ])
  const lut = path.join(FRAMES, 'look.cube')
  writeLut(lut)
  const graph = [
    `[0:v]scale=${W}:${H}:flags=lanczos,format=gbrp,fps=${FPS},split=2[s1][s2]`,
    `[s1]trim=start_frame=${clip}:end_frame=${total},setpts=PTS-STARTPTS[tail]`,
    `[s2]trim=start_frame=0:end_frame=${clip},setpts=PTS-STARTPTS[head]`,
    `[tail][head]xfade=transition=fade:duration=${loop / FPS}:offset=0[loop]`,
    `[2:v]format=gbrp[sun]`,
    `[loop]${TILT_SHIFT('1:v')},${GRADE(lut, 'sun')},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`,
  ].join(';')
  const mp4 = path.join(out, 'flyover.mp4')
  ffmpeg([
    '-framerate', String(FPS), '-i', path.join(dir, 'f_%05d.jpg'), '-loop', '1', '-i', mask, '-loop', '1', '-i', sun,
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

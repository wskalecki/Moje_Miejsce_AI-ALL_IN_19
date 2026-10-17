import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const DATA_URLS = ['/data/heat.json', '/data/osiedla-scores.json', '/data/osiedla.geojson']
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const TILEJSON_URL = 'https://tiles.openfreemap.org/planet'
/** Glyph ranges the overview needs for Polish labels (MapLibre asks for them only after the tiles parse). */
const GLYPH_URLS = ['Regular/0-255', 'Regular/256-511', 'Italic/0-255', 'Italic/256-511', 'Bold/0-255'].map(
  (r) => `https://tiles.openfreemap.org/fonts/Noto%20Sans%20${r}.pbf`,
)

/**
 * Cold entry on `/mapa…` (QA #8). The map chunk (MapView + maplibre) is lazy, so without help the
 * browser only discovers it after index.js has downloaded and run, and the data/style only after that.
 * This injects a tiny inline script that — on map routes only — adds modulepreload/preload links for
 * the map chunk, its CSS, the data files and the basemap style, all in parallel with index.js.
 * Deep links (`/mapa/:slug`) chain the cinematic and osiedle panel chunks right after the map chunk
 * (src/app/mapLoader.ts preloadMapNow) — prefetching them here only competed with the map for bandwidth.
 */
function mapRoutePreload(): Plugin {
  return {
    name: 'siatka-map-route-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return
        const base = '/'
        const entry = Object.values(bundle).find((c) => c.type === 'chunk' && c.isEntry)
        const initial = new Set<string>()
        const walk = (file: string, into: Set<string>) => {
          const c = bundle[file]
          if (!c || c.type !== 'chunk' || into.has(file)) return
          into.add(file)
          c.imports.forEach((f) => walk(f, into))
        }
        if (entry) walk(entry.fileName, initial)

        const collect = (suffix: string) => {
          const root = Object.values(bundle).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith(suffix))
          const js = new Set<string>()
          if (root) walk(root.fileName, js)
          const files = [...js].filter((f) => !initial.has(f))
          const css = files.flatMap((f) => {
            const c = bundle[f]
            return c.type === 'chunk' ? [...(c.viteMetadata?.importedCss ?? [])] : []
          })
          return { js: files.map((f) => base + f), css: css.map((f) => base + f) }
        }
        const map = collect('/src/map/MapView.tsx')
        const worker = Object.values(bundle).find((c) => c.type === 'asset' && c.fileName.includes('maplibre-gl-worker'))

        const cfg = {
          m: map.js,
          s: map.css,
          f: [STYLE_URL, TILEJSON_URL],
          d: [...DATA_URLS, ...GLYPH_URLS],
          w: worker ? [base + worker.fileName] : [],
        }
        // Priorities matter more than parallelism on a slow link: the map chunk and the tiny style /
        // tilejson go first (high), data files and glyphs at low priority (needed only at the map's
        // `load`), the worker as a prefetch.
        const code =
          `(function(c){var p=location.pathname;if(!/^\\/mapa(\\/|$)/.test(p))return;` +
          `var h=document.head;function l(r,u,a,lo){var e=document.createElement('link');e.rel=r;e.href=u;` +
          `if(a){e.as=a;e.crossOrigin='anonymous'}if(lo)e.fetchPriority='low';h.appendChild(e)}` +
          `c.m.forEach(function(u){l('modulepreload',u)});c.s.forEach(function(u){l('preload',u,'style')});` +
          `c.f.forEach(function(u){l('preload',u,'fetch')});c.d.forEach(function(u){l('preload',u,'fetch',1)});` +
          `c.w.forEach(function(u){l('prefetch',u)})` +
          `})(${JSON.stringify(cfg)})`
        return [{ tag: 'script', children: code, injectTo: 'head-prepend' }]
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mapRoutePreload()],
  resolve: {
    alias: {
      '@data': path.resolve(import.meta.dirname, '../data'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/fonts.css'
import './design/tokens.css'
import './design/global.css'
import App from './app/App'
import { PRELOAD_DATA_URLS } from './app/config'
import { preloadMapNow } from './app/mapLoader'

// Cold entry on the map: fetch the map chunk and data in parallel with the first render (QA #8).
if (/^\/mapa(\/|$)/.test(window.location.pathname)) {
  preloadMapNow(PRELOAD_DATA_URLS, /^\/mapa\/[a-z0-9-]+/.test(window.location.pathname))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

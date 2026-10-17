/** Dev-only entry for the map harness: `npx vite` → /map-dev.html. Not part of the app bundle. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/plus-jakarta-sans'
import '../../lib/maplibreSetup'
import '../../design/tokens.css'
import '../../design/global.css'
import { MapHarness } from './MapHarness'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapHarness />
  </StrictMode>,
)

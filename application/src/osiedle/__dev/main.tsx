/** Dev-only harness for the osiedle panel: `npx vite` → /osiedle-dev.html. Not part of the app bundle. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/plus-jakarta-sans'
import '../../design/tokens.css'
import '../../design/global.css'
import '../../design/chrome.css'
import './dev.css'
import { Harness } from './Harness'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
)

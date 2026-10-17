/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MAP_STYLE_URL?: string
}

declare module '*.geojson?raw' {
  const value: string
  export default value
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

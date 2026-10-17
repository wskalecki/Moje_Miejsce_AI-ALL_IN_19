import type { Map as MlMap } from 'maplibre-gl'
import { useEffect, useState } from 'react'
import { DEFAULT_PRIORITIES } from '../../app/dictionary'
import { MapView, type MapApi } from '../MapView'
import type { Profile } from '../types'

declare global {
  interface Window {
    __map?: MlMap
    __mapApi?: MapApi
    __setProfile?: (p: Profile) => void
  }
}

/** Dev harness: full-screen MapView with a profile switch; exposes the map on `window.__map`. */
export function MapHarness() {
  const initial = (new URLSearchParams(location.search).get('profil') as Profile | null) ?? 'student'
  const [profile, setProfile] = useState<Profile>(initial)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => {
    window.__setProfile = setProfile
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0 }} data-profile={profile}>
      <MapView
        profile={profile}
        priorities={DEFAULT_PRIORITIES[profile]}
        horizon="chwila"
        selectedSlug={selected}
        onSelectFeatured={(slug) => {
          console.info('[harness] onSelectFeatured', slug)
          setSelected(slug)
          window.setTimeout(() => setSelected(null), 1500)
        }}
        onMapReady={(map, api) => {
          window.__map = map
          window.__mapApi = api
          console.info('[harness] map ready', Object.values(api.layers))
        }}
      />
      <div style={{ position: 'fixed', left: 24, top: 24, display: 'flex', gap: 6, zIndex: 100 }}>
        {(['student', 'rodzina', 'senior'] as Profile[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProfile(p)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,.1)',
              background: p === profile ? '#16161D' : 'rgba(255,255,255,.8)',
              color: p === profile ? '#fff' : '#16161D',
              font: '600 13px var(--font-ui)',
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

/** `/dev/ui` (DEV only): base components gallery. */
import { ArrowLeft, ArrowRight, Maximize2, Minus, Plus } from 'lucide-react'
import { PROFILE_ORDER, PROFILES } from '../../app/dictionary'
import { useAppStore } from '../../app/useAppStore'
import { Badge, Button, GlassPanel, IconButton, Logo, MatchRing } from '../../components/ui'

export default function DevUiScreen() {
  const { state, setProfile } = useAppStore()
  return (
    <main className="screen" style={{ padding: 48, display: 'grid', gap: 32, alignContent: 'start' }}>
      <Logo size="lg" />
      <div style={{ display: 'flex', gap: 8 }}>
        {PROFILE_ORDER.map((p) => (
          <Button key={p} variant={state.profile === p ? 'primary' : 'secondary'} onClick={() => setProfile(p)}>
            {PROFILES[p].title}
          </Button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button iconRight={ArrowRight}>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost" iconLeft={ArrowLeft}>
          Wstecz
        </Button>
        <Button disabled>Disabled</Button>
        <IconButton icon={Plus} label="Przybliż" />
        <IconButton icon={Minus} label="Oddal" />
        <IconButton icon={Maximize2} label="Cała Warszawa" />
        <Badge />
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <MatchRing value={87} size={44} />
        <MatchRing value={96} size={88} />
      </div>
      <GlassPanel style={{ padding: 24, maxWidth: 360 }}>
        <p className="t-h3">GlassPanel</p>
        <p className="t-body t-secondary">Szklany panel z rozmyciem tła.</p>
      </GlassPanel>
      <div style={{ display: 'grid', gap: 8 }}>
        <span className="t-display-xl">Display XL</span>
        <span className="t-display-l">Display L</span>
        <span className="t-h1">Nagłówek h1 — zażółć gęślą jaźń</span>
        <span className="t-h2">Nagłówek h2</span>
        <span className="t-h3">Nagłówek h3</span>
        <span className="t-body">Body 15/22 — Łączymy 24 wskaźniki z otwartych danych.</span>
        <span className="t-small">Small 13/18</span>
        <span className="t-micro">Micro wersaliki</span>
      </div>
    </main>
  )
}

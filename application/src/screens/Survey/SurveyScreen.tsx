import { navigate } from '../../app/router'
import { Button } from '../../components/ui'

/** Placeholder — replaced by the full survey (T4). */
export function SurveyScreen({ step }: { step: 1 | 2 | 3 }) {
  return (
    <main className="screen" style={{ display: 'grid', placeContent: 'center', gap: 16 }}>
      <p className="t-h2">Ankieta · krok {step} z 3</p>
      <Button onClick={() => navigate(step < 3 ? `/ankieta?krok=${step + 1}` : '/mapa')}>Dalej</Button>
    </main>
  )
}

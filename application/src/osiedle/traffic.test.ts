import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OSIEDLA } from '../mock/osiedla.ts'
import { bestDeparture, formatClock, trafficAt, trafficHint } from './traffic.ts'

test('formatClock', () => {
  assert.equal(formatClock(7.25), '7:15')
  assert.equal(formatClock(8), '8:00')
  assert.equal(formatClock(18.5), '18:30')
})

test('trafficAt passes through the hourly samples and stays inside their range', () => {
  const t = OSIEDLA[0].traffic
  for (let h = 0; h < 24; h++) assert.ok(Math.abs(trafficAt(t, h) - t[h]) < 1e-9)
  assert.ok(Math.abs(trafficAt(t, 24) - t[0]) < 1e-9)
  // Monotone: between two samples the curve never leaves [min, max] of the pair.
  for (let q = 0; q < 96; q++) {
    const x = q / 4
    const i = Math.floor(x)
    const v = trafficAt(t, x)
    const a = t[i]
    const b = t[(i + 1) % 24]
    assert.ok(v >= Math.min(a, b) - 1e-9 && v <= Math.max(a, b) + 1e-9)
  }
})

test('best departure stays in a realistic window on every featured osiedle', () => {
  for (const o of OSIEDLA) {
    const am = bestDeparture(o.traffic, 6, 10)
    assert.ok(am, o.slug)
    assert.ok(am.best >= 6 && am.best <= 10, `${o.slug} morning ${am.best}`)
    assert.ok(Math.abs(am.best - am.peak) >= 0.5 && Math.abs(am.best - am.peak) <= 2, `${o.slug} shift`)
    assert.equal((am.best * 4) % 1, 0, 'quarter-hour steps')
    assert.equal(am.pct % 5, 0)
    assert.ok(am.pct >= 10 && am.pct <= 60, `${o.slug} pct ${am.pct}`)
    const pm = bestDeparture(o.traffic, 15, 19)
    assert.ok(pm && pm.best >= 15 && pm.best <= 19, `${o.slug} evening`)
  }
})

test('picks the time closest to the peak that is clearly lighter, not the empty dawn', () => {
  // 5:00 is empty, but the hint must not send anyone out that early.
  const t = [5, 5, 5, 5, 5, 5, 40, 70, 100, 70, 40, 30, 30, 30, 30, 50, 80, 90, 60, 40, 30, 20, 10, 5]
  const am = bestDeparture(t, 6, 10)!
  assert.equal(am.peak, 8)
  assert.ok(am.best >= 6 && am.best <= 10)
  assert.ok(Math.abs(am.best - 8) <= 1.25, `best ${am.best}`)
  assert.ok(am.pct >= 25)
})

test('no tip for a flat morning, and the light-traffic message', () => {
  const flat = Array.from({ length: 24 }, () => 50)
  assert.equal(bestDeparture(flat, 6, 10), null)
  assert.equal(trafficHint(flat).bestHour, null)
  const light = Array.from({ length: 24 }, () => 20)
  assert.equal(trafficHint(light).morning, 'Tu rzadko stoi się w korkach — możesz wyjeżdżać, kiedy chcesz.')
})

test('hint text on the featured osiedla', () => {
  const by = Object.fromEntries(OSIEDLA.map((o) => [o.slug, trafficHint(o.traffic)]))
  assert.equal(by['miasteczko-wilanow'].morning, 'Rano korki są największe około 8:00. Wyjedź o 9:30 zamiast 8:00 — będzie ok. 30% luźniej.')
  assert.equal(by['powisle'].morning, 'Rano korki są największe około 8:00. Wyjedź o 6:30 zamiast 8:00 — będzie ok. 35% luźniej.')
  assert.equal(by['saska-kepa'].morning, 'Rano korki są największe około 8:00. Wyjedź o 9:15 zamiast 8:00 — będzie ok. 25% luźniej.')
  for (const h of Object.values(by)) assert.doesNotMatch(h.morning + (h.afternoon ?? ''), /\b[0-5]:\d\d\b/)
})

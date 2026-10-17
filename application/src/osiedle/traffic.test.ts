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

// Fixture with a two-peak weekday profile (the algorithm test does not depend on the mock data).
const TWO_PEAKS = [8, 6, 5, 5, 7, 15, 38, 72, 86, 74, 58, 52, 54, 56, 60, 68, 82, 90, 78, 58, 42, 30, 20, 12]

test('best departure stays in a realistic window', () => {
  const am = bestDeparture(TWO_PEAKS, 6, 10)
  assert.ok(am, 'morning departure')
  const morning = am!
  assert.ok(morning.best >= 6 && morning.best <= 10, `morning ${morning.best}`)
  assert.ok(
    Math.abs(morning.best - morning.peak) >= 0.5 && Math.abs(morning.best - morning.peak) <= 2,
    'shift',
  )
  assert.equal((morning.best * 4) % 1, 0, 'quarter-hour steps')
  assert.equal(morning.pct % 5, 0)
  assert.ok(morning.pct >= 10 && morning.pct <= 60, `pct ${morning.pct}`)
  const pm = bestDeparture(TWO_PEAKS, 15, 19)
  assert.ok(pm && pm.best >= 15 && pm.best <= 19, 'evening')
})

test('featured osiedla carry a real 24-hour curve (GTFS planned slowdown, 0–100) or none', () => {
  for (const o of OSIEDLA) {
    assert.ok(o.traffic.length === 0 || o.traffic.length === 24, o.slug)
    for (const v of o.traffic) assert.ok(v >= 0 && v <= 100, `${o.slug} ${v}`)
    assert.ok(o.trafficSource.endsWith('/traffic.json'), o.slug)
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

test('hint text on the featured osiedla never suggests leaving before 6:00', () => {
  for (const o of OSIEDLA) {
    if (o.traffic.length !== 24) continue
    const h = trafficHint(o.traffic)
    assert.ok(h.morning.length > 0, o.slug)
    assert.doesNotMatch(h.morning + (h.afternoon ?? ''), /\b[0-5]:\d\d\b/, o.slug)
  }
})

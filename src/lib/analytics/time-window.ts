import type { BucketStats } from '@/types/domain'
import { sortedBucketKeys, weeklyToMonthly } from '@/lib/analytics/rollups'
import type { Granularity } from '@/types/domain'

export function weekKeyStartDate(key: string): Date | null {
  const m = key.match(/^(\d{4})-W(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const w = Number(m[2])
  const jan1 = new Date(Date.UTC(y, 0, 1))
  const dayOff = (jan1.getUTCDay() + 6) % 7
  const weekStart = new Date(jan1)
  weekStart.setUTCDate(jan1.getUTCDate() - dayOff + (w - 1) * 7)
  return weekStart
}

export function filterSeriesByDays(
  series: Record<string, BucketStats>,
  days: number,
  granularity: Granularity,
): Record<string, BucketStats> {
  const cutoff = Date.now() - days * 86400000
  let working = { ...series }
  if (granularity === 'month') {
    working = weeklyToMonthly(working)
  }
  const keys = sortedBucketKeys(working)
  const out: Record<string, BucketStats> = {}
  for (const k of keys) {
    let t: Date | null = null
    if (granularity === 'week') t = weekKeyStartDate(k)
    else {
      const p = k.match(/^(\d{4})-(\d{2})$/)
      t = p ? new Date(Date.UTC(Number(p[1]), Number(p[2]) - 1, 1)) : null
    }
    if (t && t.getTime() >= cutoff) out[k] = working[k]
  }
  if (Object.keys(out).length === 0 && keys.length) {
    const n = Math.max(1, Math.ceil(days / (granularity === 'month' ? 30 : 7)))
    for (const k of keys.slice(-n)) out[k] = working[k]
  }
  return out
}

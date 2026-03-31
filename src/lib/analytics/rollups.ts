import type { BucketStats } from '@/types/domain'

export function weekKey(d: Date): string {
  const y = d.getUTCFullYear()
  const jan1 = new Date(Date.UTC(y, 0, 1))
  const day = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
  const week = Math.floor((day + jan1.getUTCDay()) / 7)
  return `${y}-W${String(week).padStart(2, '0')}`
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function emptyBucket(): BucketStats {
  return {
    prsOpened: 0,
    prsMerged: 0,
    prsClosed: 0,
    issuesOpened: 0,
    issuesClosed: 0,
    activeContributors: 0,
  }
}

export function mergeBuckets(
  into: Record<string, BucketStats>,
  key: string,
  patch: Partial<BucketStats>,
  contributorDelta?: number,
): void {
  if (!into[key]) into[key] = emptyBucket()
  const b = into[key]
  if (patch.prsOpened) b.prsOpened += patch.prsOpened
  if (patch.prsMerged) b.prsMerged += patch.prsMerged
  if (patch.prsClosed) b.prsClosed += patch.prsClosed
  if (patch.issuesOpened) b.issuesOpened += patch.issuesOpened
  if (patch.issuesClosed) b.issuesClosed += patch.issuesClosed
  if (contributorDelta) b.activeContributors += contributorDelta
}

export function weeklyToMonthly(weekly: Record<string, BucketStats>): Record<string, BucketStats> {
  const out: Record<string, BucketStats> = {}
  for (const [wk, b] of Object.entries(weekly)) {
    const parts = wk.split('-W')
    if (parts.length !== 2) continue
    const y = Number(parts[0])
    const wn = Number(parts[1])
    const approx = new Date(Date.UTC(y, 0, 1 + (wn - 1) * 7))
    const mk = monthKey(approx)
    if (!out[mk]) out[mk] = emptyBucket()
    const t = out[mk]
    t.prsOpened += b.prsOpened
    t.prsMerged += b.prsMerged
    t.prsClosed += b.prsClosed
    t.issuesOpened += b.issuesOpened
    t.issuesClosed += b.issuesClosed
    t.activeContributors += b.activeContributors
  }
  return out
}

export function sortedBucketKeys(series: Record<string, BucketStats>): string[] {
  return Object.keys(series).sort()
}

export function normalizedSlope(values: number[]): { slope: number; r2: number } {
  const n = values.length
  if (n < 2) return { slope: 0, r2: 0 }
  const meanY = values.reduce((a, b) => a + b, 0) / n
  if (meanY === 0) return { slope: 0, r2: 0 }
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0,
    sumYY = 0
  for (let i = 0; i < n; i++) {
    const x = i
    const y = values[i]
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
    sumYY += y * y
  }
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return { slope: 0, r2: 0 }
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  let ssTot = 0,
    ssRes = 0
  for (let i = 0; i < n; i++) {
    const x = i
    const y = values[i]
    const pred = slope * x + intercept
    ssTot += (y - meanY) ** 2
    ssRes += (y - pred) ** 2
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot
  return { slope: slope / meanY, r2 }
}

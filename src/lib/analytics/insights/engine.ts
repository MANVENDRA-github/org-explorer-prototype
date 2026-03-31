import type { NormalizedRepo, NormalizedContributor, ContributionEdge } from '@/types/domain'
import type { Insight } from '@/types/insights'
import {
  STAGNANT_DAYS,
  BUS_FACTOR_TOP_K,
  BUS_FACTOR_PCT_THRESHOLD,
  TREND_MIN_WEEKS,
} from '@/config/constants'
import { sortedBucketKeys, normalizedSlope, emptyBucket } from '@/lib/analytics/rollups'
import type { BucketStats } from '@/types/domain'

function daysSince(iso: string | null): number {
  if (!iso) return 9999
  return (Date.now() - new Date(iso).getTime()) / 86400000
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function computeInsights(
  repos: NormalizedRepo[],
  contributors: NormalizedContributor[],
  edges: ContributionEdge[],
  globalSeries: Record<string, BucketStats>,
  dataCompleteness: number,
): Insight[] {
  const now = Date.now()
  const fullRepos = repos.filter((r) => r.detailLevel === 'full')
  const metaRepos = repos
  const pool = fullRepos.length ? fullRepos : metaRepos

  const insights: Insight[] = []
  const confidence = Math.min(1, Math.max(0.2, dataCompleteness))

  const lastActivityDays = pool
    .map((r) => daysSince(r.aggregates.lastActivityAt ?? r.pushedAt))
    .filter((d) => d < 9000)
  const p90Stale =
    lastActivityDays.length > 0
      ? [...lastActivityDays].sort((a, b) => a - b)[Math.floor(lastActivityDays.length * 0.9)]
      : STAGNANT_DAYS

  const medianStars = median(pool.map((r) => r.stars))

  for (const r of pool) {
    const stale = daysSince(r.aggregates.lastActivityAt ?? r.pushedAt)
    const lowVelocity = r.aggregates.prsMerged < 2 && r.aggregates.prsOpened < 3
    if (stale > Math.max(STAGNANT_DAYS, p90Stale * 0.8) && lowVelocity && r.stars >= medianStars) {
      insights.push({
        id: `stagnant-${r.key}`,
        title: 'Potentially stagnant repository',
        severity: 'watch',
        summary: `${r.fullName} has had limited PR motion while visibility (${r.stars} stars) is non-trivial.`,
        rationale: `Last meaningful activity ~${Math.round(stale)}d ago vs cohort baseline; merges/open PRs in sampled window are low.`,
        metrics: { staleDays: Math.round(stale), stars: r.stars },
        related: [{ kind: 'repo', key: r.key, label: r.fullName }],
        computedAt: now,
        confidence,
      })
    }

    const repoEdges = edges.filter((e) => e.repoKey === r.key)
    const totalWeight = repoEdges.reduce((s, e) => s + e.weight, 0)
    if (totalWeight > 10) {
      const sorted = [...repoEdges].sort((a, b) => b.weight - a.weight)
      const top = sorted.slice(0, BUS_FACTOR_TOP_K)
      const topSum = top.reduce((s, e) => s + e.weight, 0)
      const pct = topSum / totalWeight
      if (pct >= BUS_FACTOR_PCT_THRESHOLD && repoEdges.length >= 4) {
        insights.push({
          id: `bus-${r.key}`,
          title: 'Contributor concentration (bus factor)',
          severity: 'concern',
          summary: `Roughly ${Math.round(pct * 100)}% of sampled contribution weight on ${r.fullName} comes from the top ${BUS_FACTOR_TOP_K} authors.`,
          rationale: 'Computed from contributor–repo edge weights in the sync window (API sample).',
          metrics: { concentrationPct: Math.round(pct * 100), edgeCount: repoEdges.length },
          related: [
            { kind: 'repo', key: r.key, label: r.fullName },
            ...top.slice(0, 3).map((e) => {
              const c = contributors.find((x) => x.key === e.contributorKey)
              return {
                kind: 'contributor' as const,
                key: e.contributorKey,
                label: c?.login ?? e.contributorKey,
              }
            }),
          ],
          computedAt: now,
          confidence: confidence * 0.85,
        })
      }
    }

    const uc = r.aggregates.uniqueContributors
    const merged = r.aggregates.prsMerged
    if (uc >= 2 && uc <= 6 && merged >= 15) {
      insights.push({
        id: `diversity-${r.key}`,
        title: 'High merge velocity, low contributor diversity',
        severity: 'watch',
        summary: `${r.fullName} merges frequently (${merged} in sample) with only ~${uc} distinct contributors.`,
        rationale: 'Herfindahl-style concentration: small unique set vs high merge count in fetched window.',
        metrics: { uniqueMergedAuthors: uc, merges: merged },
        related: [{ kind: 'repo', key: r.key, label: r.fullName }],
        computedAt: now,
        confidence: confidence * 0.8,
      })
    }

    if (r.stars > 500 && stale > 45 && r.aggregates.prsMerged < 2) {
      insights.push({
        id: `dormant-stars-${r.key}`,
        title: 'High visibility, low recent motion',
        severity: 'info',
        summary: `${r.fullName} is highly starred but sampled PR activity is quiet.`,
        rationale: 'Stars vs recent merge sample mismatch — triage or roadmap communication may help.',
        metrics: { stars: r.stars, staleDays: Math.round(stale) },
        related: [{ kind: 'repo', key: r.key, label: r.fullName }],
        computedAt: now,
        confidence: confidence * 0.75,
      })
    }
  }

  const keys = sortedBucketKeys(globalSeries)
  if (keys.length >= TREND_MIN_WEEKS) {
    const recent = keys.slice(-TREND_MIN_WEEKS)
    const merges = recent.map((k) => globalSeries[k]?.prsMerged ?? 0)
    const { slope, r2 } = normalizedSlope(merges)
    if (slope < -0.08 && r2 > 0.35) {
      insights.push({
        id: 'global-merge-decline',
        title: 'Declining merge activity (cohort trend)',
        severity: 'watch',
        summary: 'Merged PRs per week show a sustained downward slope across the selected window.',
        rationale: `Normalized OLS slope ${slope.toFixed(3)} over ${recent.length} buckets (r²=${r2.toFixed(2)}).`,
        metrics: { slope, r2, weeks: recent.length },
        related: [],
        computedAt: now,
        confidence: confidence * 0.7,
      })
    }

    let cumOpen = 0
    const imbalance: number[] = []
    for (const k of recent) {
      const b = globalSeries[k] ?? emptyBucket()
      cumOpen += b.issuesOpened - b.issuesClosed
      imbalance.push(cumOpen)
    }
    if (imbalance.length && imbalance[imbalance.length - 1] > imbalance[0] + 10) {
      insights.push({
        id: 'issue-drain',
        title: 'Issue backlog growing faster than closures',
        severity: 'info',
        summary: 'Cumulative opened-vs-closed issues drifted upward in recent weeks.',
        rationale: 'Sampled issue events from repository activity; use as triage signal, not ground truth.',
        metrics: { delta: imbalance[imbalance.length - 1] - imbalance[0] },
        related: [],
        computedAt: now,
        confidence: confidence * 0.65,
      })
    }
  }

  const orgsByContrib = new Map<string, Set<string>>()
  for (const e of edges) {
    const c = contributors.find((x) => x.key === e.contributorKey)
    const repo = repos.find((x) => x.key === e.repoKey)
    if (!c || !repo) continue
    if (!orgsByContrib.has(c.key)) orgsByContrib.set(c.key, new Set())
    orgsByContrib.get(c.key)!.add(repo.orgLogin.toLowerCase())
  }
  const linchpinCandidates: { c: NormalizedContributor; orgs: number; weight: number }[] = []
  for (const c of contributors) {
    const s = orgsByContrib.get(c.key)
    if (s && s.size >= 2) {
      const weight = edges
        .filter((e) => e.contributorKey === c.key)
        .reduce((a, b) => a + b.weight, 0)
      if (weight >= 20) linchpinCandidates.push({ c, orgs: s.size, weight })
    }
  }
  linchpinCandidates.sort((a, b) => b.weight - a.weight)
  for (const { c, orgs, weight } of linchpinCandidates.slice(0, 5)) {
    insights.push({
      id: `linchpin-${c.key}`,
      title: 'Cross-org maintenance bridge',
      severity: 'info',
      summary: `${c.login} carries material weight across ${orgs} orgs in this cohort.`,
      rationale: 'Useful coordination point for docs or onboarding — not a performance ranking.',
      metrics: { orgCount: orgs, edgeWeight: weight },
      related: [{ kind: 'contributor', key: c.key, label: c.login }],
      computedAt: now,
      confidence: confidence * 0.75,
    })
  }

  const seen = new Set<string>()
  return insights.filter((i) => {
    if (seen.has(i.id)) return false
    seen.add(i.id)
    return true
  })
}

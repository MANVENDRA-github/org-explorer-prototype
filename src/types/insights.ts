import type { ContributorKey, RepoKey } from './domain'

export type InsightSeverity = 'info' | 'watch' | 'concern'

export interface LinkedEntityRef {
  kind: 'repo' | 'contributor'
  key: RepoKey | ContributorKey
  label: string
}

export interface Insight {
  id: string
  title: string
  severity: InsightSeverity
  summary: string
  rationale: string
  metrics: Record<string, number | string>
  related: LinkedEntityRef[]
  computedAt: number
  confidence: number
}

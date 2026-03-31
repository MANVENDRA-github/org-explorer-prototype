export type OrgKey = string
export type RepoKey = string
export type ContributorKey = string

export type Granularity = 'week' | 'month'

export interface BucketStats {
  prsOpened: number
  prsMerged: number
  prsClosed: number
  issuesOpened: number
  issuesClosed: number
  activeContributors: number
}

export interface OrgConfig {
  login: string
  included: boolean
  addedAt: number
}

export interface NormalizedRepo {
  key: RepoKey
  orgLogin: string
  fullName: string
  name: string
  stars: number
  forks: number
  pushedAt: string | null
  updatedAt: string | null
  openIssuesCount: number
  sizeHint: 'S' | 'M' | 'L'
  aggregates: {
    prsOpened: number
    prsMerged: number
    prsClosed: number
    issuesOpened: number
    issuesClosed: number
    uniqueContributors: number
    lastActivityAt: string | null
  }
  series: Record<string, BucketStats>
  detailLevel: 'full' | 'meta'
  primaryLanguage?: string
}

export interface NormalizedContributor {
  key: ContributorKey
  login: string
  name: string | null
  avatarUrl: string | null
  orgsSeen: OrgKey[]
  aggregates: {
    prs: number
    issues: number
    lastContributionAt: string | null
    repoCount: number
  }
}

export interface ContributionEdge {
  id: string
  contributorKey: ContributorKey
  repoKey: RepoKey
  weight: number
  lastAt: string | null
}

export interface RateLimitState {
  remaining: number
  limit: number
  resetUnix: number
  used: number
  resource: string
}

export interface SyncProgress {
  phase: string
  current: number
  total: number
  message: string
}

export interface GraphNodePayload {
  id: string
  type: 'repo' | 'contributor'
  label: string
  size: number
  color: string
  activityScore: number
}

export interface GraphEdgePayload {
  id: string
  source: string
  target: string
  width: number
  weight: number
}

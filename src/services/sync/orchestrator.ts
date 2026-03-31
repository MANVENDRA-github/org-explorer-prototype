import { githubRequest, githubPaginate, type GitHubClientOptions, type GithubRepo, type GithubContributor, type GithubPull, type GithubIssue, GitHubError } from '@/lib/github/client'
import { db } from '@/lib/idb/database'
import { mergeRepoLists, repoKeyFromFullName, sizeHintFromStarsAndIssues } from '@/lib/merge/multi-org-merge'
import { weekKey, mergeBuckets, emptyBucket } from '@/lib/analytics/rollups'
import { computeInsights } from '@/lib/analytics/insights/engine'
import type { NormalizedRepo, NormalizedContributor, ContributionEdge, SyncProgress } from '@/types/domain'
import type { OrgConfig } from '@/types/domain'
import {
  MAX_REPOS_FULL_DETAIL,
  MAX_CONTRIBUTOR_PAGES,
  ACTIVITY_SAMPLE_PER_REPO,
} from '@/config/constants'
import { sleep } from '@/lib/github/rate-limit'

export type ProgressCallback = (p: SyncProgress) => void

async function throttleIfNeeded(): Promise<void> {
  await sleep(50)
}

function contributorKey(id: number): string {
  return String(id)
}

export interface SyncResult {
  repos: number
  contributors: number
  edges: number
  errors: string[]
  completeness: number
}

export async function runSync(
  orgs: OrgConfig[],
  options: GitHubClientOptions & {
    signal?: AbortSignal
    onProgress?: ProgressCallback
  },
): Promise<SyncResult> {
  const { token, onRateLimit, signal, onProgress } = options
  const clientOpts: GitHubClientOptions = { token, onRateLimit }
  const errors: string[] = []
  const includedOrgs = orgs.filter((o) => o.included).map((o) => o.login.trim()).filter(Boolean)

  if (!includedOrgs.length) {
    return { repos: 0, contributors: 0, edges: 0, errors: ['No organizations selected'], completeness: 0 }
  }

  onProgress?.({ phase: 'validate', current: 0, total: includedOrgs.length, message: 'Validating orgs…' })

  for (let i = 0; i < includedOrgs.length; i++) {
    const login = includedOrgs[i]
    try {
      await githubRequest(`/orgs/${encodeURIComponent(login)}`, { ...clientOpts, signal })
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) {
        errors.push(`Org not found: ${login}`)
      } else if (e instanceof Error) {
        errors.push(`${login}: ${e.message}`)
      }
    }
    onProgress?.({ phase: 'validate', current: i + 1, total: includedOrgs.length, message: login })
  }

  const validOrgs = includedOrgs.filter((o) => !errors.some((err) => err.includes(`Org not found: ${o}`)))
  if (!validOrgs.length) {
    return { repos: 0, contributors: 0, edges: 0, errors, completeness: 0 }
  }

  const byOrg = new Map<string, GithubRepo[]>()
  onProgress?.({ phase: 'repos', current: 0, total: validOrgs.length, message: 'Listing repositories…' })

  for (let i = 0; i < validOrgs.length; i++) {
    const org = validOrgs[i]
    try {
      const repos = await githubPaginate<GithubRepo>(
        (page) =>
          `/orgs/${encodeURIComponent(org)}/repos?per_page=100&page=${page}&sort=updated&type=all`,
        { ...clientOpts, signal, maxPages: 50 },
        () => false,
      )
      byOrg.set(org, repos)
    } catch (e) {
      if (e instanceof Error) errors.push(`${org} repos: ${e.message}`)
    }
    onProgress?.({ phase: 'repos', current: i + 1, total: validOrgs.length, message: org })
  }

  const merged = mergeRepoLists(byOrg)
  const forMeta = merged.map((r) => buildMetaRepo(r))
  const detailed = merged.slice(0, MAX_REPOS_FULL_DETAIL)

  const contributorMap = new Map<string, NormalizedContributor>()
  const edgeListRaw: ContributionEdge[] = []
  const globalSeries: Record<string, ReturnType<typeof emptyBucket>> = {}
  const authorsByWeek: Record<string, Set<string>> = {}

  let fullSynced = 0
  onProgress?.({
    phase: 'detail',
    current: 0,
    total: detailed.length,
    message: 'Fetching contributors & activity samples…',
  })

  for (let i = 0; i < detailed.length; i++) {
    const r = detailed[i]
    const rk = repoKeyFromFullName(r.full_name)
    const [owner, name] = r.full_name.split('/')
    try {
      await throttleIfNeeded()
      const contribPages: GithubContributor[] = []
      for (let p = 1; p <= MAX_CONTRIBUTOR_PAGES; p++) {
        const page = await githubRequest<GithubContributor[]>(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contributors?per_page=100&page=${p}`,
          { ...clientOpts, signal },
        )
        if (!page?.length) break
        contribPages.push(...page)
        if (page.length < 100) break
      }

      await throttleIfNeeded()
      const pulls = await githubRequest<GithubPull[]>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls?state=all&per_page=${ACTIVITY_SAMPLE_PER_REPO}&sort=updated&direction=desc`,
        { ...clientOpts, signal },
      )

      await throttleIfNeeded()
      const issues = await githubRequest<GithubIssue[]>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues?state=all&per_page=${ACTIVITY_SAMPLE_PER_REPO}&sort=updated&direction=desc`,
        { ...clientOpts, signal },
      )
      const realIssues = (issues ?? []).filter((x) => !x.pull_request)

      const series: Record<string, ReturnType<typeof emptyBucket>> = {}
      let prsOpened = 0,
        prsMerged = 0,
        prsClosed = 0
      for (const pr of pulls ?? []) {
        prsOpened += 1
        if (pr.merged_at) prsMerged += 1
        else if (pr.closed_at && pr.state === 'closed') prsClosed += 1
        const c = weekKey(new Date(pr.created_at))
        mergeBuckets(series, c, { prsOpened: 1 })
        if (pr.merged_at) {
          const m = weekKey(new Date(pr.merged_at))
          mergeBuckets(series, m, { prsMerged: 1 })
        } else if (pr.closed_at && pr.state === 'closed') {
          const cl = weekKey(new Date(pr.closed_at))
          mergeBuckets(series, cl, { prsClosed: 1 })
        }
        if (pr.user?.id) {
          const ck = contributorKey(pr.user.id)
          const wkOpen = weekKey(new Date(pr.created_at))
          if (!authorsByWeek[wkOpen]) authorsByWeek[wkOpen] = new Set()
          authorsByWeek[wkOpen].add(ck)
          mergeBuckets(globalSeries, wkOpen, { prsOpened: 1 })
          if (pr.merged_at) {
            const wm = weekKey(new Date(pr.merged_at))
            if (!authorsByWeek[wm]) authorsByWeek[wm] = new Set()
            authorsByWeek[wm].add(ck)
            mergeBuckets(globalSeries, wm, { prsMerged: 1 })
          }
          if (pr.closed_at && !pr.merged_at && pr.state === 'closed')
            mergeBuckets(globalSeries, weekKey(new Date(pr.closed_at)), { prsClosed: 1 })
        }
      }

      let issuesOpened = 0,
        issuesClosed = 0
      for (const is of realIssues) {
        issuesOpened += 1
        const c = weekKey(new Date(is.created_at))
        mergeBuckets(series, c, { issuesOpened: 1 })
        mergeBuckets(globalSeries, c, { issuesOpened: 1 })
        if (is.closed_at) {
          issuesClosed += 1
          const cl = weekKey(new Date(is.closed_at))
          mergeBuckets(series, cl, { issuesClosed: 1 })
          mergeBuckets(globalSeries, cl, { issuesClosed: 1 })
        }
      }

      const lastDates: string[] = []
      for (const pr of pulls ?? []) {
        lastDates.push(pr.created_at)
        if (pr.merged_at) lastDates.push(pr.merged_at)
      }
      for (const is of realIssues) {
        lastDates.push(is.created_at)
        if (is.closed_at) lastDates.push(is.closed_at)
      }
      const lastActivityAt =
        lastDates.length > 0
          ? lastDates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
          : r.pushed_at

      for (const cc of contribPages) {
        const id = cc.id
        const ck = id != null ? contributorKey(id) : `login:${cc.login.toLowerCase()}`
        const weight = Math.max(1, cc.contributions)
        const existing = contributorMap.get(ck)
        const orgLogin = r.owner.login.toLowerCase()
        if (!existing) {
          contributorMap.set(ck, {
            key: ck,
            login: cc.login,
            name: null,
            avatarUrl: cc.avatar_url ?? null,
            orgsSeen: [orgLogin],
            aggregates: { prs: 0, issues: 0, lastContributionAt: lastActivityAt, repoCount: 0 },
          })
        } else {
          if (!existing.orgsSeen.includes(orgLogin)) existing.orgsSeen.push(orgLogin)
          existing.aggregates.lastContributionAt = maxIso(
            existing.aggregates.lastContributionAt,
            lastActivityAt,
          )
        }
        edgeListRaw.push({
          id: `${ck}|${rk}`,
          contributorKey: ck,
          repoKey: rk,
          weight,
          lastAt: lastActivityAt,
        })
      }

      for (const pr of pulls ?? []) {
        if (!pr.user?.id) continue
        const ck = contributorKey(pr.user.id)
        if (!contributorMap.has(ck)) {
          contributorMap.set(ck, {
            key: ck,
            login: pr.user.login,
            name: null,
            avatarUrl: null,
            orgsSeen: [r.owner.login.toLowerCase()],
            aggregates: { prs: 0, issues: 0, lastContributionAt: pr.created_at, repoCount: 0 },
          })
        }
        edgeListRaw.push({
          id: `${ck}|${rk}|pr`,
          contributorKey: ck,
          repoKey: rk,
          weight: Math.max(2, 1),
          lastAt: pr.merged_at ?? pr.created_at,
        })
      }

      const uniqueContributors = new Set(contribPages.map((c) => (c.id != null ? contributorKey(c.id) : c.login)))
        .size

      const normalized: NormalizedRepo = {
        key: rk,
        orgLogin: r.owner.login,
        fullName: r.full_name,
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count ?? 0,
        pushedAt: r.pushed_at,
        updatedAt: r.updated_at,
        openIssuesCount: r.open_issues_count,
        sizeHint: sizeHintFromStarsAndIssues(r.stargazers_count, r.open_issues_count),
        aggregates: {
          prsOpened,
          prsMerged,
          prsClosed,
          issuesOpened,
          issuesClosed,
          uniqueContributors,
          lastActivityAt,
        },
        series,
        detailLevel: 'full',
      }

      await db.repos.put({ ...normalized, lastSyncedAt: Date.now() })
      fullSynced++
    } catch (e) {
      if (e instanceof Error) errors.push(`${r.full_name}: ${e.message}`)
      await db.repos.put({
        ...buildMetaRepo(r),
        lastSyncedAt: Date.now(),
      })
    }
    onProgress?.({ phase: 'detail', current: i + 1, total: detailed.length, message: r.full_name })
  }

  const metaOnly = forMeta.filter((m) => !detailed.some((d) => repoKeyFromFullName(d.full_name) === m.key))
  for (const m of metaOnly) {
    if (!(await db.repos.get(m.key)))
      await db.repos.put({ ...m, lastSyncedAt: Date.now() })
  }

  const edges = dedupeEdges(edgeListRaw)
  applyContributorAggregates(contributorMap, edges)

  for (const c of contributorMap.values()) {
    await db.contributors.put({ ...c, lastSyncedAt: Date.now() })
  }
  await db.edges.clear()
  for (const e of edges) await db.edges.put(e)

  const allRepos = await db.repos.toArray()
  const allContributors = await db.contributors.toArray()
  const allEdges = await db.edges.toArray()

  const completeness = Math.min(1, fullSynced / Math.max(1, detailed.length))

  for (const [wk, set] of Object.entries(authorsByWeek)) {
    if (!globalSeries[wk]) globalSeries[wk] = emptyBucket()
    globalSeries[wk].activeContributors = set.size
  }

  const insights = computeInsights(
    allRepos,
    allContributors,
    allEdges,
    globalSeries,
    completeness,
  )
  await db.saveInsightsSnapshot(insights, Date.now())
  await db.setMeta('global_series', globalSeries)
  await db.setMeta('last_sync', Date.now())
  await db.setMeta('sync_errors', errors)
  await db.setMeta('cohort_source', 'live')

  onProgress?.({
    phase: 'done',
    current: allRepos.length,
    total: allRepos.length,
    message: 'Done',
  })

  return {
    repos: allRepos.length,
    contributors: allContributors.length,
    edges: allEdges.length,
    errors,
    completeness,
  }
}

function buildMetaRepo(r: GithubRepo): NormalizedRepo {
  const rk = repoKeyFromFullName(r.full_name)
  return {
    key: rk,
    orgLogin: r.owner.login,
    fullName: r.full_name,
    name: r.name,
    stars: r.stargazers_count,
    forks: r.forks_count ?? 0,
    pushedAt: r.pushed_at,
    updatedAt: r.updated_at,
    openIssuesCount: r.open_issues_count,
    sizeHint: sizeHintFromStarsAndIssues(r.stargazers_count, r.open_issues_count),
    aggregates: {
      prsOpened: 0,
      prsMerged: 0,
      prsClosed: 0,
      issuesOpened: 0,
      issuesClosed: 0,
      uniqueContributors: 0,
      lastActivityAt: r.pushed_at,
    },
    series: {},
    detailLevel: 'meta',
  }
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return new Date(a) > new Date(b) ? a : b
}

function dedupeEdges(raw: ContributionEdge[]): ContributionEdge[] {
  const m = new Map<string, ContributionEdge>()
  for (const e of raw) {
    const k = `${e.contributorKey}|${e.repoKey}`
    const prev = m.get(k)
    if (!prev || e.weight > prev.weight) m.set(k, { ...e, id: k })
  }
  return [...m.values()]
}

function applyContributorAggregates(
  contributorMap: Map<string, NormalizedContributor>,
  edges: ContributionEdge[],
): void {
  const repoByC = new Map<string, Set<string>>()
  const lastByC = new Map<string, string | null>()
  const weightByC = new Map<string, number>()
  for (const e of edges) {
    if (!repoByC.has(e.contributorKey)) repoByC.set(e.contributorKey, new Set())
    repoByC.get(e.contributorKey)!.add(e.repoKey)
    const w = (weightByC.get(e.contributorKey) ?? 0) + e.weight
    weightByC.set(e.contributorKey, w)
    const prev = lastByC.get(e.contributorKey)
    lastByC.set(e.contributorKey, maxIso(prev ?? null, e.lastAt))
  }
  for (const [ck, c] of contributorMap) {
    c.aggregates.repoCount = repoByC.get(ck)?.size ?? 0
    c.aggregates.prs = weightByC.get(ck) ?? 0
    c.aggregates.lastContributionAt = lastByC.get(ck) ?? c.aggregates.lastContributionAt
  }
}

import type { NormalizedRepo, NormalizedContributor, ContributionEdge } from '@/types/domain'
import type { GraphEdgePayload, GraphNodePayload } from '@/types/domain'

const COLOR_REPO = '#3b82f6'
const COLOR_CONTRIBUTOR = '#22d3ee'

export interface GraphBuildFilters {
  minEdgeWeight: number
  minRepoStars: number
  activityPercentileCut: number
  maxNodes: number
}

const defaultFilters: GraphBuildFilters = {
  minEdgeWeight: 1,
  minRepoStars: 0,
  activityPercentileCut: 0,
  maxNodes: 400,
}

function activityScoreRepo(r: NormalizedRepo): number {
  const a = r.aggregates
  return (
    Math.log1p(r.stars) * 3 +
    a.prsMerged * 2 +
    a.prsOpened +
    a.uniqueContributors * 2 +
    (a.lastActivityAt ? 1 : 0)
  )
}

function activityScoreContributor(
  c: NormalizedContributor,
  edges: ContributionEdge[],
): number {
  const w = edges.filter((e) => e.contributorKey === c.key).reduce((s, e) => s + e.weight, 0)
  return Math.log1p(w) * 4 + c.aggregates.repoCount
}

export function buildGraphPayloads(
  repos: NormalizedRepo[],
  contributors: NormalizedContributor[],
  edges: ContributionEdge[],
  filters: Partial<GraphBuildFilters> = {},
): { nodes: GraphNodePayload[]; edges: GraphEdgePayload[] } {
  const f = { ...defaultFilters, ...filters }
  const repoList = repos.filter((r) => r.stars >= f.minRepoStars && r.detailLevel === 'full')
  if (!repoList.length) {
    const metaRepos = repos.filter((r) => r.stars >= f.minRepoStars)
    return buildFromMeta(metaRepos, contributors, edges, f)
  }

  let edgeList = edges.filter((e) => e.weight >= f.minEdgeWeight)
  const repoKeys = new Set(repoList.map((r) => r.key))
  edgeList = edgeList.filter((e) => repoKeys.has(e.repoKey))

  const contributorKeys = new Set(edgeList.map((e) => e.contributorKey))
  const contribList = contributors.filter((c) => contributorKeys.has(c.key))

  const repoScores = repoList.map((r) => ({ r, s: activityScoreRepo(r) }))
  const contribScores = contribList.map((c) => ({
    c,
    s: activityScoreContributor(c, edgeList),
  }))
  repoScores.sort((a, b) => b.s - a.s)
  contribScores.sort((a, b) => b.s - a.s)

  const cut = f.activityPercentileCut
  const repoCutIdx = Math.floor((repoScores.length * cut) / 100)
  const contribCutIdx = Math.floor((contribScores.length * cut) / 100)
  let nodes: GraphNodePayload[] = [
    ...repoScores.slice(repoCutIdx).map(({ r, s }) => ({
      id: `repo:${r.key}`,
      type: 'repo' as const,
      label: r.fullName,
      size: Math.min(28, 8 + Math.log1p(r.stars) * 2 + Math.log1p(r.aggregates.prsMerged)),
      color: COLOR_REPO,
      activityScore: s,
    })),
    ...contribScores.slice(contribCutIdx).map(({ c, s }) => ({
      id: `c:${c.key}`,
      type: 'contributor' as const,
      label: c.login,
      size: Math.min(22, 6 + Math.log1p(s) * 2),
      color: COLOR_CONTRIBUTOR,
      activityScore: s,
    })),
  ]

  const nodeIds = new Set(nodes.map((n) => n.id))
  edgeList = edgeList.filter(
    (e) => nodeIds.has(`repo:${e.repoKey}`) && nodeIds.has(`c:${e.contributorKey}`),
  )

  if (nodes.length > f.maxNodes) {
    nodes.sort((a, b) => b.activityScore - a.activityScore)
    nodes = nodes.slice(0, f.maxNodes)
    const allowed = new Set(nodes.map((n) => n.id))
    edgeList = edgeList.filter(
      (e) => allowed.has(`repo:${e.repoKey}`) && allowed.has(`c:${e.contributorKey}`),
    )
  }

  const graphEdges: GraphEdgePayload[] = edgeList.map((e) => ({
    id: e.id,
    source: `c:${e.contributorKey}`,
    target: `repo:${e.repoKey}`,
    width: Math.max(0.5, Math.sqrt(e.weight)),
    weight: e.weight,
  }))

  return { nodes, edges: graphEdges }
}

function buildFromMeta(
  repos: NormalizedRepo[],
  contributors: NormalizedContributor[],
  edges: ContributionEdge[],
  f: GraphBuildFilters,
): { nodes: GraphNodePayload[]; edges: GraphEdgePayload[] } {
  const repoList = repos.filter((r) => r.stars >= f.minRepoStars)
  let edgeList = edges.filter((e) => e.weight >= f.minEdgeWeight)
  const repoKeys = new Set(repoList.map((r) => r.key))
  edgeList = edgeList.filter((e) => repoKeys.has(e.repoKey))
  const ckeys = new Set(edgeList.map((e) => e.contributorKey))
  const nodes: GraphNodePayload[] = [
    ...repoList.map((r) => ({
      id: `repo:${r.key}`,
      type: 'repo' as const,
      label: r.fullName,
      size: Math.min(28, 8 + Math.log1p(r.stars) * 2),
      color: COLOR_REPO,
      activityScore: activityScoreRepo(r),
    })),
    ...contributors
      .filter((c) => ckeys.has(c.key))
      .map((c) => ({
        id: `c:${c.key}`,
        type: 'contributor' as const,
        label: c.login,
        size: Math.min(20, 6 + Math.log1p(c.aggregates.prs + c.aggregates.issues)),
        color: COLOR_CONTRIBUTOR,
        activityScore: activityScoreContributor(c, edgeList),
      })),
  ]
  if (nodes.length > f.maxNodes) {
    nodes.sort((a, b) => b.activityScore - a.activityScore)
  }
  const sliced = nodes.slice(0, f.maxNodes)
  const allowed = new Set(sliced.map((n) => n.id))
  edgeList = edgeList.filter(
    (e) => allowed.has(`repo:${e.repoKey}`) && allowed.has(`c:${e.contributorKey}`),
  )
  return {
    nodes: sliced,
    edges: edgeList.map((e) => ({
      id: e.id,
      source: `c:${e.contributorKey}`,
      target: `repo:${e.repoKey}`,
      width: Math.max(0.5, Math.sqrt(e.weight)),
      weight: e.weight,
    })),
  }
}

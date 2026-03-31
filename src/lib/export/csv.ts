import type { NormalizedRepo, NormalizedContributor } from '@/types/domain'
import type { Insight } from '@/types/insights'

function escapeCell(v: string | number | undefined | null): string {
  const s = v == null ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function reposToCsv(repos: NormalizedRepo[]): string {
  const headers = [
    'key',
    'fullName',
    'org',
    'stars',
    'forks',
    'primaryLanguage',
    'detailLevel',
    'prsOpened',
    'prsMerged',
    'prsClosed',
    'issuesOpened',
    'issuesClosed',
    'uniqueContributors',
    'lastActivityAt',
    'pushedAt',
  ]
  const rows = repos.map((r) =>
    [
      r.key,
      r.fullName,
      r.orgLogin,
      r.stars,
      r.forks ?? 0,
      r.primaryLanguage ?? '',
      r.detailLevel,
      r.aggregates.prsOpened,
      r.aggregates.prsMerged,
      r.aggregates.prsClosed,
      r.aggregates.issuesOpened,
      r.aggregates.issuesClosed,
      r.aggregates.uniqueContributors,
      r.aggregates.lastActivityAt ?? '',
      r.pushedAt ?? '',
    ].map(escapeCell),
  )
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export function contributorsToCsv(people: NormalizedContributor[]): string {
  const headers = ['key', 'login', 'orgsSeen', 'prsWeight', 'repoCount', 'lastContributionAt']
  const rows = people.map((c) =>
    [
      c.key,
      c.login,
      c.orgsSeen.join(';'),
      c.aggregates.prs,
      c.aggregates.repoCount,
      c.aggregates.lastContributionAt ?? '',
    ].map(escapeCell),
  )
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export function insightsToCsv(insights: Insight[]): string {
  const headers = ['id', 'title', 'severity', 'summary', 'confidence', 'related']
  const rows = insights.map((i) =>
    [
      i.id,
      i.title,
      i.severity,
      i.summary,
      i.confidence,
      i.related.map((r) => `${r.kind}:${r.label}`).join(';'),
    ].map(escapeCell),
  )
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export function downloadText(filename: string, content: string, mime = 'text/csv'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

import type { NormalizedRepo, NormalizedContributor, ContributionEdge } from '@/types/domain'

interface Props {
  open: boolean
  kind: 'repo' | 'contributor' | null
  repo: NormalizedRepo | null
  contributor: NormalizedContributor | null
  edges: ContributionEdge[]
  onClose: () => void
}

export function DetailDrawer({ open, kind, repo, contributor, edges, onClose }: Props) {
  if (!open) return null

  const relatedEdges =
    kind === 'repo' && repo
      ? edges.filter((e) => e.repoKey === repo.key).sort((a, b) => b.weight - a.weight)
      : kind === 'contributor' && contributor
        ? edges.filter((e) => e.contributorKey === contributor.key).sort((a, b) => b.weight - a.weight)
        : []

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 'min(420px, 100vw)',
        height: '100%',
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        zIndex: 50,
        padding: 20,
        overflow: 'auto',
        boxShadow: '-8px 0 32px #0006',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Details</h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {kind === 'repo' && repo && (
        <div style={{ marginTop: 20, fontSize: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 12 }}>
            {repo.fullName}
          </div>
          <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
            <Row label="Stars" value={String(repo.stars)} />
            <Row label="Detail level" value={repo.detailLevel} />
            <Row label="PRs (sample)" value={`${repo.aggregates.prsOpened} open sample / ${repo.aggregates.prsMerged} merged`} />
            <Row label="Issues (sample)" value={`${repo.aggregates.issuesOpened} / ${repo.aggregates.issuesClosed} closed`} />
            <Row label="Contributors (sample)" value={String(repo.aggregates.uniqueContributors)} />
            <Row label="Last activity" value={repo.aggregates.lastActivityAt ?? repo.pushedAt ?? '—'} />
          </dl>
          <h3 style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>Linked contributors</h3>
          <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
            {relatedEdges.slice(0, 24).map((e) => (
              <li key={e.id} style={{ marginBottom: 4 }}>
                weight {e.weight} · <span style={{ fontFamily: 'var(--font-mono)' }}>{e.contributorKey}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {kind === 'contributor' && contributor && (
        <div style={{ marginTop: 20, fontSize: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginBottom: 12 }}>
            @{contributor.login}
          </div>
          <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
            <Row label="Orgs seen" value={contributor.orgsSeen.join(', ') || '—'} />
            <Row label="Repos (edges)" value={String(contributor.aggregates.repoCount)} />
            <Row label="Contribution weight" value={String(contributor.aggregates.prs)} />
            <Row label="Last seen" value={contributor.aggregates.lastContributionAt ?? '—'} />
          </dl>
          <h3 style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>Repositories</h3>
          <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
            {relatedEdges.slice(0, 24).map((e) => (
              <li key={e.id} style={{ marginBottom: 4 }}>
                weight {e.weight} · <span style={{ fontFamily: 'var(--font-mono)' }}>{e.repoKey}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
      <dt className="text-muted" style={{ margin: 0 }}>
        {label}
      </dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  )
}

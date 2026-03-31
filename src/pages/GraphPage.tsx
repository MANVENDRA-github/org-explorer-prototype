import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExplorerGraph } from '@/components/graph/ExplorerGraph'
import { DetailDrawer } from '@/components/panels/DetailDrawer'
import { useIndexedData } from '@/hooks/useIndexedData'
import { useUiStore } from '@/state/ui-store'

export function GraphPage() {
  const { repos, contributors, edges, loading } = useIndexedData()
  const hoverRef = useRef<{ id: string | null; label: string } | null>(null)
  const [hoverUi, setHoverUi] = useState<{ label: string } | null>(null)
  const [panel, setPanel] = useState<{
    kind: 'repo' | 'contributor'
    key: string
  } | null>(null)

  const minEdge = useUiStore((s) => s.graphMinEdge)
  const setGraphMinEdge = useUiStore((s) => s.setGraphMinEdge)
  const minStars = useUiStore((s) => s.graphMinStars)
  const setGraphMinStars = useUiStore((s) => s.setGraphMinStars)
  const percentileCut = useUiStore((s) => s.graphPercentileCut)
  const setGraphPercentileCut = useUiStore((s) => s.setGraphPercentileCut)

  const selectedRepo = useMemo(
    () => (panel?.kind === 'repo' ? repos.find((r) => r.key === panel.key) ?? null : null),
    [panel, repos],
  )
  const selectedContributor = useMemo(
    () =>
      panel?.kind === 'contributor'
        ? contributors.find((c) => c.key === panel.key) ?? null
        : null,
    [panel, contributors],
  )

  const onSelectNode = useCallback(
    (_id: string | null, payload: { type: 'repo' | 'contributor'; key: string } | null) => {
      if (!payload) {
        setPanel(null)
        return
      }
      setPanel({ kind: payload.type, key: payload.key })
    },
    [],
  )

  useEffect(() => {
    let id: number
    const tick = () => {
      const h = hoverRef.current
      setHoverUi(h?.label ? { label: h.label } : null)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <header style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Contribution network
          </h1>
          <p className="text-muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
            Repos ↔ people (sampled edges). Layout uses force — not rankings.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
          <label className="text-muted" style={{ fontSize: 12 }}>
            Min edge weight
            <input
              type="range"
              min={1}
              max={20}
              value={minEdge}
              onChange={(e) => setGraphMinEdge(Number(e.target.value))}
              style={{ display: 'block', width: 120 }}
            />
            <span style={{ color: 'var(--text)' }}>{minEdge}</span>
          </label>
          <label className="text-muted" style={{ fontSize: 12 }}>
            Min stars
            <input
              type="number"
              min={0}
              value={minStars}
              onChange={(e) => setGraphMinStars(Number(e.target.value) || 0)}
              style={{
                display: 'block',
                width: 72,
                marginTop: 4,
                padding: 4,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-root)',
                color: 'var(--text)',
              }}
            />
          </label>
          <label className="text-muted" style={{ fontSize: 12 }}>
            Trim low-activity %
            <input
              type="range"
              min={0}
              max={40}
              value={percentileCut}
              onChange={(e) => setGraphPercentileCut(Number(e.target.value))}
              style={{ display: 'block', width: 120 }}
            />
            <span style={{ color: 'var(--text)' }}>{percentileCut}%</span>
          </label>
        </div>
      </header>

      {loading && <p className="text-muted">Loading cache…</p>}

      <div style={{ position: 'relative', flex: 1, minHeight: 400 }}>
        <ExplorerGraph
          repos={repos}
          contributors={contributors}
          edges={edges}
          onSelectNode={onSelectNode}
          hoverRef={hoverRef}
        />
        {hoverUi && (
          <div
            className="panel"
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '8px 12px',
              fontSize: 12,
              pointerEvents: 'none',
              maxWidth: 320,
            }}
          >
            {hoverUi.label}
          </div>
        )}
      </div>

      <DetailDrawer
        open={panel != null}
        kind={panel?.kind ?? null}
        repo={selectedRepo}
        contributor={selectedContributor}
        edges={edges}
        onClose={() => setPanel(null)}
      />
    </div>
  )
}

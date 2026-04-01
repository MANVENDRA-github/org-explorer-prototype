import { useCallback, useEffect, useMemo } from 'react'
import Graph from 'graphology'
import { SigmaContainer, useLoadGraph, useRegisterEvents } from '@react-sigma/core'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { ControlsContainer, ZoomControl } from '@react-sigma/core'
import { buildGraphPayloads } from '@/lib/analytics/graph-build'
import type { NormalizedRepo, NormalizedContributor, ContributionEdge } from '@/types/domain'
import { useUiStore } from '@/state/ui-store'
import { useSystemColorScheme } from '@/hooks/useSystemColorScheme'
import '@react-sigma/core/lib/style.css'

interface Props {
  repos: NormalizedRepo[]
  contributors: NormalizedContributor[]
  edges: ContributionEdge[]
  onSelectNode: (id: string | null, payload: { type: 'repo' | 'contributor'; key: string } | null) => void
  hoverRef: React.MutableRefObject<{ id: string | null; label: string } | null>
}

function GraphLoader({
  repos,
  contributors,
  edges,
  onSelectNode,
  hoverRef,
}: Omit<Props, 'onSelectNode'> & { onSelectNode: Props['onSelectNode'] }) {
  const loadGraph = useLoadGraph()
  const registerEvents = useRegisterEvents()
  const minEdge = useUiStore((s) => s.graphMinEdge)
  const minStars = useUiStore((s) => s.graphMinStars)
  const percentileCut = useUiStore((s) => s.graphPercentileCut)

  const { nodes, edges: ge } = useMemo(
    () =>
      buildGraphPayloads(repos, contributors, edges, {
        minEdgeWeight: minEdge,
        minRepoStars: minStars,
        activityPercentileCut: percentileCut,
        maxNodes: 450,
      }),
    [repos, contributors, edges, minEdge, minStars, percentileCut],
  )

  useEffect(() => {
    const g = new Graph({ type: 'undirected' })
    for (const n of nodes) {
      const angle = Math.random() * Math.PI * 2
      const r = 40 + Math.random() * 120
      g.addNode(n.id, {
        label: n.label,
        size: n.size,
        color: n.color,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      })
    }
    for (const e of ge) {
      if (!g.hasNode(e.source) || !g.hasNode(e.target)) continue
      try {
        g.addEdge(e.source, e.target, { size: Math.max(0.3, e.width * 0.35) })
      } catch {
      }
    }
    forceAtlas2.assign(g, {
      iterations: 120,
      settings: { gravity: 1.2, scalingRatio: 8 },
      getEdgeWeight: 'size',
    })

    loadGraph(g)
    return () => {
      g.clear()
    }
  }, [nodes, ge, loadGraph])

  useEffect(() => {
    registerEvents({
      clickNode: (ev) => {
        const id = ev.node
        if (id.startsWith('repo:')) {
          onSelectNode(id, { type: 'repo', key: id.slice(5) })
        } else if (id.startsWith('c:')) {
          onSelectNode(id, { type: 'contributor', key: id.slice(2) })
        } else {
          onSelectNode(id, null)
        }
      },
      enterNode: (ev) => {
        const label = nodes.find((x) => x.id === ev.node)?.label ?? ev.node
        hoverRef.current = { id: ev.node, label }
      },
      leaveNode: () => {
        hoverRef.current = null
      },
      clickStage: () => {
        onSelectNode(null, null)
      },
    })
  }, [registerEvents, onSelectNode, nodes, hoverRef])

  return null
}

export function ExplorerGraph(props: Props) {
  const { hoverRef } = props
  const colorScheme = useSystemColorScheme()

  const sigmaSettings = useMemo(
    () => ({
      renderLabels: true,
      labelDensity: 0.35,
      labelFont: 'Inter, sans-serif',
      defaultNodeColor: colorScheme === 'light' ? '#2563eb' : '#58a6ff',
      defaultEdgeColor: colorScheme === 'light' ? 'rgba(100, 116, 139, 0.4)' : 'rgba(39, 43, 54, 0.55)',
    }),
    [colorScheme],
  )

  const setSelected = useCallback(
    (id: string | null, payload: { type: 'repo' | 'contributor'; key: string } | null) => {
      useUiStore.getState().setSelectedNodeId(id)
      props.onSelectNode(id, payload)
    },
    [props],
  )

  if (!props.repos.length) {
    return (
      <div className="panel" style={{ height: 520, display: 'grid', placeItems: 'center' }}>
        <p className="text-muted">Sync organizations to build the graph.</p>
      </div>
    )
  }

  return (
    <div className="panel" style={{ height: 620, position: 'relative', overflow: 'hidden' }}>
      <SigmaContainer style={{ height: '100%', width: '100%', background: 'var(--bg-root)' }} settings={sigmaSettings}>
        <GraphLoader {...props} onSelectNode={setSelected} hoverRef={hoverRef} />
        <ControlsContainer position="bottom-right">
          <ZoomControl />
        </ControlsContainer>
      </SigmaContainer>
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          fontSize: 11,
          color: 'var(--text-muted)',
          pointerEvents: 'none',
          maxWidth: 280,
        }}
      >
        Repos = blue · People = mint · Edge weight ≈ contribution
      </div>
    </div>
  )
}

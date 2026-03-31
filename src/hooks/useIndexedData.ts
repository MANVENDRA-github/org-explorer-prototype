import { useEffect, useState } from 'react'
import { db } from '@/lib/idb/database'
import type { RepoRow, ContributorRow, EdgeRow } from '@/lib/idb/database'
import type { Insight } from '@/types/insights'
import type { BucketStats } from '@/types/domain'
import { useAppStore } from '@/state/app-store'

export interface IndexedDataState {
  repos: RepoRow[]
  contributors: ContributorRow[]
  edges: EdgeRow[]
  insights: Insight[]
  globalSeries: Record<string, BucketStats>
  loading: boolean
}

export function useIndexedData(): IndexedDataState {
  const dataVersion = useAppStore((s) => s.dataVersion)
  const [state, setState] = useState<IndexedDataState>({
    repos: [],
    contributors: [],
    edges: [],
    insights: [],
    globalSeries: {},
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [repos, contributors, edges, snap, gs] = await Promise.all([
        db.repos.toArray(),
        db.contributors.toArray(),
        db.edges.toArray(),
        db.getInsightsSnapshot(),
        db.getMeta<Record<string, BucketStats>>('global_series'),
      ])
      if (cancelled) return
      setState({
        repos,
        contributors,
        edges,
        insights: snap?.insights ?? [],
        globalSeries: gs ?? {},
        loading: false,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [dataVersion])

  return state
}

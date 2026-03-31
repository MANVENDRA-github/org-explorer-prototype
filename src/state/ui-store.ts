import { create } from 'zustand'
import type { Granularity } from '@/types/domain'

export interface UiState {
  timeRangeDays: number
  granularity: Granularity
  graphMinEdge: number
  graphMinStars: number
  graphPercentileCut: number
  search: string
  selectedNodeId: string | null
  setTimeRangeDays: (d: number) => void
  setGranularity: (g: Granularity) => void
  setGraphMinEdge: (n: number) => void
  setGraphMinStars: (n: number) => void
  setGraphPercentileCut: (n: number) => void
  setSearch: (s: string) => void
  setSelectedNodeId: (id: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  timeRangeDays: 365,
  granularity: 'week' as Granularity,
  graphMinEdge: 1,
  graphMinStars: 0,
  graphPercentileCut: 0,
  search: '',
  selectedNodeId: null,
  setTimeRangeDays: (d) => set({ timeRangeDays: d }),
  setGranularity: (g) => set({ granularity: g }),
  setGraphMinEdge: (n) => set({ graphMinEdge: n }),
  setGraphMinStars: (n) => set({ graphMinStars: n }),
  setGraphPercentileCut: (n) => set({ graphPercentileCut: n }),
  setSearch: (s) => set({ search: s }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}))

import { create } from 'zustand'
import type { RateLimitState, SyncProgress } from '@/types/domain'
import { db } from '@/lib/idb/database'
import type { OrgConfig } from '@/types/domain'

const SESSION_PAT_KEY = 'org-explorer-pat'

export interface AppState {
  token: string
  rememberToken: boolean
  rateLimit: RateLimitState | null
  syncProgress: SyncProgress | null
  syncing: boolean
  dataVersion: number
  orgs: OrgConfig[]
  setToken: (t: string, remember?: boolean) => void
  setRateLimit: (r: RateLimitState | null) => void
  setSyncProgress: (p: SyncProgress | null) => void
  setSyncing: (v: boolean) => void
  setOrgs: (o: OrgConfig[]) => void
  addOrg: (login: string) => Promise<void>
  removeOrg: (login: string) => Promise<void>
  loadOrgs: () => Promise<void>
  bumpDataVersion: () => void
  toggleOrgIncluded: (login: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  token: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_PAT_KEY) ?? '' : '',
  rememberToken: false,
  rateLimit: null,
  syncProgress: null,
  syncing: false,
  dataVersion: 0,
  orgs: [],

  setToken: (t, remember = false) => {
    if (typeof sessionStorage !== 'undefined') {
      if (t) sessionStorage.setItem(SESSION_PAT_KEY, t)
      else sessionStorage.removeItem(SESSION_PAT_KEY)
    }
    set({ token: t, rememberToken: remember })
  },

  setRateLimit: (r) => set({ rateLimit: r }),
  setSyncProgress: (p) => set({ syncProgress: p }),
  setSyncing: (v) => set({ syncing: v }),
  setOrgs: (orgs) => set({ orgs }),

  loadOrgs: async () => {
    const rows = await db.orgConfigs.toArray()
    set({ orgs: rows })
  },

  addOrg: async (login) => {
    const trimmed = login.trim().toLowerCase()
    if (!trimmed) return
    const { orgs } = get()
    if (orgs.some((o) => o.login.toLowerCase() === trimmed)) return
    const next: OrgConfig = { login: trimmed, included: true, addedAt: Date.now() }
    await db.orgConfigs.put(next)
    set({ orgs: [...orgs, next] })
  },

  removeOrg: async (login) => {
    const { orgs } = get()
    await db.orgConfigs.delete(login.toLowerCase())
    set({ orgs: orgs.filter((o) => o.login !== login) })
  },

  bumpDataVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),

  toggleOrgIncluded: async (login) => {
    const { orgs } = get()
    const next = orgs.map((o) =>
      o.login === login ? { ...o, included: !o.included } : o,
    )
    const row = next.find((o) => o.login === login)
    if (row) await db.orgConfigs.put(row)
    set({ orgs: next })
  },
}))

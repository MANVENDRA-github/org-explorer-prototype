import Dexie, { type Table } from 'dexie'
import type { NormalizedContributor, NormalizedRepo } from '@/types/domain'
import type { ContributionEdge } from '@/types/domain'
import type { OrgConfig } from '@/types/domain'
import type { Insight } from '@/types/insights'

export const DB_NAME = 'org-explorer-v1'
export const SCHEMA_VERSION = 1

export interface MetaRow {
  id: string
  value: unknown
}

export interface OrgConfigRow extends OrgConfig {}

export interface RepoRow extends NormalizedRepo {
  lastSyncedAt: number
}

export interface ContributorRow extends NormalizedContributor {
  lastSyncedAt: number
}

export interface EdgeRow extends ContributionEdge {}

export class OrgExplorerDB extends Dexie {
  meta!: Table<MetaRow, string>
  orgConfigs!: Table<OrgConfigRow, string>
  repos!: Table<RepoRow, string>
  contributors!: Table<ContributorRow, string>
  edges!: Table<EdgeRow, string>

  constructor() {
    super(DB_NAME)
    this.version(SCHEMA_VERSION).stores({
      meta: 'id',
      orgConfigs: 'login',
      repos: 'key, orgLogin, stars, detailLevel',
      contributors: 'key, login',
      edges: 'id, repoKey, contributorKey',
    })
  }

  async setMeta(id: string, value: unknown): Promise<void> {
    await this.meta.put({ id, value })
  }

  async getMeta<T>(id: string): Promise<T | undefined> {
    const row = await this.meta.get(id)
    return row?.value as T | undefined
  }

  async saveInsightsSnapshot(insights: Insight[], computedAt: number): Promise<void> {
    await this.setMeta('insights_snapshot', { insights, computedAt })
  }

  async getInsightsSnapshot(): Promise<{ insights: Insight[]; computedAt: number } | null> {
    const v = await this.getMeta<{ insights: Insight[]; computedAt: number }>('insights_snapshot')
    return v ?? null
  }
}

export const db = new OrgExplorerDB()

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.orgConfigs, db.repos, db.contributors, db.edges, db.meta], async () => {
    await db.orgConfigs.clear()
    await db.repos.clear()
    await db.contributors.clear()
    await db.edges.clear()
    await db.meta.clear()
  })
}

export async function clearDataset(): Promise<void> {
  await db.transaction('rw', [db.repos, db.contributors, db.edges, db.meta], async () => {
    await db.repos.clear()
    await db.contributors.clear()
    await db.edges.clear()
    for (const id of [
      'global_series',
      'insights_snapshot',
      'last_sync',
      'sync_errors',
      'aossie_demo_applied',
      'aossie_demo_seed_version',
      'cohort_source',
    ]) {
      await db.meta.delete(id)
    }
  })
}

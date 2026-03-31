import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Library, Star, GitFork, CircleAlert, ExternalLink, Users } from 'lucide-react'
import { useAppStore } from '@/state/app-store'
import { runSync } from '@/services/sync/orchestrator'
import { clearDataset } from '@/lib/idb/database'
import { ExportModal } from '@/components/export/ExportModal'
import { useIndexedData } from '@/hooks/useIndexedData'
import { AossieLogoMark, AossieWordmark } from '@/components/branding/AossieBrand'
import { OverviewCharts } from '@/components/overview/OverviewCharts'
import { AOSSIE_DEMO_ORG_SNAPSHOT, USE_AOSSIE_DEMO_SEED } from '@/mock/aossie-org-demo.seed'

export function HomePage() {
  const token = useAppStore((s) => s.token)
  const setToken = useAppStore((s) => s.setToken)
  const orgs = useAppStore((s) => s.orgs)
  const loadOrgs = useAppStore((s) => s.loadOrgs)
  const addOrg = useAppStore((s) => s.addOrg)
  const removeOrg = useAppStore((s) => s.removeOrg)
  const toggleOrgIncluded = useAppStore((s) => s.toggleOrgIncluded)
  const setRateLimit = useAppStore((s) => s.setRateLimit)
  const setSyncProgress = useAppStore((s) => s.setSyncProgress)
  const setSyncing = useAppStore((s) => s.setSyncing)
  const syncProgress = useAppStore((s) => s.syncProgress)
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion)
  const { repos, contributors, insights, globalSeries, loading: cacheLoading } = useIndexedData()
  const [newOrg, setNewOrg] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [exportOpen, setExportOpen] = useState(false)

  const nf = useMemo(() => new Intl.NumberFormat(), [])
  const stats = useMemo(() => {
    const totalStars = repos.reduce((s, r) => s + r.stars, 0)
    const totalForks = repos.reduce((s, r) => s + (r.forks ?? 0), 0)
    const openIssues = repos.reduce((s, r) => s + (r.openIssuesCount ?? 0), 0)
    return {
      repoCount: repos.length,
      totalStars,
      totalForks,
      openIssues,
      contributorCount: contributors.length,
    }
  }, [repos, contributors])

  useEffect(() => {
    void loadOrgs()
  }, [loadOrgs])

  const cohortTitle =
    orgs.filter((o) => o.included).length === 1
      ? orgs.find((o) => o.included)?.login.toUpperCase() ?? 'AOSSIE-ORG'
      : 'MERGED COHORT'

  const run = async () => {
    setSyncing(true)
    setLog([])
    try {
      const result = await runSync(orgs, {
        token: token || undefined,
        onRateLimit: setRateLimit,
        onProgress: setSyncProgress,
      })
      bumpDataVersion()
      setLog([
        `Indexed repositories: ${result.repos}`,
        `People: ${result.contributors}`,
        `Contribution links: ${result.edges}`,
        `Sample depth: ${(result.completeness * 100).toFixed(0)}% of top repositories`,
        ...result.errors.map((e) => `— ${e}`),
      ])
    } catch (e) {
      setLog([e instanceof Error ? e.message : 'Sync failed'])
    } finally {
      setSyncing(false)
      setSyncProgress(null)
    }
  }

  const clearCache = async () => {
    await clearDataset()
    bumpDataVersion()
    if (USE_AOSSIE_DEMO_SEED && typeof window !== 'undefined') window.location.reload()
    else setLog(['Local cache cleared. Org list unchanged.'])
  }

  const hasCohortData = repos.length > 0

  return (
    <div style={{ padding: 24, maxWidth: 1180, margin: '0 auto', width: '100%' }}>
      <section
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          marginBottom: 28,
          flexWrap: 'wrap',
          padding: '20px 22px',
          borderRadius: 14,
          background: 'var(--bg-panel)',
          boxShadow: '0 1px 0 var(--border)',
        }}
      >
        <AossieLogoMark square height={64} maxWidth={64} />
        <div style={{ flex: '1 1 280px', minWidth: 0, maxWidth: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: '8px 18px',
            }}
          >
            <AossieWordmark large />
            <span
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.14em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                paddingBottom: 3,
              }}
            >
              ORG EXPLORER
            </span>
          </div>
          <h1
            style={{
              margin: '14px 0 0',
              fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            {cohortTitle}
          </h1>
          <p
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              color: 'var(--text-muted)',
              fontWeight: 600,
              margin: '6px 0 0',
            }}
          >
            OVERVIEW · COHORT HEALTH
          </p>
          <p
            className="text-muted"
            style={{ margin: '12px 0 0', fontSize: 14, maxWidth: 640, lineHeight: 1.55 }}
          >
            Merged, offline-friendly read of public GitHub activity for this organization set. Official org:{' '}
            <a href="https://github.com/AOSSIE-Org" target="_blank" rel="noreferrer">
              github.com/AOSSIE-Org
            </a>{' '}
            ·{' '}
            <a href={AOSSIE_DEMO_ORG_SNAPSHOT.websiteUrl} target="_blank" rel="noreferrer">
              aossie.org
            </a>
            .
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <a
              href="https://github.com/AOSSIE-Org"
              target="_blank"
              rel="noreferrer"
              className="panel"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
              }}
            >
              Open on GitHub <ExternalLink size={16} />
            </a>
            <button
              type="button"
              className="panel"
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid var(--brand-lime-dim)',
                background: 'var(--brand-lime-dim)',
                color: 'var(--brand-lime)',
                fontWeight: 600,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => setExportOpen(true)}
            >
              Export
            </button>
          </div>
        </div>
      </section>

      {!cacheLoading && hasCohortData && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 14,
              marginBottom: 22,
            }}
          >
            <StatCard
              label="Repositories"
              value={nf.format(stats.repoCount)}
              icon={<Library size={22} strokeWidth={2.2} />}
              tone="lime"
            />
            <StatCard
              label="Stars"
              value={nf.format(stats.totalStars)}
              icon={<Star size={22} strokeWidth={2.2} />}
              tone="lime"
            />
            <StatCard
              label="Forks"
              value={nf.format(stats.totalForks)}
              icon={<GitFork size={22} strokeWidth={2.2} />}
              tone="mint"
            />
            <StatCard
              label="Open issues"
              value={nf.format(stats.openIssues)}
              icon={<CircleAlert size={22} strokeWidth={2.2} />}
              tone="warn"
            />
            <StatCard
              label="Contributors"
              value={nf.format(stats.contributorCount)}
              icon={<Users size={22} strokeWidth={2.2} />}
              tone="mint"
            />
          </div>

          <OverviewCharts repos={repos} globalSeries={globalSeries} insights={insights} />
        </>
      )}

      {!cacheLoading && !hasCohortData && (
        <p className="text-muted" style={{ marginBottom: 24, fontSize: 14 }}>
          No cohort data in IndexedDB yet. Add organizations below and run <strong>Refresh cohort</strong>, or
          clear local cache and reload if you expect data to be reloaded automatically.
        </p>
      )}

      <section className="panel" style={{ padding: 20, marginTop: 8, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
          LIVE SYNC · API
        </h2>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          GitHub token (optional · classic PAT, repo read)
        </label>
        <input
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_…"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-root)',
            color: 'var(--text)',
          }}
        />
      </section>

      <section className="panel" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
          ORGANIZATIONS
        </h2>
        <p className="text-muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
          Include orgs in the next refresh (e.g. <strong style={{ color: 'var(--text)' }}>AOSSIE-Org</strong>).
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={newOrg}
            onChange={(e) => setNewOrg(e.target.value)}
            placeholder="organization slug"
            onKeyDown={(e) => e.key === 'Enter' && void addOrg(newOrg).then(() => setNewOrg(''))}
            style={{
              flex: '1 1 200px',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-root)',
              color: 'var(--text)',
            }}
          />
          <button
            type="button"
            onClick={() => void addOrg(newOrg).then(() => setNewOrg(''))}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--brand-lime)',
              background: 'var(--brand-lime-dim)',
              color: 'var(--brand-lime)',
              fontWeight: 700,
            }}
          >
            Add
          </button>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {orgs.map((o) => (
            <li
              key={o.login}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' }}>
                <input type="checkbox" checked={o.included} onChange={() => void toggleOrgIncluded(o.login)} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>{o.login}</span>
              </label>
              <button
                type="button"
                onClick={() => void removeOrg(o.login)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: 12,
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {orgs.length === 0 && <p className="text-muted">No orgs yet — add at least one slug.</p>}
      </section>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => void run()}
          disabled={!orgs.filter((o) => o.included).length}
          style={{
            padding: '12px 22px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(180deg, #e6ff5a, #b8e62e)',
            color: '#141414',
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            opacity: orgs.filter((o) => o.included).length ? 1 : 0.5,
          }}
        >
          REFRESH COHORT
        </button>
        <button
          type="button"
          onClick={() => void clearCache()}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          CLEAR CACHE
        </button>
      </div>

      {syncProgress && (
        <div className="panel" style={{ padding: 16, marginBottom: 16, fontSize: 14 }}>
          <strong style={{ color: 'var(--brand-lime)' }}>{syncProgress.phase}</strong> — {syncProgress.message}{' '}
          <span className="text-muted">
            ({syncProgress.current}/{syncProgress.total || '?'})
          </span>
        </div>
      )}

      {log.length > 0 && (
        <pre
          className="panel"
          style={{
            padding: 16,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {log.join('\n')}
        </pre>
      )}

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: ReactNode
  tone: 'lime' | 'mint' | 'warn'
}) {
  const iconColor =
    tone === 'lime' ? 'var(--brand-lime)' : tone === 'mint' ? 'var(--cyan)' : 'var(--warning)'
  return (
    <div
      className="panel"
      style={{
        padding: '16px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {label.toUpperCase()}
        </div>
        <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
      </div>
      <span style={{ color: iconColor, opacity: 0.95, display: 'flex' }} aria-hidden>
        {icon}
      </span>
    </div>
  )
}

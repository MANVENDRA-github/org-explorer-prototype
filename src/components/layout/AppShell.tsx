import { FormEvent, ReactNode, useState } from 'react'
import { NavLink, Outlet, To, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, FolderGit2, Users, Share2, LineChart, Search } from 'lucide-react'
import { useAppStore } from '@/state/app-store'
import { secondsUntilReset } from '@/lib/github/rate-limit'
import { AossieLogoMark } from '@/components/branding/AossieBrand'

type NavItem = {
  key: string
  to: To
  label: string
  end?: boolean
  icon: ReactNode
}

const navItems: NavItem[] = [
  { key: 'overview', to: '/', label: 'Overview', end: true, icon: <LayoutGrid size={18} strokeWidth={2.25} /> },
  {
    key: 'repos',
    to: { pathname: '/data', search: '?tab=repos' },
    label: 'Repositories',
    icon: <FolderGit2 size={18} strokeWidth={2.25} />,
  },
  {
    key: 'contributors',
    to: { pathname: '/data', search: '?tab=contributors' },
    label: 'Contributors',
    icon: <Users size={18} strokeWidth={2.25} />,
  },
  { key: 'graph', to: '/graph', label: 'Network', icon: <Share2 size={18} strokeWidth={2.25} /> },
  { key: 'analytics', to: '/analytics', label: 'Signals', icon: <LineChart size={18} strokeWidth={2.25} /> },
]

function navItemActive(pathname: string, search: string, item: NavItem): boolean {
  const q = new URLSearchParams(search)
  if (item.key === 'overview') return pathname === '/'
  if (item.key === 'repos')
    return pathname === '/data' && (q.get('tab') == null || q.get('tab') === 'repos')
  if (item.key === 'contributors') return pathname === '/data' && q.get('tab') === 'contributors'
  if (item.key === 'graph') return pathname === '/graph'
  if (item.key === 'analytics') return pathname === '/analytics'
  return false
}

export function AppShell() {
  const rateLimit = useAppStore((s) => s.rateLimit)
  const syncing = useAppStore((s) => s.syncing)
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarSearch, setSidebarSearch] = useState('')

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = sidebarSearch.trim()
    const suffix = q ? `&q=${encodeURIComponent(q)}` : ''
    navigate(`/data?tab=repos${suffix}`)
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <aside
        style={{
          width: 252,
          flexShrink: 0,
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem 0.85rem',
        }}
      >
        <div
          style={{
            padding: '0 0.25rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <AossieLogoMark height={46} maxWidth={46} />
          <div
            style={{
              marginTop: 10,
              fontSize: '0.62rem',
              letterSpacing: '0.16em',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            ORG EXPLORER
          </div>
        </div>

        <form onSubmit={onSearchSubmit} style={{ marginTop: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-root)',
            }}
          >
            <Search size={16} color="var(--text-muted)" aria-hidden />
            <input
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="AOSSIE-Org / repo…"
              aria-label="Quick search repositories"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--text)',
                outline: 'none',
                fontSize: 13,
              }}
            />
          </div>
        </form>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14 }}>
          {navItems.map((item) => {
            const active = navItemActive(location.pathname, location.search, item)
            return (
              <NavLink key={item.key} to={item.to} end={item.end} style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0.55rem 0.65rem',
                    borderRadius: 8,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    border: active ? '1px solid var(--border)' : '1px solid transparent',
                    borderLeft: active ? '3px solid var(--brand-lime)' : '3px solid transparent',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      color: active ? 'var(--brand-lime)' : 'var(--text-muted)',
                      opacity: active ? 1 : 0.85,
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label.toUpperCase()}
                </span>
              </NavLink>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {rateLimit && (
            <div>
              API budget {rateLimit.remaining}/{rateLimit.limit}
              {rateLimit.remaining < 20 && (
                <span style={{ color: 'var(--warning)', marginLeft: 6 }}>
                  · reset {secondsUntilReset(rateLimit.resetUnix)}s
                </span>
              )}
            </div>
          )}
          {syncing && (
            <div style={{ color: 'var(--brand-lime)', marginTop: 6 }}>Refreshing cohort…</div>
          )}
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

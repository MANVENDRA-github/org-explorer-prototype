import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useIndexedData } from '@/hooks/useIndexedData'
import type { NormalizedRepo, NormalizedContributor } from '@/types/domain'

const repoHelper = createColumnHelper<NormalizedRepo>()
const contribHelper = createColumnHelper<NormalizedContributor>()

export function DataPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'contributors' ? 'contributors' : 'repos'

  const setTab = (t: 'repos' | 'contributors') => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set('tab', t)
      return n
    })
    setPage(0)
  }

  const { repos, contributors, loading } = useIndexedData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  useEffect(() => {
    const q = searchParams.get('q')
    setSearch(q ?? '')
  }, [searchParams])

  const repoColumns = useMemo(
    () => [
      repoHelper.accessor('fullName', { header: 'Repository', cell: (i) => i.getValue() }),
      repoHelper.accessor('stars', { header: 'Stars' }),
      repoHelper.accessor('primaryLanguage', {
        header: 'Language',
        cell: (i) => i.getValue() ?? '—',
      }),
      repoHelper.accessor((r) => r.forks ?? 0, { id: 'forks', header: 'Forks' }),
      repoHelper.accessor('detailLevel', { header: 'Coverage' }),
      repoHelper.accessor('aggregates.prsMerged', { header: 'PRs merged (sample)' }),
      repoHelper.accessor('aggregates.issuesOpened', { header: 'Issues (sample)' }),
      repoHelper.accessor('aggregates.uniqueContributors', { header: 'Contributors' }),
      repoHelper.accessor('aggregates.lastActivityAt', {
        header: 'Last activity',
        cell: (i) => i.getValue() ?? '—',
      }),
    ],
    [],
  )
//cols
  const contributorColumns = useMemo(
    () => [
      contribHelper.accessor('login', { header: 'Login' }),
      contribHelper.accessor('orgsSeen', {
        header: 'Orgs',
        cell: (i) => i.getValue().join(', '),
      }),
      contribHelper.accessor('aggregates.prs', { header: 'Weight' }),
      contribHelper.accessor('aggregates.repoCount', { header: 'Repos' }),
      contribHelper.accessor('aggregates.lastContributionAt', {
        header: 'Last active',
        cell: (i) => i.getValue() ?? '—',
      }),
    ],
    [],
  )

  const repoTable = useReactTable({
    data: repos,
    columns: repoColumns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _cid, filter) => {
      const q = String(filter).toLowerCase()
      if (!q) return true
      return (
        row.original.fullName.toLowerCase().includes(q) ||
        row.original.orgLogin.toLowerCase().includes(q)
      )
    },
  })

  const contribTable = useReactTable({
    data: contributors,
    columns: contributorColumns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _cid, filter) => {
      const q = String(filter).toLowerCase()
      if (!q) return true
      return row.original.login.toLowerCase().includes(q)
    },
  })

  const repoRows = repoTable.getRowModel().rows
  const contribRows = contribTable.getRowModel().rows
  const activeLen = tab === 'repos' ? repoRows.length : contribRows.length
  const pageCount = Math.max(1, Math.ceil(activeLen / pageSize))
  const pageSafe = Math.min(page, pageCount - 1)
  const start = pageSafe * pageSize
  const repoSlice = repoRows.slice(start, start + pageSize)
  const contribSlice = contribRows.slice(start, start + pageSize)

  return (
    <div style={{ padding: 24, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Cohort directories
        </h1>
        <p className="text-muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
          Repositories and people across merged orgs — sort, search, paginate locally.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setTab('repos')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: tab === 'repos' ? '1px solid var(--brand-lime)' : '1px solid var(--border)',
            background: tab === 'repos' ? 'var(--brand-lime-dim)' : 'var(--bg-elevated)',
            color: tab === 'repos' ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
          }}
        >
          REPOSITORIES · {repos.length}
        </button>
        <button
          type="button"
          onClick={() => setTab('contributors')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: tab === 'contributors' ? '1px solid var(--brand-lime)' : '1px solid var(--border)',
            background: tab === 'contributors' ? 'var(--brand-lime-dim)' : 'var(--bg-elevated)',
            color: tab === 'contributors' ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
          }}
        >
          CONTRIBUTORS · {contributors.length}
        </button>
      </div>

      <input
        placeholder="Search this table…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(0)
        }}
        style={{
          maxWidth: 320,
          padding: '8px 12px',
          marginBottom: 12,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-root)',
          color: 'var(--text)',
        }}
      />

      {loading && <p className="text-muted">Loading local cache…</p>}

      <div className="panel" style={{ overflow: 'auto', flex: 1 }}>
        {tab === 'repos' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              {repoTable.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        cursor: h.column.getCanSort() ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {repoSlice.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'contributors' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              {contribTable.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        cursor: h.column.getCanSort() ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {contribSlice.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <button
          type="button"
          disabled={pageSafe <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
          }}
        >
          Previous
        </button>
        <span className="text-muted" style={{ fontSize: 13 }}>
          Page {pageSafe + 1} / {pageCount} · {activeLen} rows
        </span>
        <button
          type="button"
          disabled={pageSafe >= pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

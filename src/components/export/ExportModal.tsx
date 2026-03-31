import { useState } from 'react'
import { useIndexedData } from '@/hooks/useIndexedData'
import { downloadText, contributorsToCsv, insightsToCsv, reposToCsv } from '@/lib/export/csv'
import { buildInsightsPdf } from '@/lib/export/pdf'

interface Props {
  open: boolean
  onClose: () => void
}

export function ExportModal({ open, onClose }: Props) {
  const { repos, contributors, insights } = useIndexedData()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  if (!open) return null

  const csvBundle = () => {
    downloadText('org-explorer-repos.csv', reposToCsv(repos))
    downloadText('org-explorer-contributors.csv', contributorsToCsv(contributors))
    downloadText('org-explorer-insights.csv', insightsToCsv(insights))
    setStatus('CSV files downloaded.')
  }

  const pdfReport = async () => {
    setBusy(true)
    setStatus('')
    try {
      const topRepos = [...repos].sort((a, b) => b.stars - a.stars)
      const blob = buildInsightsPdf({
        title: 'AOSSIE Org Explorer — cohort report',
        generatedAt: new Date().toISOString(),
        summaryLines: [
          `Repositories in cache: ${repos.length}`,
          `Contributors: ${contributors.length}`,
          `Insights generated: ${insights.length}`,
          'PR/issue charts are not rasterized here — capture the Analytics tab for slide decks.',
        ],
        insights,
        repoCount: repos.length,
        contributorCount: contributors.length,
        topRepos,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `org-explorer-report-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('PDF downloaded.')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'PDF failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000a',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{ width: 'min(440px, 100%)', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800 }}>Export cohort</h2>
        <p className="text-muted" style={{ fontSize: 13, marginTop: 0 }}>
          CSV: repos, people, insight rows. PDF: narrative + insight text — capture Signals charts separately
          if you need figures.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            disabled={!repos.length && !contributors.length}
            onClick={csvBundle}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
              fontWeight: 600,
            }}
          >
            Download CSV bundle (3 files)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void pdfReport()}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--accent)',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              fontWeight: 600,
            }}
          >
            {busy ? 'Building PDF…' : 'Download PDF report'}
          </button>
        </div>
        {status && <p style={{ fontSize: 13, marginTop: 12 }}>{status}</p>}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

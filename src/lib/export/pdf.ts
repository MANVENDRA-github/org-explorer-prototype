import { jsPDF } from 'jspdf'
import type { Insight } from '@/types/insights'
import type { NormalizedRepo } from '@/types/domain'

export function buildInsightsPdf(opts: {
  title: string
  generatedAt: string
  summaryLines: string[]
  insights: Insight[]
  repoCount: number
  contributorCount: number
  topRepos: NormalizedRepo[]
}): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  let y = 48
  const margin = 48
  const lineH = 16

  doc.setFontSize(18)
  doc.text(opts.title, margin, y)
  y += 28
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${opts.generatedAt}`, margin, y)
  y += lineH * 2
  doc.setTextColor(0)

  doc.setFontSize(11)
  doc.text('Summary', margin, y)
  y += lineH
  doc.setFontSize(10)
  for (const line of opts.summaryLines) {
    const wrapped = doc.splitTextToSize(line, pageW - margin * 2) as string[]
    for (const w of wrapped) {
      if (y > 760) {
        doc.addPage()
        y = 48
      }
      doc.text(w, margin, y)
      y += lineH
    }
  }
  y += lineH

  if (y > 700) {
    doc.addPage()
    y = 48
  }
  doc.setFontSize(11)
  doc.text(`Key insights (${opts.insights.length})`, margin, y)
  y += lineH * 1.2

  doc.setFontSize(9)
  for (const i of opts.insights.slice(0, 25)) {
    const block = [
      `[${i.severity.toUpperCase()}] ${i.title}`,
      i.summary,
      `Confidence: ${(i.confidence * 100).toFixed(0)}%`,
      '',
    ].join('\n')
    const lines = doc.splitTextToSize(block, pageW - margin * 2) as string[]
    for (const ln of lines) {
      if (y > 780) {
        doc.addPage()
        y = 48
      }
      doc.text(ln, margin, y)
      y += lineH - 2
    }
    y += 6
  }

  y += lineH
  if (y > 720) {
    doc.addPage()
    y = 48
  }
  doc.setFontSize(11)
  doc.text('Top repositories (by stars)', margin, y)
  y += lineH
  doc.setFontSize(9)
  for (const r of opts.topRepos.slice(0, 15)) {
    const t = `${r.fullName} — ★${r.stars} — merges(sample): ${r.aggregates.prsMerged}`
    if (y > 780) {
      doc.addPage()
      y = 48
    }
    doc.text(t, margin, y)
    y += lineH - 2
  }

  doc.setFontSize(8)
  doc.setTextColor(120)
  y = doc.internal.pageSize.getHeight() - 36
  doc.text(
    'AOSSIE Org Explorer — local-first. Chart snapshots: use the Signals view in the browser.',
    margin,
    y,
  )

  return doc.output('blob')
}

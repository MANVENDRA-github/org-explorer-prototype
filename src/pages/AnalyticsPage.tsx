import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useIndexedData } from '@/hooks/useIndexedData'
import { useSystemColorScheme } from '@/hooks/useSystemColorScheme'
import { useUiStore } from '@/state/ui-store'
import { filterSeriesByDays } from '@/lib/analytics/time-window'
import { sortedBucketKeys } from '@/lib/analytics/rollups'
import { getEChartsTheme, tooltipBase } from '@/lib/charts/chartTheme'

export function AnalyticsPage() {
  const colorScheme = useSystemColorScheme()
  const theme = useMemo(() => getEChartsTheme(colorScheme), [colorScheme])
  const { insights, globalSeries, loading, repos } = useIndexedData()
  const timeRangeDays = useUiStore((s) => s.timeRangeDays)
  const setTimeRangeDays = useUiStore((s) => s.setTimeRangeDays)
  const granularity = useUiStore((s) => s.granularity)
  const setGranularity = useUiStore((s) => s.setGranularity)

  const filtered = useMemo(
    () => filterSeriesByDays(globalSeries, timeRangeDays, granularity),
    [globalSeries, timeRangeDays, granularity],
  )

  const categories = useMemo(() => sortedBucketKeys(filtered), [filtered])

  const prOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle: { color: theme.textMuted },
      grid: { left: 52, right: 28, top: 40, bottom: 52, containLabel: true },
      tooltip: {
        ...tooltipBase(theme),
        axisPointer: { type: 'cross', lineStyle: { color: theme.axisLine } },
      },
      legend: {
        data: ['PRs opened', 'Merged', 'Closed'],
        textStyle: { color: theme.text, fontSize: 12 },
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: theme.text, rotate: categories.length > 14 ? 32 : 0, fontSize: 11, margin: 10 },
        axisLine: { lineStyle: { color: theme.axisLine } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.splitLine } },
        axisLabel: { color: theme.text, fontSize: 11 },
        minInterval: 1,
      },
      series: [
        {
          name: 'PRs opened',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          data: categories.map((k) => filtered[k]?.prsOpened ?? 0),
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: 'Merged',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          data: categories.map((k) => filtered[k]?.prsMerged ?? 0),
          itemStyle: { color: '#22c55e' },
        },
        {
          name: 'Closed',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          data: categories.map((k) => filtered[k]?.prsClosed ?? 0),
          itemStyle: { color: '#8b5cf6' },
        },
      ],
    }),
    [categories, filtered, theme],
  )

  const issueOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle: { color: theme.textMuted },
      grid: { left: 52, right: 28, top: 40, bottom: 52, containLabel: true },
      tooltip: { ...tooltipBase(theme), axisPointer: { type: 'shadow' } },
      legend: { data: ['Issues opened', 'Closed'], textStyle: { color: theme.text, fontSize: 12 }, top: 0 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: theme.text, rotate: categories.length > 14 ? 32 : 0, fontSize: 11 },
        axisLine: { lineStyle: { color: theme.axisLine } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.splitLine } },
        axisLabel: { color: theme.text, fontSize: 11 },
        minInterval: 1,
      },
      series: [
        {
          name: 'Issues opened',
          type: 'bar',
          barMaxWidth: 36,
          data: categories.map((k) => filtered[k]?.issuesOpened ?? 0),
          itemStyle: { color: '#ea580c', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Closed',
          type: 'bar',
          barMaxWidth: 36,
          data: categories.map((k) => filtered[k]?.issuesClosed ?? 0),
          itemStyle: { color: '#64748b', borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [categories, filtered, theme],
  )

  const contribOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle: { color: theme.textMuted },
      grid: { left: 52, right: 28, top: 36, bottom: 52, containLabel: true },
      tooltip: {
        ...tooltipBase(theme),
        axisPointer: { type: 'line', lineStyle: { color: theme.axisLine, type: 'dashed' } },
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: theme.text, rotate: categories.length > 14 ? 32 : 0, fontSize: 11 },
        axisLine: { lineStyle: { color: theme.axisLine } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.splitLine } },
        axisLabel: { color: theme.text, fontSize: 11 },
        minInterval: 1,
      },
      series: [
        {
          name: 'Active contributors (proxy)',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2.5 },
          areaStyle: { opacity: colorScheme === 'light' ? 0.15 : 0.2 },
          data: categories.map((k) => filtered[k]?.activeContributors ?? 0),
          itemStyle: { color: '#06b6d4' },
        },
      ],
    }),
    [categories, filtered, theme, colorScheme],
  )

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <header style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Signals & timelines
          </h1>
          <p className="text-muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
            Interpreted from local cache — not a full mirror of GitHub.
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="text-muted" style={{ fontSize: 12 }}>
            Window (days)
            <select
              value={timeRangeDays}
              onChange={(e) => setTimeRangeDays(Number(e.target.value))}
              style={{
                display: 'block',
                marginTop: 4,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
              }}
            >
              {[90, 180, 365, 730].map((d) => (
                <option key={d} value={d}>
                  {d}d
                </option>
              ))}
            </select>
          </label>
          <label className="text-muted" style={{ fontSize: 12 }}>
            Granularity
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as 'week' | 'month')}
              style={{
                display: 'block',
                marginTop: 4,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
              }}
            >
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </label>
        </div>
      </header>

      {loading && <p className="text-muted">Loading…</p>}

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: 12, color: 'var(--text-muted)' }}>
          INSIGHT CARDS
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 12,
          }}
        >
          {insights.length === 0 && (
            <div className="panel text-muted" style={{ padding: 16 }}>
              Run <strong>Refresh cohort</strong> on Overview to compute insights.
            </div>
          )}
          {insights.map((i) => (
            <article
              key={i.id}
              className="panel"
              style={{
                padding: 16,
                borderLeft: `3px solid ${
                  i.severity === 'concern'
                    ? 'var(--danger)'
                    : i.severity === 'watch'
                      ? 'var(--warning)'
                      : 'var(--accent)'
                }`,
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {i.severity} · {(i.confidence * 100).toFixed(0)}% confidence
              </div>
              <h3 style={{ margin: '8px 0', fontSize: '0.95rem' }}>{i.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{i.summary}</p>
              <p style={{ margin: '10px 0 0', fontSize: 12, fontStyle: 'italic' }}>{i.rationale}</p>
              {i.related.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {i.related.map((r) => (
                    <span
                      key={`${r.kind}-${r.key}`}
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {r.kind}: {r.label}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {categories.length > 0 ? (
        <>
          <section className="panel" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>Pull requests over time</h3>
            <ReactECharts option={prOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} notMerge />
          </section>
          <section className="panel" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>Issues over time</h3>
            <ReactECharts option={issueOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} notMerge />
          </section>
          <section className="panel" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>Contributor activity proxy</h3>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 0 }}>
              Series from PR authorship in sync sample; extend sync for fuller coverage.
            </p>
            <ReactECharts option={contribOption} style={{ height: 260 }} opts={{ renderer: 'canvas' }} notMerge />
          </section>
        </>
      ) : (
        !loading && (
          <p className="text-muted">
            No time buckets yet. Detailed sync populates weekly aggregates from merged orgs (
            {repos.length} repos in cache).
          </p>
        )
      )}
    </div>
  )
}

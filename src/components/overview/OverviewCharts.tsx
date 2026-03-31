import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { NormalizedRepo, BucketStats } from '@/types/domain'
import type { Insight } from '@/types/insights'
import { sortedBucketKeys } from '@/lib/analytics/rollups'
import { useSystemColorScheme } from '@/hooks/useSystemColorScheme'
import { getEChartsTheme, tooltipBase, tooltipItem } from '@/lib/charts/chartTheme'

const PIE_COLORS = ['#f2d049', '#66b032', '#5ec8ff', '#a78bfa', '#fb923c', '#22d3ee', '#f472b6']

export function OverviewCharts(props: {
  repos: NormalizedRepo[]
  globalSeries: Record<string, BucketStats>
  insights: Insight[]
}) {
  const { repos, globalSeries, insights } = props
  const colorScheme = useSystemColorScheme()
  const theme = useMemo(() => getEChartsTheme(colorScheme), [colorScheme])
  const pieBorder = colorScheme === 'light' ? '#ffffff' : '#0a0a0c'

  const langPie = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of repos) {
      const lang = r.primaryLanguage ?? 'Other'
      map.set(lang, (map.get(lang) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [repos])

  const topReposBar = useMemo(() => {
    return [...repos]
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 10)
      .map((r) => ({ name: r.name, stars: r.stars, forks: r.forks }))
  }, [repos])

  const timeKeys = useMemo(() => sortedBucketKeys(globalSeries), [globalSeries])

  const activityLine = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle: { color: theme.textMuted },
      grid: { left: 52, right: 24, top: 36, bottom: 48, containLabel: true },
      tooltip: {
        ...tooltipBase(theme),
        axisPointer: { type: 'cross', lineStyle: { color: theme.axisLine, width: 1 } },
      },
      legend: {
        textStyle: { color: theme.text, fontSize: 12 },
        data: ['PRs merged', 'Issues closed'],
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: timeKeys,
        axisLabel: { color: theme.text, rotate: timeKeys.length > 10 ? 28 : 0, fontSize: 11, margin: 12 },
        axisLine: { lineStyle: { color: theme.axisLine, width: 1 } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.splitLine, width: 1 } },
        axisLabel: { color: theme.text, fontSize: 11 },
        minInterval: 1,
      },
      series: [
        {
          name: 'PRs merged',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: true,
          lineStyle: { width: 2.5 },
          data: timeKeys.map((k) => globalSeries[k]?.prsMerged ?? 0),
          itemStyle: { color: '#f2d049' },
          areaStyle: { opacity: colorScheme === 'light' ? 0.14 : 0.18 },
        },
        {
          name: 'Issues closed',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: true,
          lineStyle: { width: 2.5 },
          data: timeKeys.map((k) => globalSeries[k]?.issuesClosed ?? 0),
          itemStyle: { color: '#66b032' },
          areaStyle: { opacity: colorScheme === 'light' ? 0.1 : 0.12 },
        },
      ],
    }),
    [globalSeries, timeKeys, theme, colorScheme],
  )

  const pieOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle: { color: theme.textMuted },
      tooltip: {
        ...tooltipItem(theme),
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}<br/>${p.value} repos (${p.percent}%)`,
      },
      legend: {
        bottom: 4,
        textStyle: { color: theme.text, fontSize: 11 },
        type: 'scroll',
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '72%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: pieBorder, borderWidth: 2 },
          label: {
            color: theme.text,
            fontSize: 11,
            formatter: '{b}\n{d}%',
          },
          labelLine: { lineStyle: { color: theme.axisLine } },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.2)' },
          },
          data: langPie.map((x, i) => ({
            ...x,
            itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
          })),
        },
      ],
    }),
    [langPie, theme, pieBorder],
  )

  const barOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle: { color: theme.textMuted },
      grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase(theme),
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.splitLine } },
        axisLabel: { color: theme.text, fontSize: 11 },
        minInterval: 1,
      },
      yAxis: {
        type: 'category',
        data: topReposBar.map((r) => r.name),
        axisLabel: { color: theme.text, fontSize: 12, margin: 10 },
        axisLine: { lineStyle: { color: theme.axisLine } },
      },
      series: [
        {
          name: 'Stars',
          type: 'bar',
          barMaxWidth: 28,
          data: topReposBar.map((r) => r.stars),
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#66b032' },
                { offset: 1, color: '#f2d049' },
              ],
            },
          },
        },
      ],
    }),
    [topReposBar, theme],
  )

  const hasTime = timeKeys.length > 0
  const hasLang = langPie.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 16,
        }}
      >
        <section className="panel" style={{ padding: '16px 18px' }}>
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            ACTIVITY (WEEKLY)
          </h3>
          {hasTime ? (
            <ReactECharts
              option={activityLine}
              style={{ height: 280 }}
              opts={{ renderer: 'canvas' }}
              notMerge
            />
          ) : (
            <p className="text-muted" style={{ fontSize: 13 }}>
              No time buckets yet — run a cohort refresh to populate weekly aggregates.
            </p>
          )}
        </section>

        <section className="panel" style={{ padding: '16px 18px' }}>
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            LANGUAGES (REPO COUNT)
          </h3>
          {hasLang ? (
            <ReactECharts option={pieOption} style={{ height: 300 }} opts={{ renderer: 'canvas' }} notMerge />
          ) : (
            <p className="text-muted" style={{ fontSize: 13 }}>
              No language tags on cached repos.
            </p>
          )}
        </section>
      </div>

      <section className="panel" style={{ padding: '16px 18px' }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          TOP REPOSITORIES BY STARS
        </h3>
        <ReactECharts
          option={barOption}
          style={{ height: Math.max(300, topReposBar.length * 40) }}
          opts={{ renderer: 'canvas' }}
          notMerge
        />
      </section>

      {insights.length > 0 && (
        <section className="panel" style={{ padding: '18px 20px' }}>
          <h3
            style={{
              margin: '0 0 14px',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            SIGNAL PREVIEW
          </h3>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {insights.slice(0, 4).map((i) => (
              <article
                key={i.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-root)',
                  borderLeft: `3px solid ${
                    i.severity === 'concern' ? 'var(--danger)' : i.severity === 'watch' ? 'var(--warning)' : 'var(--brand-lime)'
                  }`,
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {i.severity}
                </div>
                <div style={{ fontWeight: 700, marginTop: 6, fontSize: 14 }}>{i.title}</div>
                <p className="text-muted" style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.45 }}>
                  {i.summary}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

import type { ColorScheme } from '@/hooks/useSystemColorScheme'

export type EChartsThemeColors = {
  text: string
  textMuted: string
  axisLine: string
  splitLine: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

export function getEChartsTheme(scheme: ColorScheme): EChartsThemeColors {
  if (scheme === 'light') {
    return {
      text: '#334155',
      textMuted: '#64748b',
      axisLine: '#94a3b8',
      splitLine: '#e2e8f0',
      tooltipBg: 'rgba(255, 255, 255, 0.97)',
      tooltipBorder: '#cbd5e1',
      tooltipText: '#0f172a',
    }
  }
  return {
    text: '#a8b3c4',
    textMuted: '#7d8a9e',
    axisLine: '#3d4a5e',
    splitLine: '#2a3444',
    tooltipBg: 'rgba(22, 26, 34, 0.96)',
    tooltipBorder: '#3d4a5e',
    tooltipText: '#e8edf4',
  }
}

export const tooltipBase = (t: EChartsThemeColors) =>
  ({
    trigger: 'axis' as const,
    backgroundColor: t.tooltipBg,
    borderColor: t.tooltipBorder,
    borderWidth: 1,
    textStyle: { color: t.tooltipText, fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 8px;',
  })

export const tooltipItem = (t: EChartsThemeColors) =>
  ({
    trigger: 'item' as const,
    backgroundColor: t.tooltipBg,
    borderColor: t.tooltipBorder,
    borderWidth: 1,
    textStyle: { color: t.tooltipText, fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 8px;',
  })

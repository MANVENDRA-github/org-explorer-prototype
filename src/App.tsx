import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { GraphPage } from '@/pages/GraphPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { DataPage } from '@/pages/DataPage'
import { useAppStore } from '@/state/app-store'
import { applyAossieDemoSeedIfEnabled, USE_AOSSIE_DEMO_SEED } from '@/mock/aossie-org-demo.seed'

export default function App() {
  const loadOrgs = useAppStore((s) => s.loadOrgs)
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion)

  useEffect(() => {
    void (async () => {
      await loadOrgs()
      if (USE_AOSSIE_DEMO_SEED) {
        const seeded = await applyAossieDemoSeedIfEnabled()
        if (seeded) bumpDataVersion()
      }
    })()
  }, [loadOrgs, bumpDataVersion])

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/data" element={<DataPage />} />
      </Route>
    </Routes>
  )
}

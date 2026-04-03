import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ReviewSession } from './components/review/ReviewSession'
import { PairList } from './components/browse/PairList'
import { Dashboard } from './components/stats/Dashboard'
import { AuditPage } from './components/audit/AuditPage'
import { DataLoader } from './components/DataLoader'
import { isContentLoaded } from './lib/db'

function App() {
  const [dataReady, setDataReady] = useState<boolean | null>(null)

  useEffect(() => {
    isContentLoaded().then(setDataReady)
  }, [])

  // Loading state
  if (dataReady === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">起動中...</div>
      </div>
    )
  }

  // Need to load data
  if (!dataReady) {
    return <DataLoader onLoaded={() => setDataReady(true)} />
  }

  return (
    <BrowserRouter basename="/deltamed">
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/review" element={<ReviewSession />} />
          <Route path="/browse" element={<PairList />} />
          <Route path="/stats" element={<Dashboard />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/review" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

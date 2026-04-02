import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

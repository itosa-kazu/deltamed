import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/review', label: '復習', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { path: '/browse', label: '一覧', icon: 'M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z' },
  { path: '/stats', label: '統計', icon: 'M3 3v18h18M9 17V9m4 8V5m4 12v-4' },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="flex items-center justify-around h-14 bg-slate-900/80 backdrop-blur
                    border-t border-slate-800">
      {tabs.map(tab => {
        const active = location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-6 py-1.5 transition-colors touch-manipulation
              ${active ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <svg
              className="w-5 h-5"
              fill={tab.path === '/review' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={tab.path === '/review' ? 0 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d={tab.icon} />
            </svg>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

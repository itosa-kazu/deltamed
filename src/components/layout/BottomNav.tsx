import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/review', label: '復習', icon: '&#9733;' },
  { path: '/browse', label: '一覧', icon: '&#9776;' },
  { path: '/stats', label: '統計', icon: '&#9635;' },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="flex items-center justify-around h-14 bg-slate-900 border-t border-slate-700">
      {tabs.map(tab => {
        const active = location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors touch-manipulation
              ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span
              className="text-xl"
              dangerouslySetInnerHTML={{ __html: tab.icon }}
            />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

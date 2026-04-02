import type { SessionStats } from '../../lib/types'

interface Props {
  stats: SessionStats
  onRestart: () => void
}

export function SessionSummary({ stats, onRestart }: Props) {
  const rate = stats.total > 0 ? ((stats.recalled / stats.total) * 100).toFixed(0) : '0'

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="text-2xl font-bold mb-6">復習完了</div>

      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-slate-200">{stats.total}</div>
            <div className="text-sm text-slate-400 mt-1">合計</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">{stats.recalled}</div>
            <div className="text-sm text-slate-400 mt-1">覚えた</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-400">{stats.forgotten}</div>
            <div className="text-sm text-slate-400 mt-1">忘れた</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700 text-center">
          <div className="text-4xl font-bold text-blue-400">{rate}%</div>
          <div className="text-sm text-slate-400 mt-1">正答率</div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white
                   font-medium text-lg px-12 py-4 rounded-2xl transition-colors
                   touch-manipulation"
      >
        もう一度
      </button>
    </div>
  )
}

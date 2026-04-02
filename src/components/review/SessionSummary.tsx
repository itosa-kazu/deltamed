import { motion } from 'framer-motion'
import type { SessionStats } from '../../lib/types'

interface Props {
  stats: SessionStats
  onRestart: () => void
}

export function SessionSummary({ stats, onRestart }: Props) {
  const rate = stats.total > 0 ? ((stats.recalled / stats.total) * 100).toFixed(0) : '0'

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="text-xl font-bold text-white mb-6">復習完了</div>

        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50
                        rounded-2xl p-6 w-full max-w-xs shadow-lg shadow-black/20 mb-8">
          {/* Accuracy ring */}
          <div className="text-5xl font-bold text-indigo-400 mb-1">{rate}%</div>
          <div className="text-xs text-slate-500 mb-5">正答率</div>

          <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-slate-700/50">
            <div>
              <div className="text-xl font-bold text-slate-300">{stats.total}</div>
              <div className="text-xs text-slate-500">合計</div>
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400">{stats.recalled}</div>
              <div className="text-xs text-slate-500">覚えた</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-400">{stats.forgotten}</div>
              <div className="text-xs text-slate-500">忘れた</div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white
                     font-semibold text-base px-12 py-4 rounded-2xl
                     shadow-lg shadow-indigo-900/30 touch-manipulation"
        >
          もう一度
        </button>
      </motion.div>
    </div>
  )
}

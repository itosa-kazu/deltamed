import { motion } from 'framer-motion'
import type { S3Card } from '../../lib/types'

interface Props {
  card: S3Card
  onReady: () => void
  index: number
  total: number
}

export function QuestionCard({ card, onReady, index, total }: Props) {
  return (
    <div className="flex flex-col items-center justify-between h-full px-5 py-4">
      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5 px-0.5">
          <span>{index + 1} / {total}</span>
          <span>Level {card.level}</span>
        </div>
        <div className="w-full h-0.5 bg-slate-800 rounded-full">
          <div
            className="h-0.5 bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50
                        rounded-2xl p-8 w-full text-center shadow-lg shadow-black/20">
          <div className="text-xs tracking-wider text-slate-500 uppercase mb-6">
            鑑別ポイント
          </div>
          <div className="mb-6">
            <span className="text-indigo-400 font-semibold text-lg">
              {card.disease_a_ja}
            </span>
            <span className="text-slate-600 mx-3 text-sm">vs</span>
            <span className="text-amber-400 font-semibold text-lg">
              {card.disease_b_ja}
            </span>
          </div>
          <div className="text-slate-400 text-sm pt-4 border-t border-slate-700/50">
            鑑別に有用な検査・所見は？
          </div>
        </div>
      </motion.div>

      {/* Ready button */}
      <button
        onClick={onReady}
        className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white
                   font-semibold text-base w-full max-w-sm py-4 rounded-2xl
                   shadow-lg shadow-indigo-900/30 touch-manipulation"
      >
        答えを見る
      </button>
    </div>
  )
}

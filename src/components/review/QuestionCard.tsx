import { motion } from 'framer-motion'
import type { S3Card } from '../../lib/types'

interface Props {
  card: S3Card
  onJudge: (useful: boolean) => void
  index: number
  total: number
}

export function QuestionCard({ card, onJudge, index, total }: Props) {
  const concept = card.concepts[0]
  if (!concept) return null

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
                        rounded-2xl p-6 w-full text-center shadow-lg shadow-black/20">
          {/* Disease pair */}
          <div className="mb-4">
            <span className="text-indigo-400 font-semibold text-base">
              {card.disease_a_ja}
            </span>
            <span className="text-slate-600 mx-2 text-sm">vs</span>
            <span className="text-amber-400 font-semibold text-base">
              {card.disease_b_ja}
            </span>
          </div>

          {/* Variable name — the key info */}
          <div className="py-4 border-t border-b border-slate-700/50">
            <div className="text-2xl font-bold text-emerald-400">
              {concept.variable_ja}
            </div>
          </div>

          {/* Question */}
          <div className="text-slate-400 text-sm mt-4">
            この所見は鑑別に有用？
          </div>
        </div>
      </motion.div>

      {/* Judgment buttons */}
      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={() => onJudge(false)}
          className="flex-1 bg-slate-700/60 hover:bg-slate-600/60 active:bg-slate-600/80
                     border border-slate-600/30 text-slate-300
                     font-semibold text-sm py-3.5 rounded-2xl touch-manipulation"
        >
          有用でない
        </button>
        <button
          onClick={() => onJudge(true)}
          className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25
                     border border-emerald-500/20 text-emerald-400
                     font-semibold text-sm py-3.5 rounded-2xl touch-manipulation"
        >
          鑑別に有用
        </button>
      </div>
    </div>
  )
}

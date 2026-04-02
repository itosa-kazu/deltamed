import { motion } from 'framer-motion'
import type { S3Card } from '../../lib/types'

interface Props {
  card: S3Card
  onSwipe: (featureId: string, recalled: boolean) => void
  index: number
  total: number
}

export function AnswerReveal({ card, onSwipe, index, total }: Props) {
  const concept = card.concepts[0]
  if (!concept) return null

  const higherDisease = concept.favors === 'a' ? card.disease_a_ja : card.disease_b_ja

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Progress */}
      <div className="absolute top-4 left-0 right-0 px-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{index + 1} / {total}</span>
          <span>Level {card.level}</span>
        </div>
        <div className="w-full h-1 bg-slate-700 rounded-full">
          <div
            className="h-1 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Answer card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8"
      >
        {/* Variable & state */}
        <div className="text-center mb-4">
          <div className="text-sm text-slate-400 mb-1">{concept.variable_ja}</div>
          <div className="text-lg font-medium">{concept.state}</div>
        </div>

        {/* Probability comparison */}
        <div className="space-y-3">
          {/* Disease A */}
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-sm w-24 text-right truncate">
              {card.disease_a_ja}
            </span>
            <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${concept.prob_a * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  concept.favors === 'a' ? 'bg-green-500' : 'bg-slate-500'
                }`}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {(concept.prob_a * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Disease B */}
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-sm w-24 text-right truncate">
              {card.disease_b_ja}
            </span>
            <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${concept.prob_b * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  concept.favors === 'b' ? 'bg-green-500' : 'bg-slate-500'
                }`}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {(concept.prob_b * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Delta indicator */}
        <div className="text-center mt-4">
          <span className="text-green-400 text-sm font-medium">
            {higherDisease}を示唆 (Δ={concept.delta.toFixed(2)})
          </span>
        </div>
      </motion.div>

      {/* Swipe buttons */}
      <div className="flex gap-6">
        <button
          onClick={() => onSwipe(concept.featureId, false)}
          className="bg-red-600/20 hover:bg-red-600/30 active:bg-red-600/40
                     border border-red-500/30 text-red-400
                     font-medium text-lg px-8 py-4 rounded-2xl transition-colors
                     touch-manipulation"
        >
          忘れた
        </button>
        <button
          onClick={() => onSwipe(concept.featureId, true)}
          className="bg-green-600/20 hover:bg-green-600/30 active:bg-green-600/40
                     border border-green-500/30 text-green-400
                     font-medium text-lg px-8 py-4 rounded-2xl transition-colors
                     touch-manipulation"
        >
          覚えた
        </button>
      </div>
    </div>
  )
}

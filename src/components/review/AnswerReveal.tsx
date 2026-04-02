import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { S3Card } from '../../lib/types'
import { addFeedback } from '../../lib/db'
import { supabase } from '../../lib/supabase'

interface Props {
  card: S3Card
  onSwipe: (featureId: string, recalled: boolean) => void
  onFlag: (featureId: string) => void
  index: number
  total: number
}

export function AnswerReveal({ card, onSwipe, onFlag, index, total }: Props) {
  const concept = card.concepts[0]
  const [flagged, setFlagged] = useState(false)
  const [showFlagConfirm, setShowFlagConfirm] = useState(false)

  if (!concept) return null

  const higherDisease = concept.favors === 'a' ? card.disease_a_ja : card.disease_b_ja

  const handleFlag = async () => {
    const feedback = {
      id: crypto.randomUUID(),
      feature_id: concept.featureId,
      disease_a: card.disease_a_ja,
      disease_b: card.disease_b_ja,
      variable_id: concept.variable_ja,
      state: concept.state,
      feedback_type: 'wrong_cpt' as const,
      description: `${concept.variable_ja}(${concept.state}): ${card.disease_a_ja} ${(concept.prob_a * 100).toFixed(0)}% vs ${card.disease_b_ja} ${(concept.prob_b * 100).toFixed(0)}% — 要確認`,
      status: 'pending' as const,
      created_at: new Date(),
      synced_at: undefined,
    }

    await addFeedback(feedback)

    try {
      await supabase.from('vesmed_feedback').insert({
        id: feedback.id,
        feature_id: feedback.feature_id,
        disease_a: feedback.disease_a,
        disease_b: feedback.disease_b,
        variable_id: feedback.variable_id,
        state: feedback.state,
        feedback_type: feedback.feedback_type,
        description: feedback.description,
        status: feedback.status,
      })
    } catch {
      // Offline — will sync later
    }

    setFlagged(true)
    setShowFlagConfirm(false)
    setTimeout(() => onFlag(concept.featureId), 600)
  }

  return (
    <div className="flex flex-col items-center justify-between h-full px-5 py-6">
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
      <div className="flex flex-col items-center w-full max-w-sm">
        {/* Disease pair header */}
        <div className="text-center mb-5">
          <span className="text-indigo-400 font-semibold text-base">
            {card.disease_a_ja}
          </span>
          <span className="text-slate-600 mx-3 text-sm">vs</span>
          <span className="text-amber-400 font-semibold text-base">
            {card.disease_b_ja}
          </span>
        </div>

        {/* Answer card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-slate-800/60 backdrop-blur border border-slate-700/50
                     rounded-2xl p-6 w-full shadow-lg shadow-black/20 relative"
        >
          {/* Flag button */}
          <button
            onClick={() => flagged ? null : setShowFlagConfirm(true)}
            className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center
                        rounded-lg text-xs font-bold transition-colors touch-manipulation
                        ${flagged
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-slate-700/60 hover:bg-orange-500/20 text-slate-500 hover:text-orange-400'
                        }`}
          >
            {flagged ? '!' : '?'}
          </button>

          {/* Variable & state */}
          <div className="text-center mb-5">
            <div className="text-xs tracking-wider text-slate-500 uppercase mb-1">
              {concept.variable_ja}
            </div>
            <div className="text-lg font-bold text-white">{concept.state}</div>
          </div>

          {/* Probability bars */}
          <div className="space-y-3">
            <ProbBar
              label={card.disease_a_ja}
              prob={concept.prob_a}
              color={concept.favors === 'a' ? 'green' : 'slate'}
              labelColor="text-indigo-400"
            />
            <ProbBar
              label={card.disease_b_ja}
              prob={concept.prob_b}
              color={concept.favors === 'b' ? 'green' : 'slate'}
              labelColor="text-amber-400"
            />
          </div>

          {/* Delta */}
          <div className="text-center mt-4 pt-3 border-t border-slate-700/50">
            <span className="text-emerald-400 text-xs font-medium">
              {higherDisease}を示唆
            </span>
            <span className="text-slate-500 text-xs ml-2">
              Δ = {concept.delta.toFixed(2)}
            </span>
          </div>
        </motion.div>

        {/* Flag confirmation */}
        <AnimatePresence>
          {showFlagConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-orange-950/80 border border-orange-800/40 rounded-xl p-3
                         w-full mt-3 text-center"
            >
              <div className="text-xs text-orange-300/80 mb-2">
                このCPTに問題あり？
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowFlagConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-400 text-xs
                             touch-manipulation"
                >
                  いいえ
                </button>
                <button
                  onClick={handleFlag}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-medium
                             touch-manipulation"
                >
                  報告する
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {flagged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-orange-400 text-xs mt-3"
          >
            VeSMedへ報告済み — スキップします
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      {!flagged && (
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => onSwipe(concept.featureId, false)}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25
                       border border-red-500/20 text-red-400
                       font-semibold text-base py-4 rounded-2xl touch-manipulation"
          >
            忘れた
          </button>
          <button
            onClick={() => onSwipe(concept.featureId, true)}
            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25
                       border border-emerald-500/20 text-emerald-400
                       font-semibold text-base py-4 rounded-2xl touch-manipulation"
          >
            覚えた
          </button>
        </div>
      )}
    </div>
  )
}

function ProbBar({ label, prob, color, labelColor }: {
  label: string
  prob: number
  color: 'green' | 'slate'
  labelColor: string
}) {
  const pct = prob * 100
  const bgClass = color === 'green' ? 'bg-emerald-500' : 'bg-slate-600'

  return (
    <div className="flex items-center gap-2.5">
      <span className={`${labelColor} text-xs w-20 text-right truncate font-medium`}>
        {label}
      </span>
      <div className="flex-1 h-7 bg-slate-900/60 rounded-lg overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-lg ${bgClass}`}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/90">
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

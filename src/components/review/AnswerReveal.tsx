import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { S3Card } from '../../lib/types'
import { addFeedback } from '../../lib/db'
import { supabase } from '../../lib/supabase'

interface Props {
  card: S3Card
  onSwipe: (featureId: string, recalled: boolean) => void
  index: number
  total: number
}

export function AnswerReveal({ card, onSwipe, index, total }: Props) {
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

    // Save to IndexedDB
    await addFeedback(feedback)

    // Also push to Supabase immediately
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
  }

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
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm mb-6 relative"
      >
        {/* Flag button — top right corner */}
        <button
          onClick={() => flagged ? null : setShowFlagConfirm(true)}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                      rounded-lg transition-colors touch-manipulation text-lg
                      ${flagged
                        ? 'bg-orange-600/30 text-orange-400 cursor-default'
                        : 'bg-slate-700 hover:bg-orange-600/20 text-slate-400 hover:text-orange-400'
                      }`}
          title="VeSMedにフィードバック"
        >
          {flagged ? '!' : '?'}
        </button>

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

      {/* Flag confirmation toast */}
      <AnimatePresence>
        {showFlagConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-orange-900/80 border border-orange-600/50 rounded-xl p-4
                       w-full max-w-sm mb-4 text-center"
          >
            <div className="text-sm text-orange-200 mb-3">
              このCPTに問題がありますか？
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowFlagConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm
                           touch-manipulation"
              >
                キャンセル
              </button>
              <button
                onClick={handleFlag}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium
                           touch-manipulation"
              >
                報告する
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flagged confirmation */}
      {flagged && (
        <div className="text-orange-400 text-sm mb-4">
          VeSMedへフィードバック済み
        </div>
      )}

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

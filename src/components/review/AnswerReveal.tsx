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

  if (!concept || !concept.dist_a || !concept.dist_b) return null

  const handleFlag = async () => {
    const feedback = {
      id: crypto.randomUUID(),
      feature_id: concept.featureId,
      disease_a: card.disease_a_ja,
      disease_b: card.disease_b_ja,
      variable_id: concept.variable_ja,
      feedback_type: 'wrong_cpt' as const,
      description: `${concept.variable_ja}: ${card.disease_a_ja} vs ${card.disease_b_ja} — 要確認`,
      status: 'pending' as const,
      created_at: new Date(),
      synced_at: undefined,
    }

    const isNew = await addFeedback(feedback)

    if (isNew) {
      try {
        await supabase.from('vesmed_feedback').insert({
          id: feedback.id,
          feature_id: feedback.feature_id,
          disease_a: feedback.disease_a,
          disease_b: feedback.disease_b,
          variable_id: feedback.variable_id,
          feedback_type: feedback.feedback_type,
          description: feedback.description,
          status: feedback.status,
        })
      } catch {
        // Offline — will sync later
      }
    }

    setFlagged(true)
    setShowFlagConfirm(false)
    setTimeout(() => onFlag(concept.featureId), 600)
  }

  // Collect all states, sorted by max probability
  const allStates = Array.from(
    new Set([...Object.keys(concept.dist_a), ...Object.keys(concept.dist_b)])
  ).sort((a, b) => {
    const maxA = Math.max(concept.dist_a[a] ?? 0, concept.dist_b[a] ?? 0)
    const maxB = Math.max(concept.dist_a[b] ?? 0, concept.dist_b[b] ?? 0)
    return maxB - maxA
  })

  const isBinary = allStates.length === 1 && allStates[0] === 'present'

  const insight = buildInsight(
    card.disease_a_ja, card.disease_b_ja,
    concept.dist_a, concept.dist_b, isBinary,
  )

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 py-4">
      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-slate-500 mb-1 px-0.5">
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-slate-800/60 backdrop-blur border border-slate-700/50
                   rounded-2xl p-4 w-full max-w-md shadow-lg shadow-black/20 relative"
      >
        {/* Flag button */}
        <button
          onClick={() => flagged ? null : setShowFlagConfirm(true)}
          className={`absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center
                      rounded-lg text-xs font-bold transition-colors touch-manipulation
                      ${flagged
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-slate-700/60 hover:bg-orange-500/20 text-slate-500 hover:text-orange-400'
                      }`}
        >
          {flagged ? '!' : '?'}
        </button>

        {/* Variable name — the main answer */}
        <div className="text-center mb-3">
          <div className="text-[10px] tracking-wider text-slate-500 uppercase mb-1">
            鑑別に有用な検査・所見
          </div>
          <div className="text-lg font-bold text-emerald-400">
            {concept.variable_ja}
          </div>
        </div>

        {/* Disease labels header */}
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-indigo-400 font-semibold text-[11px] truncate max-w-[40%]">
            {card.disease_a_ja}
          </span>
          <span className="text-amber-400 font-semibold text-[11px] truncate max-w-[40%] text-right">
            {card.disease_b_ja}
          </span>
        </div>

        {/* Distribution comparison — butterfly chart */}
        {isBinary ? (
          <BinaryCompare
            probA={concept.dist_a['present'] ?? 0}
            probB={concept.dist_b['present'] ?? 0}
          />
        ) : (
          <div className="space-y-1">
            {allStates.map(state => (
              <ButterflyRow
                key={state}
                state={state}
                probA={concept.dist_a[state] ?? 0}
                probB={concept.dist_b[state] ?? 0}
              />
            ))}
          </div>
        )}

        {/* Interpretive summary */}
        <div className="mt-3 pt-2 border-t border-slate-700/50 space-y-1">
          {insight.map((line, i) => (
            <div key={i} className="text-[11px] text-slate-300 leading-relaxed">
              {line}
            </div>
          ))}
          <div className="text-center pt-0.5">
            <span className="text-slate-600 text-[10px]">
              TVD = {concept.divergence.toFixed(2)}
            </span>
          </div>
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
                       w-full max-w-md mt-2 text-center"
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
          className="text-orange-400 text-xs mt-2"
        >
          VeSMedへ報告済み — スキップします
        </motion.div>
      )}

      {/* Action buttons */}
      {!flagged && (
        <div className="flex gap-4 w-full max-w-md">
          <button
            onClick={() => onSwipe(concept.featureId, false)}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25
                       border border-red-500/20 text-red-400
                       font-semibold text-sm py-3.5 rounded-2xl touch-manipulation"
          >
            忘れた
          </button>
          <button
            onClick={() => onSwipe(concept.featureId, true)}
            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25
                       border border-emerald-500/20 text-emerald-400
                       font-semibold text-sm py-3.5 rounded-2xl touch-manipulation"
          >
            覚えた
          </button>
        </div>
      )}
    </div>
  )
}

/** Binary variable: two large bars side by side */
function BinaryCompare({ probA, probB }: { probA: number; probB: number }) {
  const pctA = probA * 100
  const pctB = probB * 100
  return (
    <div className="flex gap-3 items-end justify-center py-2">
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-lg font-bold text-indigo-400">{pctA.toFixed(0)}%</span>
        <div className="w-full h-3 bg-slate-900/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pctA, 2)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 flex-1">
        <span className="text-lg font-bold text-amber-400">{pctB.toFixed(0)}%</span>
        <div className="w-full h-3 bg-slate-900/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pctB, 2)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-amber-500 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}

/** Butterfly chart row: state label on top, bars below */
function ButterflyRow({ state, probA, probB }: {
  state: string
  probA: number
  probB: number
}) {
  const pctA = probA * 100
  const pctB = probB * 100

  return (
    <div>
      {/* State label — full width, centered */}
      <div className="text-center">
        <span className="text-[10px] text-slate-500">{state}</span>
      </div>
      {/* Bars */}
      <div className="flex items-center gap-0 h-5">
        {/* Left: percentage + bar (disease A, right-aligned) */}
        <span className="text-[10px] text-indigo-300/80 font-mono w-8 text-right shrink-0">
          {pctA > 0 ? `${pctA.toFixed(0)}%` : ''}
        </span>
        <div className="flex-1 h-full bg-slate-900/30 rounded-l-sm overflow-hidden flex justify-end">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pctA, pctA > 0 ? 3 : 0)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-l-sm ${pctA >= 30 ? 'bg-indigo-500' : 'bg-indigo-500/40'}`}
          />
        </div>
        {/* Center divider */}
        <div className="w-px h-full bg-slate-600/60 shrink-0" />
        {/* Right: bar + percentage (disease B, left-aligned) */}
        <div className="flex-1 h-full bg-slate-900/30 rounded-r-sm overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pctB, pctB > 0 ? 3 : 0)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-r-sm ${pctB >= 30 ? 'bg-amber-500' : 'bg-amber-500/40'}`}
          />
        </div>
        <span className="text-[10px] text-amber-300/80 font-mono w-8 shrink-0">
          {pctB > 0 ? `${pctB.toFixed(0)}%` : ''}
        </span>
      </div>
    </div>
  )
}

function buildInsight(
  nameA: string, nameB: string,
  dist_a: Record<string, number>,
  dist_b: Record<string, number>,
  isBinary: boolean,
): string[] {
  if (isBinary) {
    const pa = (dist_a['present'] ?? 0) * 100
    const pb = (dist_b['present'] ?? 0) * 100
    const diff = Math.abs(pa - pb)
    const higher = pa > pb ? nameA : nameB
    const lower = pa > pb ? nameB : nameA
    if (diff > 40) {
      return [`${higher}で高頻度 (${Math.max(pa,pb).toFixed(0)}%)、${lower}では稀 (${Math.min(pa,pb).toFixed(0)}%)`]
    }
    return [`${nameA} ${pa.toFixed(0)}% / ${nameB} ${pb.toFixed(0)}%`]
  }

  const allStates = new Set([...Object.keys(dist_a), ...Object.keys(dist_b)])
  const charsA: [string, number][] = []
  const charsB: [string, number][] = []

  for (const s of allStates) {
    const pa = dist_a[s] ?? 0
    const pb = dist_b[s] ?? 0
    if (pa > pb + 0.05) charsA.push([s, pa])
    else if (pb > pa + 0.05) charsB.push([s, pb])
  }

  charsA.sort((a, b) => b[1] - a[1])
  charsB.sort((a, b) => b[1] - a[1])

  const lines: string[] = []
  const fmtStates = (chars: [string, number][]) =>
    chars.slice(0, 2).map(([s, p]) => `${s} (${(p * 100).toFixed(0)}%)`).join('、')

  if (charsA.length > 0) lines.push(`${nameA} → ${fmtStates(charsA)}`)
  if (charsB.length > 0) lines.push(`${nameB} → ${fmtStates(charsB)}`)
  if (lines.length === 0) lines.push('分布がほぼ同じ')

  return lines
}

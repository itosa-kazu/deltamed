import { motion } from 'framer-motion'
import type { S3Card, S3Concept } from '../../lib/types'
import { getStateLabel } from '../../lib/stateLabels'

interface Props {
  card: S3Card
  onSwipe: (featureId: string, recalled: boolean) => void
  onFlag: (featureId: string) => void
  index: number
  total: number
}

export function AnswerReveal({ card, onSwipe, index, total }: Props) {
  if (card.concepts.length === 0) return null

  return (
    <div className="flex flex-col h-full px-4 py-4">
      {/* Progress bar */}
      <div className="w-full shrink-0">
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

      {/* Disease pair header */}
      <div className="flex justify-between items-center mt-3 mb-2 px-1 shrink-0">
        <span className="text-indigo-400 font-semibold text-xs truncate max-w-[45%]">
          {card.disease_a_ja}
        </span>
        <span className="text-amber-400 font-semibold text-xs truncate max-w-[45%] text-right">
          {card.disease_b_ja}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-2"
           style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* All concepts */}
        {card.concepts.map((concept, i) => (
          <ConceptBlock key={concept.featureId} concept={concept} rank={i + 1}
                        diseaseA={card.disease_a_ja} diseaseB={card.disease_b_ja} />
        ))}

        {/* Trap knowledge */}
        {card.traps.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3">
            <div className="text-[10px] text-slate-600 mb-1.5">鑑別に有用でない所見:</div>
            <div className="flex flex-wrap gap-1">
              {card.traps.map((trap, i) => (
                <span key={i} className="text-[10px] bg-slate-700/40 text-slate-500
                                         px-1.5 py-0.5 rounded">
                  {trap.variable_ja}
                  <span className="text-slate-600 ml-0.5">({trap.divergence.toFixed(2)})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-md mx-auto shrink-0 pt-2">
        <button
          onClick={() => onSwipe(card.pair_id, false)}
          className="flex-1 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25
                     border border-red-500/20 text-red-400
                     font-semibold text-sm py-3.5 rounded-2xl touch-manipulation"
        >
          忘れた
        </button>
        <button
          onClick={() => onSwipe(card.pair_id, true)}
          className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25
                     border border-emerald-500/20 text-emerald-400
                     font-semibold text-sm py-3.5 rounded-2xl touch-manipulation"
        >
          覚えた
        </button>
      </div>
    </div>
  )
}

/** One concept block: variable name + compact butterfly chart + insight */
function ConceptBlock({ concept, rank, diseaseA, diseaseB }: {
  concept: S3Concept
  rank: number
  diseaseA: string
  diseaseB: string
}) {
  const allStates = Array.from(
    new Set([...Object.keys(concept.dist_a), ...Object.keys(concept.dist_b)])
  ).sort((a, b) => stateSeverity(b) - stateSeverity(a))

  const isBinary = allStates.length === 1 && allStates[0] === 'present'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.08 }}
      className="bg-slate-800/60 backdrop-blur border border-slate-700/50
                 rounded-xl p-3 w-full"
    >
      {/* Variable name + TVD */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-mono w-4">{rank}.</span>
          <span className="text-sm font-bold text-emerald-400">{concept.variable_ja}</span>
        </div>
        <span className="text-[10px] text-slate-600">TVD {concept.divergence.toFixed(2)}</span>
      </div>

      {/* Distribution */}
      {isBinary ? (
        <BinaryCompact
          probA={concept.dist_a['present'] ?? 0}
          probB={concept.dist_b['present'] ?? 0}
        />
      ) : (
        <div className="space-y-0.5">
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

      {/* Compact insight */}
      <div className="mt-1.5 text-[10px] text-slate-400 leading-relaxed">
        {buildCompactInsight(diseaseA, diseaseB, concept.dist_a, concept.dist_b, isBinary)}
      </div>
    </motion.div>
  )
}

function BinaryCompact({ probA, probB }: { probA: number; probB: number }) {
  const pctA = probA * 100
  const pctB = probB * 100
  return (
    <div className="flex gap-2 items-center py-1">
      <span className="text-xs font-bold text-indigo-400 w-10 text-right">{pctA.toFixed(0)}%</span>
      <div className="flex-1 h-2.5 bg-slate-900/60 rounded-full overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pctA, 2)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-indigo-500 rounded-l-full"
        />
        <div className="flex-1" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pctB, 2)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-amber-500 rounded-r-full"
        />
      </div>
      <span className="text-xs font-bold text-amber-400 w-10">{pctB.toFixed(0)}%</span>
    </div>
  )
}

function ButterflyRow({ state, probA, probB }: {
  state: string; probA: number; probB: number
}) {
  const pctA = probA * 100
  const pctB = probB * 100

  return (
    <div>
      <div className="text-center">
        <span className="text-[9px] text-slate-500">{getStateLabel(state)}</span>
      </div>
      <div className="flex items-center gap-0 h-4">
        <span className="text-[9px] text-indigo-300/80 font-mono w-7 text-right shrink-0">
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
        <div className="w-px h-full bg-slate-600/60 shrink-0" />
        <div className="flex-1 h-full bg-slate-900/30 rounded-r-sm overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pctB, pctB > 0 ? 3 : 0)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-r-sm ${pctB >= 30 ? 'bg-amber-500' : 'bg-amber-500/40'}`}
          />
        </div>
        <span className="text-[9px] text-amber-300/80 font-mono w-7 shrink-0">
          {pctB > 0 ? `${pctB.toFixed(0)}%` : ''}
        </span>
      </div>
    </div>
  )
}

function buildCompactInsight(
  nameA: string, nameB: string,
  dist_a: Record<string, number>,
  dist_b: Record<string, number>,
  isBinary: boolean,
): string {
  if (isBinary) {
    const pa = (dist_a['present'] ?? 0) * 100
    const pb = (dist_b['present'] ?? 0) * 100
    const higher = pa > pb ? nameA : nameB
    return `${higher}で高頻度 (${Math.max(pa, pb).toFixed(0)}% vs ${Math.min(pa, pb).toFixed(0)}%)`
  }

  const allStates = new Set([...Object.keys(dist_a), ...Object.keys(dist_b)])
  const charsA: string[] = []
  const charsB: string[] = []

  for (const s of allStates) {
    const pa = dist_a[s] ?? 0
    const pb = dist_b[s] ?? 0
    if (pa > pb + 0.1) charsA.push(getStateLabel(s))
    else if (pb > pa + 0.1) charsB.push(getStateLabel(s))
  }

  const parts: string[] = []
  if (charsA.length > 0) parts.push(`${nameA}→${charsA.slice(0, 2).join('/')}`)
  if (charsB.length > 0) parts.push(`${nameB}→${charsB.slice(0, 2).join('/')}`)
  return parts.join(' | ') || '分布がほぼ同じ'
}

function stateSeverity(s: string): number {
  if (/^extreme|^very_high|^markedly/.test(s)) return 90
  if (/^crisis/.test(s)) return 88
  if (/^overt_DIC/.test(s)) return 87
  if (/^very_prolonged/.test(s)) return 86
  if (/^severe/.test(s)) return 85
  if (/^very_low/.test(s)) return 84
  if (/^high(?!_over_0)/.test(s)) return 70
  if (/^elevated/.test(s)) return 68
  if (/^moderate/.test(s)) return 65
  if (/^pre_DIC/.test(s)) return 63
  if (/^mildly_prolonged/.test(s)) return 62
  if (/^mild/.test(s)) return 55
  if (/^low(?!_under_0)/.test(s)) return 50
  if (/^mildly_low/.test(s)) return 48
  if (/^normal/.test(s)) return 30
  if (s === 'absent' || s === 'negative' || s === 'no' || s === 'none') return 20
  if (/over_40/.test(s)) return 92
  if (/39.*40/.test(s)) return 80
  if (/38.*39/.test(s)) return 70
  if (/37.*38/.test(s)) return 60
  if (/under_37/.test(s)) return 40
  if (/hypothermia/.test(s)) return 35
  if (/over_120/.test(s)) return 85
  if (/100_120/.test(s)) return 70
  if (/under_100/.test(s)) return 40
  if (/severe_hypoxia/.test(s)) return 85
  if (/mild_hypoxia/.test(s)) return 65
  if (s === 'shock') return 95
  if (/hypotension/.test(s)) return 82
  return 40
}

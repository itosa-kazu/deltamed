import { db, getDueCards, getNewPairIds } from './db'
import { initializeCard } from './fsrs'
import type {
  S3Card,
  S3Concept,
  S3Trap,
  Disease,
  DifferentialFeature,
} from './types'

/** Daily new card limit */
const NEW_CARDS_PER_DAY = 10

/**
 * Build review queue: ALL due cards + daily new cards (Anki mode).
 * Each card = one disease pair with ALL differentiating variables.
 */
export async function buildReviewQueue(): Promise<S3Card[]> {
  // 1. Get ALL due cards (pair-level FSRS)
  const dueCards = await getDueCards(10000)

  // 2. Count how many new cards introduced today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayLogs = await db.reviewLogs
    .where('reviewed_at')
    .aboveOrEqual(todayStart)
    .toArray()
  const reviewedIds = new Set(todayLogs.map(l => l.feature_id))

  let todayNewCount = 0
  for (const id of reviewedIds) {
    const card = await db.fsrsCards.get(id)
    if (card && card.reps <= 1) todayNewCount++
  }
  const newSlots = Math.max(0, NEW_CARDS_PER_DAY - todayNewCount)

  // 3. Fill with new pair cards
  let newPairIds: string[] = []
  if (newSlots > 0) {
    newPairIds = await getNewPairIds(newSlots)
    for (const pid of newPairIds) {
      await initializeCard(pid)
    }
  }

  // 4. Collect all pair IDs to show
  const allPairIds = [
    ...dueCards.map(c => c.id),
    ...newPairIds,
  ]

  if (allPairIds.length === 0) return []

  // 5. Fetch data and build S3Cards
  const diseaseMap = new Map<string, Disease>()
  const allDiseases = await db.diseases.toArray()
  allDiseases.forEach(d => diseaseMap.set(d.id, d))

  const variableMap = new Map<string, string>()
  const allVars = await db.variables.toArray()
  allVars.forEach(v => variableMap.set(v.id, v.name_ja))

  // Group features by pair
  const allFeatures = await db.features.toArray()
  const featuresByPair = new Map<string, DifferentialFeature[]>()
  for (const f of allFeatures) {
    const existing = featuresByPair.get(f.pair_id) || []
    existing.push(f)
    featuresByPair.set(f.pair_id, existing)
  }

  const cards: S3Card[] = []
  for (const pairId of allPairIds) {
    const pair = await db.pairs.get(pairId)
    if (!pair) continue

    const da = diseaseMap.get(pair.disease_a)
    const db_disease = diseaseMap.get(pair.disease_b)
    if (!da || !db_disease) continue

    const pairFeatures = featuresByPair.get(pairId) || []

    // Useful concepts (max|logLR| >= 0.7), sorted descending
    const useful = pairFeatures
      .filter(f => f.divergence >= 0.7)
      .sort((a, b) => b.divergence - a.divergence)

    if (useful.length === 0) continue

    const concepts: S3Concept[] = useful.map(f => {
      // Find the state with max |log(LR)|
      const allStates = new Set([...Object.keys(f.dist_a), ...Object.keys(f.dist_b)])
      let bestState = ''
      let bestLogLR = 0
      let bestFavors: 'a' | 'b' = 'a'
      for (const s of allStates) {
        const pa = f.dist_a[s] ?? 0
        const pb = f.dist_b[s] ?? 0
        if (pa > 0.001 && pb > 0.001) {
          const logLR = Math.log(pa / pb)
          if (Math.abs(logLR) > Math.abs(bestLogLR)) {
            bestLogLR = logLR
            bestState = s
            bestFavors = logLR > 0 ? 'a' : 'b'
          }
        } else if (pa > 0.05 && pb <= 0.001) {
          if (4.0 > Math.abs(bestLogLR)) {
            bestLogLR = 4.0
            bestState = s
            bestFavors = 'a'
          }
        } else if (pb > 0.05 && pa <= 0.001) {
          if (4.0 > Math.abs(bestLogLR)) {
            bestLogLR = -4.0
            bestState = s
            bestFavors = 'b'
          }
        }
      }
      return {
        featureId: f.id,
        variable_ja: variableMap.get(f.variable_id) || f.variable_id,
        dist_a: f.dist_a,
        dist_b: f.dist_b,
        divergence: f.divergence,
        bestState,
        bestFavors,
        bestLR: Math.exp(Math.abs(bestLogLR)),
      }
    })

    // Trap info (max|logLR| < 0.4 = LR < 1.5), top 3
    const traps: S3Trap[] = pairFeatures
      .filter(f => f.divergence < 0.4)
      .sort((a, b) => a.divergence - b.divergence)
      .slice(0, 3)
      .map(f => ({
        variable_ja: variableMap.get(f.variable_id) || f.variable_id,
        divergence: f.divergence,
      }))

    cards.push({
      level: 1,
      question: `${da.name_ja} vs ${db_disease.name_ja}`,
      pair_id: pairId,
      disease_a_ja: da.name_ja,
      disease_b_ja: db_disease.name_ja,
      concepts,
      traps,
    })
  }

  return cards
}

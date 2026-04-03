import { db, getDueCards, getNewFeatureIds } from './db'
import { initializeCard } from './fsrs'
import type {
  S3Card,
  S3Concept,
  Disease,
  DifferentialFeature,
  ConfusablePair,
} from './types'

/** Daily new card limit */
const NEW_CARDS_PER_DAY = 15

/**
 * Build review queue: ALL due cards + daily new cards (Anki mode).
 * Level 1 only for now (single pair, single variable).
 */
export async function buildReviewQueue(): Promise<S3Card[]> {
  // 1. Get ALL due cards (no limit — must finish all reviews)
  const dueCards = await getDueCards(10000)

  // 2. Count how many new cards introduced today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayLogs = await db.reviewLogs
    .where('reviewed_at')
    .aboveOrEqual(todayStart)
    .toArray()
  const reviewedFeatureIds = new Set(todayLogs.map(l => l.feature_id))

  // Count new cards already introduced today (first review ever = reps was 0)
  const todayNewCount = await countTodayNewCards(reviewedFeatureIds)
  const newSlots = Math.max(0, NEW_CARDS_PER_DAY - todayNewCount)

  // 3. Fill with new cards
  let newFeatureIds: string[] = []
  if (newSlots > 0) {
    newFeatureIds = await getNewFeatureIds(newSlots)
    for (const fid of newFeatureIds) {
      await initializeCard(fid)
    }
  }

  // 4. Collect all feature IDs
  const allFeatureIds = [
    ...dueCards.map(c => c.id),
    ...newFeatureIds,
  ]

  if (allFeatureIds.length === 0) return []

  // 4. Fetch feature data and build S3Cards
  const diseaseMap = new Map<string, Disease>()
  const allDiseases = await db.diseases.toArray()
  allDiseases.forEach(d => diseaseMap.set(d.id, d))

  const variableMap = new Map<string, string>()
  const allVars = await db.variables.toArray()
  allVars.forEach(v => variableMap.set(v.id, v.name_ja))

  // Pre-fetch trap features per pair (low TVD)
  const allFeatures = await db.features.toArray()
  const trapsByPair = new Map<string, { variable_ja: string; divergence: number }[]>()
  for (const f of allFeatures) {
    if (f.divergence < 0.15) {
      const existing = trapsByPair.get(f.pair_id) || []
      existing.push({
        variable_ja: variableMap.get(f.variable_id) || f.variable_id,
        divergence: f.divergence,
      })
      trapsByPair.set(f.pair_id, existing)
    }
  }
  // Sort traps by lowest TVD first, keep top 3 per pair
  for (const [pid, traps] of trapsByPair) {
    traps.sort((a, b) => a.divergence - b.divergence)
    trapsByPair.set(pid, traps.slice(0, 3))
  }

  const cards: S3Card[] = []
  for (const featureId of allFeatureIds) {
    const feature = await db.features.get(featureId)
    if (!feature || feature.divergence < 0.2) continue // only useful features as main cards

    const pair = await db.pairs.get(feature.pair_id)
    if (!pair) continue

    const pairTraps = trapsByPair.get(pair.id) || []
    const card = buildLevel1Card(feature, pair, diseaseMap, variableMap, pairTraps)
    if (card) cards.push(card)
  }

  return cards
}

/**
 * Count how many genuinely new cards were introduced today.
 * A "new card" = feature whose FSRS card has reps <= 1 and was reviewed today.
 */
async function countTodayNewCards(reviewedFeatureIds: Set<string>): Promise<number> {
  let count = 0
  for (const fid of reviewedFeatureIds) {
    const card = await db.fsrsCards.get(fid)
    if (card && card.reps <= 1) count++
  }
  return count
}

function buildLevel1Card(
  feature: DifferentialFeature,
  pair: ConfusablePair,
  diseaseMap: Map<string, Disease>,
  variableMap: Map<string, string>,
  traps: { variable_ja: string; divergence: number }[],
): S3Card | null {
  const da = diseaseMap.get(pair.disease_a)
  const db_disease = diseaseMap.get(pair.disease_b)
  if (!da || !db_disease) return null

  const varName = variableMap.get(feature.variable_id) || feature.variable_id

  const concept: S3Concept = {
    featureId: feature.id,
    variable_ja: varName,
    dist_a: feature.dist_a,
    dist_b: feature.dist_b,
    divergence: feature.divergence,
  }

  return {
    level: 1,
    question: `${da.name_ja} vs ${db_disease.name_ja}`,
    pair_id: pair.id,
    disease_a_ja: da.name_ja,
    disease_b_ja: db_disease.name_ja,
    concepts: [concept],
    traps,
  }
}

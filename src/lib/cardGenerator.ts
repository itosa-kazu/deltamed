import { db, getDueCards, getNewFeatureIds } from './db'
import { initializeCard } from './fsrs'
import type {
  S3Card,
  S3Concept,
  Disease,
  DifferentialFeature,
  ConfusablePair,
} from './types'

/**
 * Build review queue: due cards + new cards, returned as S3Card objects.
 * Level 1 only for now (single pair, single feature).
 */
export async function buildReviewQueue(maxCards = 20, newCardLimit = 5): Promise<S3Card[]> {
  // 1. Get due cards (reviews)
  const dueCards = await getDueCards(maxCards)

  // 2. Fill remaining slots with new cards
  const remaining = maxCards - dueCards.length
  const newSlots = Math.min(remaining, newCardLimit)
  let newFeatureIds: string[] = []
  if (newSlots > 0) {
    newFeatureIds = await getNewFeatureIds(newSlots)
    // Initialize FSRS cards for new features
    for (const fid of newFeatureIds) {
      await initializeCard(fid)
    }
  }

  // 3. Collect all feature IDs
  const allFeatureIds = [
    ...dueCards.map(c => c.id),
    ...newFeatureIds,
  ]

  if (allFeatureIds.length === 0) return []

  // 4. Fetch feature data and build S3Cards
  const diseaseMap = new Map<string, Disease>()
  const allDiseases = await db.diseases.toArray()
  allDiseases.forEach(d => diseaseMap.set(d.id, d))

  const variableMap = new Map<string, string>() // id -> name_ja
  const allVars = await db.variables.toArray()
  allVars.forEach(v => variableMap.set(v.id, v.name_ja))

  const cards: S3Card[] = []
  for (const featureId of allFeatureIds) {
    const feature = await db.features.get(featureId)
    if (!feature) continue

    const pair = await db.pairs.get(feature.pair_id)
    if (!pair) continue

    const card = buildLevel1Card(feature, pair, diseaseMap, variableMap)
    if (card) cards.push(card)
  }

  return cards
}

function buildLevel1Card(
  feature: DifferentialFeature,
  pair: ConfusablePair,
  diseaseMap: Map<string, Disease>,
  variableMap: Map<string, string>,
): S3Card | null {
  const da = diseaseMap.get(pair.disease_a)
  const db_disease = diseaseMap.get(pair.disease_b)
  if (!da || !db_disease) return null

  const varName = variableMap.get(feature.variable_id) || feature.variable_id

  const concept: S3Concept = {
    featureId: feature.id,
    answer: feature.display_text,
    variable_ja: varName,
    state: feature.state,
    prob_a: feature.prob_a,
    prob_b: feature.prob_b,
    delta: feature.delta,
    favors: feature.favors,
  }

  return {
    level: 1,
    question: `${da.name_ja} vs ${db_disease.name_ja}\n${varName}(${feature.state})は？`,
    pair_id: pair.id,
    disease_a_ja: da.name_ja,
    disease_b_ja: db_disease.name_ja,
    concepts: [concept],
  }
}

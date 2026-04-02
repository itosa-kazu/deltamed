import Dexie, { type Table } from 'dexie'
import type {
  Disease,
  Variable,
  ConfusablePair,
  DifferentialFeature,
  FSRSCardRecord,
  ReviewLogRecord,
} from './types'

class DmedDatabase extends Dexie {
  diseases!: Table<Disease>
  variables!: Table<Variable>
  pairs!: Table<ConfusablePair>
  features!: Table<DifferentialFeature>
  fsrsCards!: Table<FSRSCardRecord>
  reviewLogs!: Table<ReviewLogRecord>

  constructor() {
    super('dmed-s3')
    this.version(1).stores({
      diseases: 'id',
      variables: 'id, category',
      pairs: 'id, disease_a, disease_b, priority_layer',
      features: 'id, pair_id, variable_id, delta',
      fsrsCards: 'id, due, state',
      reviewLogs: 'id, feature_id, reviewed_at',
    })
  }
}

export const db = new DmedDatabase()

// ─── Content queries ──────────────────────────────────────

export async function getDisease(id: string): Promise<Disease | undefined> {
  return db.diseases.get(id)
}

export async function getDiseaseMap(): Promise<Map<string, Disease>> {
  const all = await db.diseases.toArray()
  return new Map(all.map(d => [d.id, d]))
}

export async function getFeaturesForPair(pairId: string): Promise<DifferentialFeature[]> {
  return db.features.where('pair_id').equals(pairId).sortBy('delta')
    .then(arr => arr.reverse()) // highest delta first
}

export async function getLayer1Pairs(): Promise<ConfusablePair[]> {
  return db.pairs.where('priority_layer').equals(1).toArray()
}

// ─── FSRS queries ─────────────────────────────────────────

export async function getDueCards(limit = 20): Promise<FSRSCardRecord[]> {
  const now = new Date()
  return db.fsrsCards
    .where('due')
    .belowOrEqual(now)
    .limit(limit)
    .sortBy('due')
}

export async function getNewFeatureIds(limit = 10): Promise<string[]> {
  // Features that have no FSRS card yet (never reviewed)
  const existingIds = new Set(
    (await db.fsrsCards.toCollection().primaryKeys()) as string[]
  )
  // Get Layer 1 pairs first, then their features sorted by delta
  const layer1Pairs = await getLayer1Pairs()
  const pairIds = new Set(layer1Pairs.map(p => p.id))

  const allFeatures = await db.features
    .orderBy('delta')
    .reverse()
    .toArray()

  // Prioritize features from Layer 1 pairs
  const layer1Features = allFeatures.filter(f => pairIds.has(f.pair_id) && !existingIds.has(f.id))
  const otherFeatures = allFeatures.filter(f => !pairIds.has(f.pair_id) && !existingIds.has(f.id))

  const combined = [...layer1Features, ...otherFeatures]
  return combined.slice(0, limit).map(f => f.id)
}

// ─── Content loading ──────────────────────────────────────

export async function isContentLoaded(): Promise<boolean> {
  const count = await db.diseases.count()
  return count > 0
}

export async function loadContentFromJSON(data: {
  diseases: Disease[]
  variables: Variable[]
  pairs: ConfusablePair[]
  features: DifferentialFeature[]
}): Promise<void> {
  await db.transaction('rw', [db.diseases, db.variables, db.pairs, db.features], async () => {
    await db.diseases.clear()
    await db.variables.clear()
    await db.pairs.clear()
    await db.features.clear()

    await db.diseases.bulkAdd(data.diseases)
    await db.variables.bulkAdd(data.variables)
    await db.pairs.bulkAdd(data.pairs)
    await db.features.bulkAdd(data.features)
  })
}

export async function getContentStats() {
  const [diseases, variables, pairs, features, cards, reviews] = await Promise.all([
    db.diseases.count(),
    db.variables.count(),
    db.pairs.count(),
    db.features.count(),
    db.fsrsCards.count(),
    db.reviewLogs.count(),
  ])
  const layer1 = await db.pairs.where('priority_layer').equals(1).count()
  const dueNow = await getDueCards(1000)

  return { diseases, variables, pairs, features, layer1, cards, reviews, dueNow: dueNow.length }
}

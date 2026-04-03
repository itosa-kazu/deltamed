import Dexie, { type Table } from 'dexie'
import type {
  Disease,
  Variable,
  ConfusablePair,
  DifferentialFeature,
  FSRSCardRecord,
  ReviewLogRecord,
  VeSMedFeedback,
} from './types'

class DmedDatabase extends Dexie {
  diseases!: Table<Disease>
  variables!: Table<Variable>
  pairs!: Table<ConfusablePair>
  features!: Table<DifferentialFeature>
  fsrsCards!: Table<FSRSCardRecord>
  reviewLogs!: Table<ReviewLogRecord>
  feedbacks!: Table<VeSMedFeedback>

  constructor() {
    super('dmed-s3')
    this.version(2).stores({
      diseases: 'id',
      variables: 'id, category',
      pairs: 'id, disease_a, disease_b, priority_layer',
      features: 'id, pair_id, variable_id, divergence',
      fsrsCards: 'id, due, state',
      reviewLogs: 'id, feature_id, reviewed_at',
      feedbacks: 'id, feature_id, status, synced_at',
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

/**
 * Get pair IDs that have no FSRS card yet, prioritizing Layer 1.
 * Sorted by max TVD of their features (pairs with strongest differentiators first).
 */
export async function getNewPairIds(limit = 10): Promise<string[]> {
  const existingIds = new Set(
    (await db.fsrsCards.toCollection().primaryKeys()) as string[]
  )
  const layer1Pairs = await getLayer1Pairs()

  // Filter to pairs not yet in FSRS
  const available = layer1Pairs.filter(p => !existingIds.has(p.id))

  // Sort by max feature divergence (pairs with strongest differentiators first)
  const allFeatures = await db.features.toArray()
  const maxTvdByPair = new Map<string, number>()
  for (const f of allFeatures) {
    const current = maxTvdByPair.get(f.pair_id) || 0
    if (f.divergence > current) maxTvdByPair.set(f.pair_id, f.divergence)
  }

  available.sort((a, b) => (maxTvdByPair.get(b.id) || 0) - (maxTvdByPair.get(a.id) || 0))

  return available.slice(0, limit).map(p => p.id)
}

// ─── Content loading ──────────────────────────────────────

/** Bump this when Supabase data changes to force re-download */
const DATA_VERSION = 4  // v4: TVD→max|logLR|, threshold 0.7/0.4

export async function isContentLoaded(): Promise<boolean> {
  const count = await db.diseases.count()
  if (count === 0) return false
  // Check if features have new per-variable format (dist_a field)
  const sample = await db.features.limit(1).first()
  if (sample && !sample.dist_a) return false
  // Check data version
  const storedVersion = parseInt(localStorage.getItem('dmed_data_version') || '0')
  if (storedVersion < DATA_VERSION) return false
  return true
}

export async function loadContentFromJSON(data: {
  diseases: Disease[]
  variables: Variable[]
  pairs: ConfusablePair[]
  features: DifferentialFeature[]
}): Promise<void> {
  await db.transaction('rw', [db.diseases, db.variables, db.pairs, db.features, db.fsrsCards, db.reviewLogs], async () => {
    await db.diseases.clear()
    await db.variables.clear()
    await db.pairs.clear()
    await db.features.clear()
    // Clear FSRS state — feature IDs change on re-import
    await db.fsrsCards.clear()
    await db.reviewLogs.clear()

    await db.diseases.bulkAdd(data.diseases)
    await db.variables.bulkAdd(data.variables)
    await db.pairs.bulkAdd(data.pairs)
    await db.features.bulkAdd(data.features)
  })
  localStorage.setItem('dmed_data_version', String(DATA_VERSION))
}

// ─── Feedback ─────────────────────────────────────────────

export async function addFeedback(feedback: VeSMedFeedback): Promise<boolean> {
  const existing = await db.feedbacks.where('feature_id').equals(feedback.feature_id).first()
  if (existing) return false // already reported
  await db.feedbacks.put(feedback)
  return true
}

export async function getPendingFeedbacks(): Promise<VeSMedFeedback[]> {
  return db.feedbacks.where('status').equals('pending').toArray()
}

// ─── Stats ────────────────────────────────────────────────

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

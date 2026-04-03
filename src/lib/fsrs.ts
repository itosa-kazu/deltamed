import { FSRS, Rating, createEmptyCard, type Card, type Grade } from 'ts-fsrs'
import { db } from './db'
import type { FSRSCardRecord } from './types'

const fsrs = new FSRS({})

export { Rating }

export function createNewFSRSCard(): Card {
  return createEmptyCard()
}

function cardToRecord(featureId: string, card: Card): FSRSCardRecord {
  return {
    id: featureId,
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ?? undefined,
    updated_at: new Date(),
    synced_at: undefined, // needs sync
  }
}

function recordToCard(record: FSRSCardRecord): Card {
  return {
    due: new Date(record.due),
    stability: record.stability,
    difficulty: record.difficulty,
    elapsed_days: record.elapsed_days,
    scheduled_days: record.scheduled_days,
    reps: record.reps,
    lapses: record.lapses,
    state: record.state,
    last_review: record.last_review ? new Date(record.last_review) : undefined,
  } as Card
}

/**
 * Compute FSRS rating from recall ratio (0.0 ~ 1.0).
 *   0-20%  → Again
 *  20-60%  → Hard
 *  60-90%  → Good
 *  90-100% → Easy
 */
export function ratioToRating(ratio: number): Grade {
  if (ratio < 0.2) return Rating.Again
  if (ratio < 0.6) return Rating.Hard
  if (ratio < 0.9) return Rating.Good
  return Rating.Easy
}

/**
 * Review a card with a given FSRS rating.
 */
export async function reviewFeature(
  featureId: string,
  recalled: boolean,
): Promise<FSRSCardRecord> {
  const rating = recalled ? Rating.Good : Rating.Again
  const now = new Date()

  // Get or create card
  let existing = await db.fsrsCards.get(featureId)
  let card: Card

  if (existing) {
    card = recordToCard(existing)
  } else {
    card = createNewFSRSCard()
  }

  // Run FSRS scheduling
  const result = fsrs.repeat(card, now)
  const scheduled = result[rating]

  // Save updated card
  const newRecord = cardToRecord(featureId, scheduled.card)
  await db.fsrsCards.put(newRecord)

  // Save review log
  await db.reviewLogs.add({
    id: crypto.randomUUID(),
    feature_id: featureId,
    rating,
    reviewed_at: now,
    synced_at: undefined,
  })

  return newRecord
}

/**
 * Review a pair card with recall ratio (0.0 ~ 1.0).
 */
export async function reviewPairByRatio(
  pairId: string,
  ratio: number,
): Promise<FSRSCardRecord> {
  const rating = ratioToRating(ratio)
  const now = new Date()

  let existing = await db.fsrsCards.get(pairId)
  const card = existing ? recordToCard(existing) : createNewFSRSCard()

  const result = fsrs.repeat(card, now)
  const scheduled = result[rating]

  const newRecord = cardToRecord(pairId, scheduled.card)
  await db.fsrsCards.put(newRecord)

  await db.reviewLogs.add({
    id: crypto.randomUUID(),
    feature_id: pairId,
    rating,
    reviewed_at: now,
    synced_at: undefined,
  })

  return newRecord
}

/**
 * Initialize a new FSRS card for a feature that hasn't been reviewed yet.
 */
export async function initializeCard(featureId: string): Promise<FSRSCardRecord> {
  const existing = await db.fsrsCards.get(featureId)
  if (existing) return existing

  const card = createNewFSRSCard()
  const record = cardToRecord(featureId, card)
  await db.fsrsCards.put(record)
  return record
}

/**
 * Get review statistics for today.
 */
export async function getTodayStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const logs = await db.reviewLogs
    .where('reviewed_at')
    .aboveOrEqual(today)
    .toArray()

  const total = logs.length
  const recalled = logs.filter(l => l.rating === Rating.Good).length
  const forgotten = logs.filter(l => l.rating === Rating.Again).length

  return { total, recalled, forgotten }
}

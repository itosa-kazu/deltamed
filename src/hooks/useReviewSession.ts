import { useState, useCallback, useEffect } from 'react'
import { buildReviewQueue } from '../lib/cardGenerator'
import { reviewFeature } from '../lib/fsrs'
import { db } from '../lib/db'
import type { S3Card, SessionPhase, SessionStats } from '../lib/types'

export function useReviewSession() {
  const [cards, setCards] = useState<S3Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [stats, setStats] = useState<SessionStats>({ total: 0, recalled: 0, forgotten: 0 })

  const currentCard = cards[currentIndex] ?? null

  // Load review queue
  const loadQueue = useCallback(async () => {
    setPhase('loading')
    const queue = await buildReviewQueue()
    setCards(queue)
    setCurrentIndex(0)
    setStats({ total: 0, recalled: 0, forgotten: 0 })
    setPhase(queue.length === 0 ? 'empty' : 'question')
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  // User taps "Ready" — show answer
  const onReady = useCallback(() => {
    setPhase('revealing')
  }, [])

  // Advance to next card
  const advanceCard = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= cards.length) {
      setPhase('summary')
    } else {
      setCurrentIndex(nextIndex)
      setPhase('question')
    }
  }, [currentIndex, cards.length])

  // User rates the pair (recalled/not) — FSRS keyed by pair_id
  const onSwipe = useCallback(async (_featureId: string, recalled: boolean) => {
    if (!currentCard) return
    await reviewFeature(currentCard.pair_id, recalled)

    setStats(prev => ({
      total: prev.total + 1,
      recalled: prev.recalled + (recalled ? 1 : 0),
      forgotten: prev.forgotten + (recalled ? 0 : 1),
    }))

    advanceCard()
  }, [advanceCard])

  // User flagged a card — skip FSRS, delete card from schedule, advance
  const onFlag = useCallback(async (featureId: string) => {
    await db.fsrsCards.delete(featureId)
    advanceCard()
  }, [advanceCard])

  // Restart session
  const restart = useCallback(() => {
    loadQueue()
  }, [loadQueue])

  return {
    phase,
    currentCard,
    currentIndex,
    totalCards: cards.length,
    stats,
    onReady,
    onSwipe,
    onFlag,
    restart,
  }
}

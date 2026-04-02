import { useState, useCallback, useEffect } from 'react'
import { buildReviewQueue } from '../lib/cardGenerator'
import { reviewFeature } from '../lib/fsrs'
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
    const queue = await buildReviewQueue(20, 5)
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

  // User swipes a concept (recalled/not)
  const onSwipe = useCallback(async (featureId: string, recalled: boolean) => {
    await reviewFeature(featureId, recalled)

    setStats(prev => ({
      total: prev.total + 1,
      recalled: prev.recalled + (recalled ? 1 : 0),
      forgotten: prev.forgotten + (recalled ? 0 : 1),
    }))

    // Check if all concepts in current card are done
    // For Level 1, there's always 1 concept, so move to next card
    const nextIndex = currentIndex + 1
    if (nextIndex >= cards.length) {
      setPhase('summary')
    } else {
      setCurrentIndex(nextIndex)
      setPhase('question')
    }
  }, [currentIndex, cards.length])

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
    restart,
  }
}

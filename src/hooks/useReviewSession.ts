import { useState, useCallback, useEffect } from 'react'
import { buildReviewQueue } from '../lib/cardGenerator'
import { reviewPairByRatio } from '../lib/fsrs'
import type { S3Card, SessionPhase, SessionStats } from '../lib/types'

export function useReviewSession() {
  const [cards, setCards] = useState<S3Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [stats, setStats] = useState<SessionStats>({ total: 0, recalled: 0, forgotten: 0 })

  const currentCard = cards[currentIndex] ?? null

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

  const onReady = useCallback(() => {
    setPhase('revealing')
  }, [])

  const advanceCard = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= cards.length) {
      setPhase('summary')
    } else {
      setCurrentIndex(nextIndex)
      setPhase('question')
    }
  }, [currentIndex, cards.length])

  // User completes a card with recall ratio
  const onComplete = useCallback(async (pairId: string, ratio: number) => {
    await reviewPairByRatio(pairId, ratio)

    setStats(prev => ({
      total: prev.total + 1,
      recalled: prev.recalled + (ratio >= 0.6 ? 1 : 0),
      forgotten: prev.forgotten + (ratio < 0.6 ? 1 : 0),
    }))

    advanceCard()
  }, [advanceCard])

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
    onComplete,
    restart,
  }
}

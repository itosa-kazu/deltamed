import { useReviewSession } from '../../hooks/useReviewSession'
import { QuestionCard } from './QuestionCard'
import { AnswerReveal } from './AnswerReveal'
import { SessionSummary } from './SessionSummary'

export function ReviewSession() {
  const {
    phase,
    currentCard,
    currentIndex,
    totalCards,
    stats,
    onReady,
    onSwipe,
    onFlag,
    restart,
  } = useReviewSession()

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-lg">読み込み中...</div>
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="text-6xl mb-4">&#10003;</div>
        <div className="text-xl font-bold mb-2">復習完了</div>
        <div className="text-slate-400 text-center">
          今日のカードはすべて復習済みです。
          <br />
          新しいカードを追加するか、後でまた来てください。
        </div>
        <button
          onClick={restart}
          className="mt-8 bg-slate-700 hover:bg-slate-600 text-white
                     font-medium px-8 py-3 rounded-xl transition-colors
                     touch-manipulation"
        >
          再確認
        </button>
      </div>
    )
  }

  if (phase === 'summary') {
    return <SessionSummary stats={stats} onRestart={restart} />
  }

  if (!currentCard) return null

  if (phase === 'question') {
    return (
      <QuestionCard
        card={currentCard}
        onReady={onReady}
        index={currentIndex}
        total={totalCards}
      />
    )
  }

  // phase === 'revealing'
  return (
    <AnswerReveal
      card={currentCard}
      onSwipe={onSwipe}
      onFlag={onFlag}
      index={currentIndex}
      total={totalCards}
    />
  )
}

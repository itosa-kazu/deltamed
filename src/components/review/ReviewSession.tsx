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
    userJudgedUseful,
    onJudge,
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
        <div className="text-xl font-bold mb-2">今日の復習完了</div>
        <div className="text-slate-400 text-center">
          すべてのカードを復習しました。
          <br />
          明日また来てください。
        </div>
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
        onJudge={onJudge}
        index={currentIndex}
        total={totalCards}
      />
    )
  }

  // phase === 'revealing'
  return (
    <AnswerReveal
      card={currentCard}
      userJudgedUseful={userJudgedUseful}
      onSwipe={onSwipe}
      onFlag={onFlag}
      index={currentIndex}
      total={totalCards}
    />
  )
}

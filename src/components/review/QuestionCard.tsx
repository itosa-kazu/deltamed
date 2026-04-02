import type { S3Card } from '../../lib/types'

interface Props {
  card: S3Card
  onReady: () => void
  index: number
  total: number
}

export function QuestionCard({ card, onReady, index, total }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Progress */}
      <div className="absolute top-4 left-0 right-0 px-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{index + 1} / {total}</span>
          <span>Level {card.level}</span>
        </div>
        <div className="w-full h-1 bg-slate-700 rounded-full">
          <div
            className="h-1 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Disease pair header */}
      <div className="text-center mb-8">
        <div className="text-lg font-bold text-blue-400 mb-1">
          {card.disease_a_ja}
        </div>
        <div className="text-slate-400 text-sm mb-1">vs</div>
        <div className="text-lg font-bold text-amber-400">
          {card.disease_b_ja}
        </div>
      </div>

      {/* Question */}
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm text-center mb-8">
        <div className="text-sm text-slate-400 mb-2">鑑別ポイント</div>
        <div className="text-xl font-medium">
          {card.concepts[0]?.variable_ja}
        </div>
        <div className="text-slate-300 mt-2 text-base">
          ({card.concepts[0]?.state})
        </div>
      </div>

      {/* Ready button */}
      <button
        onClick={onReady}
        className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white
                   font-medium text-lg px-12 py-4 rounded-2xl transition-colors
                   touch-manipulation"
      >
        答えを見る
      </button>
    </div>
  )
}

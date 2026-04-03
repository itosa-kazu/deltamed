import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContentStats } from '../../lib/db'
import { getTodayStats } from '../../lib/fsrs'

interface Stats {
  diseases: number
  variables: number
  pairs: number
  features: number
  layer1: number
  cards: number
  reviews: number
  dueNow: number
}

interface TodayStats {
  total: number
  recalled: number
  forgotten: number
}

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [today, setToday] = useState<TodayStats | null>(null)

  useEffect(() => {
    getContentStats().then(setStats)
    getTodayStats().then(setToday)
  }, [])

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">統計</h1>

      {/* Today's review */}
      {today && today.total > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <h2 className="text-sm text-slate-400 mb-3">今日の復習</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{today.total}</div>
              <div className="text-xs text-slate-400">合計</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{today.recalled}</div>
              <div className="text-xs text-slate-400">覚えた</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{today.forgotten}</div>
              <div className="text-xs text-slate-400">忘れた</div>
            </div>
          </div>
        </div>
      )}

      {/* Queue status */}
      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <h2 className="text-sm text-slate-400 mb-3">復習キュー</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold text-amber-400">{stats.dueNow}</div>
            <div className="text-xs text-slate-400">要復習</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">{stats.cards}</div>
            <div className="text-xs text-slate-400">学習済み</div>
          </div>
        </div>
      </div>

      {/* Content stats */}
      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <h2 className="text-sm text-slate-400 mb-3">コンテンツ</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">疾患</span>
            <span>{stats.diseases}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">変量</span>
            <span>{stats.variables}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">混淆対</span>
            <span>{stats.pairs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">鑑別特徴</span>
            <span>{stats.features}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Layer 1</span>
            <span className="text-amber-400">{stats.layer1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">復習記録</span>
            <span>{stats.reviews}</span>
          </div>
        </div>
      </div>

      {/* Audit link */}
      <button
        onClick={() => navigate('/audit')}
        className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl p-4
                   text-left transition-colors"
      >
        <div className="text-sm font-medium text-slate-300">データ審計</div>
        <div className="text-xs text-slate-500 mt-0.5">
          CPT整合性・divergence検証・死区チェック
        </div>
      </button>
    </div>
  )
}

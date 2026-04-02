import { useEffect, useState } from 'react'
import { db } from '../../lib/db'
import type { ConfusablePair, Disease } from '../../lib/types'

export function PairList() {
  const [pairs, setPairs] = useState<(ConfusablePair & { a_ja: string; b_ja: string })[]>([])
  const [filter, setFilter] = useState<'all' | 'layer1'>('layer1')

  useEffect(() => {
    async function load() {
      const diseaseMap = new Map<string, Disease>()
      const allD = await db.diseases.toArray()
      allD.forEach(d => diseaseMap.set(d.id, d))

      let raw: ConfusablePair[]
      if (filter === 'layer1') {
        raw = await db.pairs.where('priority_layer').equals(1).toArray()
      } else {
        raw = await db.pairs.orderBy('priority_layer').limit(200).toArray()
      }

      // Sort by confusion count descending
      raw.sort((a, b) => b.confusion_count - a.confusion_count)

      setPairs(raw.map(p => ({
        ...p,
        a_ja: diseaseMap.get(p.disease_a)?.name_ja || p.disease_a,
        b_ja: diseaseMap.get(p.disease_b)?.name_ja || p.disease_b,
      })))
    }
    load()
  }, [filter])

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">混淆疾患対</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('layer1')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'layer1'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            Layer 1
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            全て
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {pairs.map(p => (
          <div
            key={p.id}
            className="bg-slate-800 rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-400 truncate">{p.a_ja}</span>
                <span className="text-slate-500">vs</span>
                <span className="text-amber-400 truncate">{p.b_ja}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                共有{p.shared_var_count}変量
                {p.confusion_count > 0 && (
                  <span className="text-red-400 ml-2">
                    混淆{p.confusion_count}回
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-500 ml-2">
              L{p.priority_layer}
            </div>
          </div>
        ))}
      </div>

      {pairs.length === 0 && (
        <div className="text-center text-slate-400 mt-12">
          データがありません。先にコンテンツを読み込んでください。
        </div>
      )}
    </div>
  )
}

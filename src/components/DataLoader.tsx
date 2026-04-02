import { useState, useCallback, useEffect } from 'react'
import { loadContentFromJSON, getContentStats } from '../lib/db'
import { supabase } from '../lib/supabase'

interface Props {
  onLoaded: () => void
}

export function DataLoader({ onLoaded }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  // Auto-load from Supabase on mount
  useEffect(() => {
    loadFromSupabase()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFromSupabase = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setStatus('Supabaseからデータを取得中...')

      // Fetch diseases
      setStatus('疾患データを取得中...')
      const { data: diseases, error: e1 } = await supabase
        .from('diseases')
        .select('id, name, name_ja, category')
      if (e1) throw new Error(`diseases: ${e1.message}`)

      // Fetch variables
      setStatus('変量データを取得中...')
      const { data: variables, error: e2 } = await supabase
        .from('variables')
        .select('id, name, name_ja, category, states')
      if (e2) throw new Error(`variables: ${e2.message}`)

      // Fetch confusable pairs
      setStatus('混淆対データを取得中...')
      const { data: pairs, error: e3 } = await supabase
        .from('confusable_pairs')
        .select('id, disease_a, disease_b, shared_var_count, confusion_count, priority_layer')
      if (e3) throw new Error(`pairs: ${e3.message}`)

      // Fetch differential features (paginated — Supabase limits to 1000 per request)
      setStatus('鑑別特徴データを取得中...')
      const allFeatures: Record<string, unknown>[] = []
      let offset = 0
      const pageSize = 1000
      while (true) {
        const { data: batch, error: e4 } = await supabase
          .from('differential_features')
          .select('id, pair_id, variable_id, dist_a, dist_b, divergence, display_text')
          .range(offset, offset + pageSize - 1)
        if (e4) throw new Error(`features: ${e4.message}`)
        if (!batch || batch.length === 0) break
        allFeatures.push(...batch)
        offset += batch.length
        setStatus(`鑑別特徴データを取得中... ${allFeatures.length}件`)
        if (batch.length < pageSize) break
      }

      setStatus('IndexedDBに保存中...')
      await loadContentFromJSON({
        diseases: diseases as never[],
        variables: variables as never[],
        pairs: pairs as never[],
        features: allFeatures as never[],
      })

      const stats = await getContentStats()
      setStatus(
        `完了: ${stats.diseases}疾患, ${stats.pairs}対, ${stats.features}特徴`
      )
      setTimeout(onLoaded, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [onLoaded])

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="text-3xl font-bold mb-2">δMed S3</div>
      <div className="text-slate-400 mb-8">鑑別診断学習</div>

      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm text-center">
        {loading ? (
          <>
            <div className="text-sm text-blue-400 mb-2">
              {status || 'データを読み込み中...'}
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
            </div>
          </>
        ) : error ? (
          <>
            <div className="text-sm text-red-400 mb-4">{error}</div>
            <button
              onClick={loadFromSupabase}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white
                         font-medium py-3 rounded-xl transition-colors"
            >
              再試行
            </button>
          </>
        ) : (
          <div className="text-sm text-green-400">{status}</div>
        )}
      </div>
    </div>
  )
}

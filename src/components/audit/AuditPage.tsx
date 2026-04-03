import { useEffect, useState, useCallback } from 'react'
import { db, verifyFeature, batchSetProvenance } from '../../lib/db'
import type { DifferentialFeature, Variable, ConfusablePair, Provenance } from '../../lib/types'

// ─── Audit result types ──────────────────────────────────

interface SumIssue {
  featureId: string
  pairId: string
  variable: string
  sumA: number
  sumB: number
}

interface KeyMismatch {
  featureId: string
  pairId: string
  variable: string
  onlyInA: string[]
  onlyInB: string[]
}

interface GhostState {
  featureId: string
  pairId: string
  variable: string
  ghostKeys: string[]
  definedStates: string[]
}

interface DivergenceCheck {
  featureId: string
  pairId: string
  variable: string
  stored: number
  tvd: number
  mlr: number
  matchesTvd: boolean
  matchesMlr: boolean
}

interface DeadZoneFeature {
  featureId: string
  pairId: string
  variable: string
  divergence: number
  pairLabel: string
}

interface ProvenanceStats {
  total: number
  withProvenance: number
  bySource: Record<string, number>
  verified: number
  unverified: number
  unverifiedUseful: UnverifiedFeature[]  // divergence>=0.7 & not verified
}

interface UnverifiedFeature {
  featureId: string
  variable: string
  pairLabel: string
  divergence: number
  source: string
}

interface AuditResults {
  // Check 1
  sumIssues: SumIssue[]
  totalFeatures: number
  // Check 2
  keyMismatches: KeyMismatch[]
  // Check 3
  ghostStates: GhostState[]
  // Check 4
  divergenceChecks: DivergenceCheck[]
  divergenceVerdict: 'tvd' | 'mlr' | 'mixed' | 'unknown'
  // Check 5
  deadZone: DeadZoneFeature[]
  // Check 6
  pairStats: { total: number; layer1: number; confusionDist: Record<number, number> }
  // Check 7
  provenance: ProvenanceStats
}

// ─── Audit logic ─────────────────────────────────────────

async function runAudit(): Promise<AuditResults> {
  const features = await db.features.toArray()
  const variables = await db.variables.toArray()
  const pairs = await db.pairs.toArray()

  const varMap = new Map<string, Variable>()
  variables.forEach(v => varMap.set(v.id, v))

  const pairMap = new Map<string, ConfusablePair>()
  pairs.forEach(p => pairMap.set(p.id, p))

  const diseases = await db.diseases.toArray()
  const diseaseMap = new Map<string, string>()
  diseases.forEach(d => diseaseMap.set(d.id, d.name_ja))

  const pairLabel = (p: ConfusablePair) =>
    `${diseaseMap.get(p.disease_a) ?? p.disease_a} vs ${diseaseMap.get(p.disease_b) ?? p.disease_b}`

  const varName = (f: DifferentialFeature) =>
    varMap.get(f.variable_id)?.name_ja ?? f.variable_id

  // ── Check 1: Σ dist ≈ 1.0 ──
  const sumIssues: SumIssue[] = []
  for (const f of features) {
    const sumA = Object.values(f.dist_a).reduce((a, b) => a + b, 0)
    const sumB = Object.values(f.dist_b).reduce((a, b) => a + b, 0)
    if (Math.abs(sumA - 1.0) > 0.05 || Math.abs(sumB - 1.0) > 0.05) {
      sumIssues.push({
        featureId: f.id, pairId: f.pair_id,
        variable: varName(f), sumA, sumB,
      })
    }
  }

  // ── Check 2: key alignment ──
  const keyMismatches: KeyMismatch[] = []
  for (const f of features) {
    const keysA = new Set(Object.keys(f.dist_a))
    const keysB = new Set(Object.keys(f.dist_b))
    const onlyInA = [...keysA].filter(k => !keysB.has(k))
    const onlyInB = [...keysB].filter(k => !keysA.has(k))
    if (onlyInA.length > 0 || onlyInB.length > 0) {
      keyMismatches.push({
        featureId: f.id, pairId: f.pair_id,
        variable: varName(f), onlyInA, onlyInB,
      })
    }
  }

  // ── Check 3: ghost states ──
  const ghostStates: GhostState[] = []
  for (const f of features) {
    const v = varMap.get(f.variable_id)
    if (!v) continue
    const defined = new Set(v.states)
    const allKeys = new Set([...Object.keys(f.dist_a), ...Object.keys(f.dist_b)])
    const ghosts = [...allKeys].filter(k => !defined.has(k))
    if (ghosts.length > 0) {
      ghostStates.push({
        featureId: f.id, pairId: f.pair_id,
        variable: varName(f), ghostKeys: ghosts, definedStates: v.states,
      })
    }
  }

  // ── Check 4: TVD vs max|logLR| ──
  const divergenceChecks: DivergenceCheck[] = []
  let tMatches = 0, mMatches = 0
  for (const f of features) {
    const allStates = new Set([...Object.keys(f.dist_a), ...Object.keys(f.dist_b)])
    // TVD
    let tvdSum = 0
    for (const s of allStates) {
      tvdSum += Math.abs((f.dist_a[s] ?? 0) - (f.dist_b[s] ?? 0))
    }
    const tvd = tvdSum / 2
    // max|logLR|
    let mlr = 0
    for (const s of allStates) {
      const pa = f.dist_a[s] ?? 0
      const pb = f.dist_b[s] ?? 0
      if (pa > 0.001 && pb > 0.001) {
        const absLogLR = Math.abs(Math.log(pa / pb))
        if (absLogLR > mlr) mlr = absLogLR
      } else if ((pa > 0.05 && pb <= 0.001) || (pb > 0.05 && pa <= 0.001)) {
        if (4.0 > mlr) mlr = 4.0
      }
    }

    const matchesTvd = Math.abs(tvd - f.divergence) < 0.01
    const matchesMlr = Math.abs(mlr - f.divergence) < 0.01
    if (matchesTvd) tMatches++
    if (matchesMlr) mMatches++

    divergenceChecks.push({
      featureId: f.id, pairId: f.pair_id,
      variable: varName(f),
      stored: f.divergence, tvd, mlr,
      matchesTvd, matchesMlr,
    })
  }
  const total = features.length
  let divergenceVerdict: 'tvd' | 'mlr' | 'mixed' | 'unknown' = 'unknown'
  if (tMatches > total * 0.9) divergenceVerdict = 'tvd'
  else if (mMatches > total * 0.9) divergenceVerdict = 'mlr'
  else if (tMatches > 0 && mMatches > 0) divergenceVerdict = 'mixed'

  // ── Check 5: dead zone (0.4 ≤ div < 0.7) ──
  const deadZone: DeadZoneFeature[] = features
    .filter(f => f.divergence >= 0.4 && f.divergence < 0.7)
    .sort((a, b) => b.divergence - a.divergence)
    .map(f => {
      const p = pairMap.get(f.pair_id)
      return {
        featureId: f.id, pairId: f.pair_id,
        variable: varName(f), divergence: f.divergence,
        pairLabel: p ? pairLabel(p) : f.pair_id,
      }
    })

  // ── Check 6: pair stats ──
  const confusionDist: Record<number, number> = {}
  for (const p of pairs) {
    confusionDist[p.confusion_count] = (confusionDist[p.confusion_count] || 0) + 1
  }
  const layer1 = pairs.filter(p => p.priority_layer === 1).length

  // ── Check 7: provenance coverage ──
  const bySource: Record<string, number> = {}
  let withProvenance = 0
  let verified = 0
  const unverifiedUseful: UnverifiedFeature[] = []

  for (const f of features) {
    const prov: Provenance | undefined = f.provenance
    if (prov) {
      withProvenance++
      bySource[prov.source] = (bySource[prov.source] || 0) + 1
      if (prov.verified) verified++
      else if (f.divergence >= 0.7) {
        const p = pairMap.get(f.pair_id)
        unverifiedUseful.push({
          featureId: f.id,
          variable: varName(f),
          pairLabel: p ? pairLabel(p) : f.pair_id,
          divergence: f.divergence,
          source: prov.source,
        })
      }
    } else {
      bySource['(none)'] = (bySource['(none)'] || 0) + 1
      // No provenance at all + used in learning = worst case
      if (f.divergence >= 0.7) {
        const p = pairMap.get(f.pair_id)
        unverifiedUseful.push({
          featureId: f.id,
          variable: varName(f),
          pairLabel: p ? pairLabel(p) : f.pair_id,
          divergence: f.divergence,
          source: '(none)',
        })
      }
    }
  }
  unverifiedUseful.sort((a, b) => b.divergence - a.divergence)

  const provenanceStats: ProvenanceStats = {
    total, withProvenance, bySource, verified,
    unverified: total - verified,
    unverifiedUseful,
  }

  return {
    sumIssues, totalFeatures: total,
    keyMismatches, ghostStates,
    divergenceChecks, divergenceVerdict,
    deadZone,
    pairStats: { total: pairs.length, layer1, confusionDist },
    provenance: provenanceStats,
  }
}

// ─── UI ──────────────────────────────────────────────────

export function AuditPage() {
  const [results, setResults] = useState<AuditResults | null>(null)
  const [running, setRunning] = useState(true)
  const [verifiedSet, setVerifiedSet] = useState<Set<string>>(new Set())
  const [verifyRef, setVerifyRef] = useState('')

  const reload = useCallback(() => {
    setRunning(true)
    runAudit().then(r => { setResults(r); setRunning(false) })
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleVerify = async (featureId: string, source: Provenance['source']) => {
    await verifyFeature(featureId, source, verifyRef || undefined)
    setVerifiedSet(prev => new Set(prev).add(featureId))
  }

  const handleBatchSource = async (source: Provenance['source']) => {
    if (!results) return
    const ids = results.provenance.unverifiedUseful
      .filter(u => !verifiedSet.has(u.featureId))
      .map(u => u.featureId)
    if (ids.length === 0) return
    await batchSetProvenance(ids, source, false)
    reload()
  }

  if (running) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">審計実行中...</div>
      </div>
    )
  }
  if (!results) return null

  const { sumIssues, totalFeatures, keyMismatches, ghostStates,
          divergenceChecks, divergenceVerdict, deadZone, pairStats, provenance } = results

  // Count divergence mismatches (neither TVD nor MLR)
  const divMismatches = divergenceChecks.filter(d => !d.matchesTvd && !d.matchesMlr)

  return (
    <div className="h-full overflow-y-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold">データ審計</h1>
      <p className="text-xs text-slate-500">{totalFeatures} features across {pairStats.total} pairs</p>

      {/* ── Check 7: Provenance ── */}
      <CheckSection
        title="L1: CPT 校対カバレッジ"
        pass={provenance.verified > provenance.total * 0.8}
        summary={`${provenance.verified}/${provenance.total} 校対済 (${(provenance.verified / provenance.total * 100).toFixed(0)}%) — 未校対で学習に使用中: ${provenance.unverifiedUseful.length} 件`}
      >
        {/* Source breakdown */}
        <div className="text-[10px] text-slate-400 mb-2">出典 (source) 分布:</div>
        {Object.entries(provenance.bySource)
          .sort(([, a], [, b]) => b - a)
          .map(([src, n]) => (
            <Row key={src}>
              <span className={`font-medium ${src === '(none)' ? 'text-red-400' : src === 'ai_generated' ? 'text-amber-400' : src === 'literature' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {src}
              </span>
              <span className="text-slate-500 ml-2">{n} 件</span>
              <span className="text-slate-600 ml-1">
                ({(n / provenance.total * 100).toFixed(0)}%)
              </span>
            </Row>
          ))}

        {/* Coverage bar */}
        <div className="mt-2 mb-1">
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span>校対済</span>
            <span>{provenance.verified}/{provenance.total}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${provenance.total > 0 ? (provenance.verified / provenance.total * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Batch operations */}
        <div className="mt-2 border-t border-slate-700/50 pt-2">
          <div className="text-[10px] text-slate-500 mb-1">一括操作 (未校対 {provenance.unverifiedUseful.length} 件):</div>
          <div className="flex gap-1.5 flex-wrap">
            <input
              type="text"
              placeholder="参照 (例: UpToDate 2025)"
              value={verifyRef}
              onChange={e => setVerifyRef(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="flex-1 min-w-0 text-[10px] bg-slate-800 border border-slate-700 rounded px-2 py-1
                         text-slate-300 placeholder:text-slate-600"
            />
            <button
              onClick={e => { e.stopPropagation(); handleBatchSource('ai_generated') }}
              className="text-[9px] px-2 py-1 rounded bg-amber-900/40 text-amber-400 hover:bg-amber-900/60"
            >全部AI標記</button>
          </div>
        </div>

        {/* Unverified features that are actively used in learning */}
        {provenance.unverifiedUseful.length > 0 && (
          <>
            <div className="text-[10px] text-red-400 mt-2 mb-1">
              未校対で学習に使用中 (divergence≥0.7):
            </div>
            {provenance.unverifiedUseful.slice(0, 50).map(u => (
              <Row key={u.featureId}>
                <span className="text-amber-400 font-medium">{u.variable}</span>
                <span className="text-[10px] text-slate-500 ml-1">
                  div={u.divergence.toFixed(2)}
                </span>
                <span className={`text-[10px] ml-1 ${u.source === '(none)' ? 'text-red-500' : 'text-slate-600'}`}>
                  [{u.source}]
                </span>
                <span className="text-[10px] text-slate-600 ml-1">{u.pairLabel}</span>
                {!verifiedSet.has(u.featureId) ? (
                  <span className="ml-auto flex gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); handleVerify(u.featureId, 'literature') }}
                      className="text-[8px] px-1.5 py-px rounded bg-emerald-900/40 text-emerald-400
                                 hover:bg-emerald-900/60"
                    >文献</button>
                    <button
                      onClick={e => { e.stopPropagation(); handleVerify(u.featureId, 'expert') }}
                      className="text-[8px] px-1.5 py-px rounded bg-blue-900/40 text-blue-400
                                 hover:bg-blue-900/60"
                    >専門</button>
                  </span>
                ) : (
                  <span className="ml-auto text-[8px] text-emerald-500">校対済 ✓</span>
                )}
              </Row>
            ))}
            {provenance.unverifiedUseful.length > 50 && (
              <div className="text-[10px] text-slate-600 px-1">
                ...他 {provenance.unverifiedUseful.length - 50} 件
              </div>
            )}
          </>
        )}
      </CheckSection>

      {/* ── Check 1 ── */}
      <CheckSection
        title="L2-1: 確率の和 ≈ 1.0"
        pass={sumIssues.length === 0}
        summary={sumIssues.length === 0
          ? `全 ${totalFeatures} features OK`
          : `${sumIssues.length} 件で和 ≠ 1.0 (±0.05)`}
      >
        {sumIssues.map(s => (
          <Row key={s.featureId}>
            <span className="font-medium text-amber-400">{s.variable}</span>
            <span className="text-slate-500 text-[10px] ml-2">
              Σa={s.sumA.toFixed(3)} Σb={s.sumB.toFixed(3)}
            </span>
          </Row>
        ))}
      </CheckSection>

      {/* ── Check 2 ── */}
      <CheckSection
        title="L2-2: dist_a / dist_b の state key 整合"
        pass={keyMismatches.length === 0}
        summary={keyMismatches.length === 0
          ? `全 ${totalFeatures} features OK`
          : `${keyMismatches.length} 件で不一致`}
      >
        {keyMismatches.map(m => (
          <Row key={m.featureId}>
            <span className="font-medium text-amber-400">{m.variable}</span>
            {m.onlyInA.length > 0 && (
              <span className="text-indigo-400 text-[10px] ml-2">
                A only: {m.onlyInA.join(', ')}
              </span>
            )}
            {m.onlyInB.length > 0 && (
              <span className="text-amber-500 text-[10px] ml-2">
                B only: {m.onlyInB.join(', ')}
              </span>
            )}
          </Row>
        ))}
      </CheckSection>

      {/* ── Check 3 ── */}
      <CheckSection
        title="L2-3: 幽霊 state (Variable.states[] にない key)"
        pass={ghostStates.length === 0}
        summary={ghostStates.length === 0
          ? `全 features OK`
          : `${ghostStates.length} 件で未定義 state`}
      >
        {ghostStates.map(g => (
          <Row key={g.featureId}>
            <span className="font-medium text-amber-400">{g.variable}</span>
            <span className="text-red-400 text-[10px] ml-2">
              ghost: {g.ghostKeys.join(', ')}
            </span>
            <span className="text-slate-600 text-[10px] ml-1">
              (defined: {g.definedStates.join(', ')})
            </span>
          </Row>
        ))}
      </CheckSection>

      {/* ── Check 4 ── */}
      <CheckSection
        title="L3: divergence の正体 (TVD? max|logLR|?)"
        pass={divergenceVerdict !== 'unknown' && divergenceVerdict !== 'mixed'}
        summary={
          divergenceVerdict === 'tvd' ? '→ TVD として一貫'
          : divergenceVerdict === 'mlr' ? '→ max|logLR| として一貫'
          : divergenceVerdict === 'mixed' ? `混在: TVDマッチ / MLRマッチ / 不一致 ${divMismatches.length}`
          : `不明 (${divMismatches.length} 件不一致)`
        }
      >
        {/* Show sample of matches and all mismatches */}
        {divMismatches.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] text-red-400 mb-1">
              どちらにもマッチしない ({divMismatches.length} 件):
            </div>
            {divMismatches.slice(0, 20).map(d => (
              <Row key={d.featureId}>
                <span className="text-amber-400">{d.variable}</span>
                <span className="text-[10px] text-slate-400 ml-2">
                  stored={d.stored.toFixed(3)} tvd={d.tvd.toFixed(3)} mlr={d.mlr.toFixed(3)}
                </span>
              </Row>
            ))}
          </div>
        )}
        {/* Show first 5 as sample */}
        <div className="text-[10px] text-slate-600 mb-1">サンプル (先頭5件):</div>
        {divergenceChecks.slice(0, 5).map(d => (
          <Row key={d.featureId}>
            <span className="text-slate-300">{d.variable}</span>
            <span className="text-[10px] ml-2">
              <span className="text-slate-500">stored=</span>{d.stored.toFixed(3)}
              <span className={`ml-1 ${d.matchesTvd ? 'text-green-400' : 'text-slate-600'}`}>
                tvd={d.tvd.toFixed(3)}{d.matchesTvd ? ' ✓' : ''}
              </span>
              <span className={`ml-1 ${d.matchesMlr ? 'text-green-400' : 'text-slate-600'}`}>
                mlr={d.mlr.toFixed(3)}{d.matchesMlr ? ' ✓' : ''}
              </span>
            </span>
          </Row>
        ))}
      </CheckSection>

      {/* ── Check 5 ── */}
      <CheckSection
        title="L4-1: 死区 (0.4 ≤ divergence < 0.7)"
        pass={deadZone.length === 0}
        summary={`${deadZone.length} 件 — ユーザーには見えない所見`}
      >
        {deadZone.map(d => (
          <Row key={d.featureId}>
            <span className="text-amber-400 font-medium">{d.variable}</span>
            <span className="text-[10px] text-slate-400 ml-2">
              div={d.divergence.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-600 ml-1">{d.pairLabel}</span>
          </Row>
        ))}
      </CheckSection>

      {/* ── Check 6 ── */}
      <CheckSection
        title="L4-2: 配対フィルタ統計"
        pass={true}
        summary={`${pairStats.total} pairs (Layer1: ${pairStats.layer1})`}
      >
        <div className="text-[10px] text-slate-400 mb-1">confusion_count 分布:</div>
        {Object.entries(pairStats.confusionDist)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([count, n]) => (
            <Row key={count}>
              <span className="text-slate-300">confusion={count}</span>
              <span className="text-slate-500 ml-2">{n} pairs</span>
              {Number(count) < 2 && (
                <span className="text-red-400 text-[10px] ml-1">← フィルタ漏れ?</span>
              )}
            </Row>
          ))}
      </CheckSection>
    </div>
  )
}

// ─── Shared components ───────────────────────────────────

function CheckSection({ title, pass, summary, children }: {
  title: string
  pass: boolean
  summary: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!pass) // auto-open failures

  return (
    <div className={`border rounded-xl p-3 ${pass
      ? 'border-emerald-800/40 bg-emerald-950/20'
      : 'border-amber-700/40 bg-amber-950/20'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left touch-manipulation"
      >
        <div>
          <span className={`text-xs font-bold ${pass ? 'text-emerald-400' : 'text-amber-400'}`}>
            {pass ? '✓' : '!'} {title}
          </span>
          <div className="text-[10px] text-slate-400 mt-0.5">{summary}</div>
        </div>
        <span className="text-slate-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs flex flex-wrap items-center gap-x-1 py-0.5 px-1
                    bg-slate-800/40 rounded">
      {children}
    </div>
  )
}

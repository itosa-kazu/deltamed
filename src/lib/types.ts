// ─── Content types (from VeSMed export) ───────────────────

export interface Disease {
  id: string        // "D01", "D354"
  name: string      // English name
  name_ja: string   // Japanese name
  category: string
}

export interface Variable {
  id: string        // "S12", "L01", "E01"
  name: string
  name_ja: string
  category: string  // symptom, sign, lab, risk_factor, temporal
  states: string[]
}

export interface ConfusablePair {
  id: string        // UUID
  disease_a: string // Disease ID
  disease_b: string // Disease ID
  shared_var_count: number
  confusion_count: number  // VeSMed empirical confusion count
  priority_layer: number   // 1=empirical, 2=topological, 3=long-tail
}

export interface DifferentialFeature {
  id: string        // UUID
  pair_id: string   // -> ConfusablePair.id
  variable_id: string
  dist_a: Record<string, number>  // P(state | disease_a) for each state
  dist_b: Record<string, number>  // P(state | disease_b) for each state
  divergence: number              // Total Variation Distance
  display_text: string
}

// ─── User state types ─────────────────────────────────────

export interface FSRSCardRecord {
  id: string           // = feature_id
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: number        // 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review?: Date
  updated_at: Date
  synced_at?: Date     // null = needs sync to Supabase
}

export interface ReviewLogRecord {
  id: string           // UUID
  feature_id: string
  rating: number       // 1=Again, 3=Good
  reviewed_at: Date
  synced_at?: Date
}

// ─── S3 Card types ────────────────────────────────────────

export interface S3Card {
  level: 1 | 2 | 3 | 4
  question: string
  pair_id: string
  disease_a_ja: string
  disease_b_ja: string
  concepts: S3Concept[]
  /** Low-TVD variables that are NOT useful for this pair (trap knowledge) */
  traps: S3Trap[]
}

export interface S3Trap {
  variable_ja: string
  divergence: number
}

export interface S3Concept {
  featureId: string
  variable_ja: string
  dist_a: Record<string, number>
  dist_b: Record<string, number>
  divergence: number
  /** The state that produces the max LR */
  bestState: string
  /** Which disease the bestState favors: 'a' or 'b' */
  bestFavors: 'a' | 'b'
  /** The LR value (not log) for display */
  bestLR: number
}

// ─── Review session types ─────────────────────────────────

// ─── Feedback types ───────────────────────────────────────

export interface VeSMedFeedback {
  id: string
  feature_id: string
  disease_a: string
  disease_b: string
  variable_id: string
  feedback_type: 'wrong_cpt' | 'missing_edge' | 'wrong_edge' | 'other'
  description: string
  status: 'pending' | 'applied' | 'rejected'
  created_at: Date
  synced_at?: Date
}

// ─── Review session types ─────────────────────────────────

export type SessionPhase =
  | 'loading'
  | 'question'       // Showing question, user generating answer
  | 'revealing'      // Showing answer with distribution
  | 'summary'        // Session complete
  | 'empty'          // No cards due

export interface SessionStats {
  total: number
  recalled: number
  forgotten: number
}

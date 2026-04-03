-- Schema reconciliation: document actual state of differential_features
--
-- History:
--   001: Created with per-state format (state, prob_a, prob_b, delta, favors)
--   Manual: Altered to per-variable JSONB (dist_a, dist_b, divergence) — no migration written
--   002: Added provenance JSONB column
--
-- This migration ensures the schema matches what the app expects.
-- Run ONLY if your table still has the old per-state format.
-- If your table already has dist_a/dist_b columns, skip this.

-- ── Step 1: Check current state ──
-- Run this first to see which format you have:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'differential_features' ORDER BY ordinal_position;
--
-- If you see: state, prob_a, prob_b, delta, favors → run the migration below
-- If you see: dist_a, dist_b, divergence → skip to Step 3

-- ── Step 2: Transform per-state → per-variable (ONLY if needed) ──
-- This creates a temporary table, aggregates per-state rows into JSONB, then replaces

-- CREATE TABLE differential_features_new (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   pair_id UUID NOT NULL REFERENCES confusable_pairs(id) ON DELETE CASCADE,
--   variable_id TEXT NOT NULL REFERENCES variables(id),
--   dist_a JSONB NOT NULL DEFAULT '{}'::jsonb,
--   dist_b JSONB NOT NULL DEFAULT '{}'::jsonb,
--   divergence REAL NOT NULL DEFAULT 0,
--   display_text TEXT,
--   provenance JSONB,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   UNIQUE(pair_id, variable_id)
-- );
--
-- INSERT INTO differential_features_new (pair_id, variable_id, dist_a, dist_b, divergence, display_text, created_at)
-- SELECT
--   pair_id,
--   variable_id,
--   jsonb_object_agg(state, prob_a) AS dist_a,
--   jsonb_object_agg(state, prob_b) AS dist_b,
--   MAX(delta) AS divergence,
--   MAX(display_text) AS display_text,
--   MIN(created_at) AS created_at
-- FROM differential_features
-- GROUP BY pair_id, variable_id;
--
-- DROP TABLE differential_features;
-- ALTER TABLE differential_features_new RENAME TO differential_features;
--
-- CREATE INDEX idx_diff_features_variable ON differential_features(variable_id);
-- CREATE INDEX idx_diff_features_pair ON differential_features(pair_id);
-- CREATE INDEX idx_diff_features_divergence ON differential_features(divergence DESC);

-- ── Step 3: Ensure provenance column + backfill ──
-- (Same as 002_add_provenance.sql — safe to re-run)

ALTER TABLE differential_features
  ADD COLUMN IF NOT EXISTS provenance JSONB;

UPDATE differential_features
SET provenance = jsonb_build_object(
  'source', 'ai_generated',
  'verified', false
)
WHERE provenance IS NULL;

CREATE INDEX IF NOT EXISTS idx_features_provenance_verified
  ON differential_features ((provenance->>'verified'));

-- ── Step 4: RLS for differential_features (ensure read policy exists) ──
ALTER TABLE differential_features ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'differential_features' AND policyname = 'features_read'
  ) THEN
    CREATE POLICY features_read ON differential_features FOR SELECT USING (true);
  END IF;
END $$;

-- ── Step 5: Verify ──
-- SELECT count(*), count(provenance) AS with_prov,
--        count(*) FILTER (WHERE (provenance->>'verified')::boolean) AS verified
-- FROM differential_features;

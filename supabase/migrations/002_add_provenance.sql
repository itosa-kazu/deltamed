-- Add provenance tracking to differential_features
-- Tracks data source, verification status, and references

-- 1. Add provenance column (JSONB, nullable for backwards compat)
ALTER TABLE differential_features
  ADD COLUMN IF NOT EXISTS provenance JSONB;

-- 2. Backfill: mark ALL existing data as ai_generated + unverified
UPDATE differential_features
SET provenance = jsonb_build_object(
  'source', 'ai_generated',
  'verified', false
)
WHERE provenance IS NULL;

-- 3. Known manual corrections → mark with notes
-- D76(輸血反応) S07(倦怠感): severe=0%→5% (commit fe6424d)
UPDATE differential_features
SET provenance = jsonb_build_object(
  'source', 'ai_generated',
  'verified', false,
  'notes', 'severe 0%→5% 手動修正 (2026-04-03)'
)
WHERE variable_id = 'S07'
  AND pair_id IN (
    SELECT id FROM confusable_pairs
    WHERE disease_a = 'D76' OR disease_b = 'D76'
  );

-- 4. Index for audit queries
CREATE INDEX IF NOT EXISTS idx_features_provenance_verified
  ON differential_features ((provenance->>'verified'));

-- 5. Helper view: unverified features actively used in learning (divergence >= 0.7)
CREATE OR REPLACE VIEW unverified_active AS
SELECT
  df.id,
  df.pair_id,
  df.variable_id,
  v.name_ja AS variable_ja,
  df.divergence,
  df.provenance->>'source' AS source,
  d1.name_ja AS disease_a_ja,
  d2.name_ja AS disease_b_ja
FROM differential_features df
JOIN confusable_pairs cp ON cp.id = df.pair_id
JOIN variables v ON v.id = df.variable_id
JOIN diseases d1 ON d1.id = cp.disease_a
JOIN diseases d2 ON d2.id = cp.disease_b
WHERE df.divergence >= 0.7
  AND (df.provenance IS NULL OR (df.provenance->>'verified')::boolean = false)
ORDER BY df.divergence DESC;

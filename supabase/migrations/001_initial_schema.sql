-- δMed S3 Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- Content tables (read-only for users, admin-seeded)
-- ============================================================

CREATE TABLE diseases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE variables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  category TEXT NOT NULL,
  states TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE confusable_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_a TEXT NOT NULL REFERENCES diseases(id),
  disease_b TEXT NOT NULL REFERENCES diseases(id),
  shared_var_count INT NOT NULL,
  confusion_count INT DEFAULT 0,
  priority_layer INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(disease_a, disease_b),
  CHECK(disease_a < disease_b)
);

CREATE TABLE differential_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES confusable_pairs(id) ON DELETE CASCADE,
  variable_id TEXT NOT NULL REFERENCES variables(id),
  state TEXT NOT NULL,
  prob_a REAL NOT NULL,
  prob_b REAL NOT NULL,
  delta REAL NOT NULL,
  favors TEXT NOT NULL,
  display_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pair_id, variable_id, state)
);

CREATE INDEX idx_diff_features_variable ON differential_features(variable_id);
CREATE INDEX idx_diff_features_pair ON differential_features(pair_id);
CREATE INDEX idx_diff_features_delta ON differential_features(delta DESC);

-- ============================================================
-- User state tables (per-user, RLS protected)
-- ============================================================

CREATE TABLE user_fsrs_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES differential_features(id),
  due TIMESTAMPTZ NOT NULL DEFAULT now(),
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INT NOT NULL DEFAULT 0,
  scheduled_days INT NOT NULL DEFAULT 0,
  reps INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0,
  state INT NOT NULL DEFAULT 0,
  last_review TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ,
  UNIQUE(user_id, feature_id)
);

CREATE INDEX idx_fsrs_due ON user_fsrs_state(user_id, due);
CREATE INDEX idx_fsrs_state ON user_fsrs_state(user_id, state);

CREATE TABLE review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES differential_features(id),
  rating INT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_review_log_user ON review_log(user_id, reviewed_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diseases_read" ON diseases FOR SELECT USING (true);

ALTER TABLE variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variables_read" ON variables FOR SELECT USING (true);

ALTER TABLE confusable_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pairs_read" ON confusable_pairs FOR SELECT USING (true);

ALTER TABLE differential_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "features_read" ON differential_features FOR SELECT USING (true);

ALTER TABLE user_fsrs_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fsrs_own" ON user_fsrs_state
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "log_own" ON review_log
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

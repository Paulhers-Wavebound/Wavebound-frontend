-- 20260418_chat_label_rls.sql
--
-- Label Intelligence chat: enforce strict per-label data isolation.
--
-- Before: chat_sessions / chat_messages / session_ideas are keyed by user_id
-- only. Any authenticated user with a session UUID can read any other user's
-- chat (no RLS), and there is no label_id column to scope by.
--
-- After: chat_sessions gains a `label_id` column; RLS policies enforce that
-- authenticated users can only read/write rows whose label_id matches their
-- current user_profiles.label_id. Messages and ideas delegate to the parent
-- session's RLS via session_id subqueries.
--
-- Non-label chats (chat_type != 'label' — used by ContentAssistant /
-- DiscoverChat / SidecarChat) keep their existing user-scoped behavior.
-- Only rows with chat_type='label' are subject to label isolation.
--
-- The admin label switcher already writes user_profiles.label_id, so RLS
-- automatically follows the admin's active impersonated label. When an admin
-- switches back to their own account (label_id=NULL), they see nothing —
-- which is the intended isolation.
--
-- =======
-- HOW TO RUN
-- =======
--
-- DRY-RUN (safe — auto-rolls back on disconnect; no COMMIT at EOF):
--
--   psql "$DATABASE_URL" -f migrations/20260418_chat_label_rls.sql
--
-- REAL RUN (persists):
--
--   psql "$DATABASE_URL"
--   \i migrations/20260418_chat_label_rls.sql
--   -- Review NOTICE output. If the label_id backfill counts look right:
--   COMMIT;
--   -- Otherwise:
--   ROLLBACK;
--   \q
--
-- =======
-- ROLLOUT ORDER
-- =======
--
-- 1. Run this migration (adds column + RLS in one transaction).
-- 2. Immediately deploy the frontend change that passes label_id on insert.
-- 3. Verify by creating a new label chat as user A (label=Columbia),
--    then logging in as user B (label=Warner) and confirming chat_sessions
--    rows from A are not visible.
--
-- The one-transaction approach means the brief window where a stale
-- frontend tries to INSERT without label_id will get RLS-rejected for
-- chat_type='label' rows. Artist chats (chat_type != 'label') are
-- unaffected.

BEGIN;

-- ═══════ 1. Schema ══════════════════════════════════════════════════════

ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS label_id uuid REFERENCES labels(id) ON DELETE CASCADE;

-- ═══════ 2. Backfill ═════════════════════════════════════════════════════
-- Populate label_id from each session owner's current user_profiles.label_id.
-- Caveat: if a user has changed/lost their label since writing a chat, the
-- chat inherits their *current* label — there is no audit trail to
-- reconstruct the original. Users with label_id=NULL in user_profiles leave
-- their old chats with label_id=NULL, which makes those rows invisible under
-- the new RLS (intended — they need a label assignment to resume access).

UPDATE chat_sessions cs
SET label_id = up.label_id
FROM user_profiles up
WHERE cs.user_id = up.user_id
  AND cs.label_id IS NULL
  AND up.label_id IS NOT NULL;

-- ═══════ 3. Indexes ══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_chat_sessions_label_id
  ON chat_sessions(label_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_label_type
  ON chat_sessions(user_id, label_id, chat_type);

-- ═══════ 4. RLS: chat_sessions ═══════════════════════════════════════════
-- Label chats: require owner + label match.
-- Other chats (artist, etc.): require owner only (existing behavior).

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_sessions service role" ON chat_sessions;
CREATE POLICY "chat_sessions service role" ON chat_sessions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_sessions user select" ON chat_sessions;
CREATE POLICY "chat_sessions user select" ON chat_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      chat_type IS DISTINCT FROM 'label'
      OR (
        label_id IS NOT NULL
        AND label_id = (
          SELECT label_id FROM user_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "chat_sessions user insert" ON chat_sessions;
CREATE POLICY "chat_sessions user insert" ON chat_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      chat_type IS DISTINCT FROM 'label'
      OR (
        label_id IS NOT NULL
        AND label_id = (
          SELECT label_id FROM user_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "chat_sessions user update" ON chat_sessions;
CREATE POLICY "chat_sessions user update" ON chat_sessions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      chat_type IS DISTINCT FROM 'label'
      OR label_id = (
        SELECT label_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      chat_type IS DISTINCT FROM 'label'
      OR label_id = (
        SELECT label_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "chat_sessions user delete" ON chat_sessions;
CREATE POLICY "chat_sessions user delete" ON chat_sessions
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      chat_type IS DISTINCT FROM 'label'
      OR label_id = (
        SELECT label_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ═══════ 5. RLS: chat_messages ═══════════════════════════════════════════
-- Delegate to chat_sessions' RLS via session_id subquery. The subquery
-- itself respects chat_sessions' policies, so a user can only reference
-- sessions they can see.

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages service role" ON chat_messages;
CREATE POLICY "chat_messages service role" ON chat_messages
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages user all" ON chat_messages;
CREATE POLICY "chat_messages user all" ON chat_messages
  FOR ALL TO authenticated
  USING (session_id IN (SELECT id FROM chat_sessions))
  WITH CHECK (session_id IN (SELECT id FROM chat_sessions));

-- ═══════ 6. RLS: session_ideas ═══════════════════════════════════════════

ALTER TABLE session_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_ideas service role" ON session_ideas;
CREATE POLICY "session_ideas service role" ON session_ideas
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "session_ideas user all" ON session_ideas;
CREATE POLICY "session_ideas user all" ON session_ideas
  FOR ALL TO authenticated
  USING (session_id IN (SELECT id FROM chat_sessions))
  WITH CHECK (session_id IN (SELECT id FROM chat_sessions));

-- ═══════ 7. Audit (review before COMMIT) ═════════════════════════════════

DO $$
DECLARE
  total_label         bigint;
  backfilled_label    bigint;
  null_label          bigint;
  total_artist        bigint;
  msgs_for_label      bigint;
  ideas_for_label     bigint;
  orphan_sessions     bigint;
BEGIN
  SELECT count(*) INTO total_label
    FROM chat_sessions WHERE chat_type = 'label';
  SELECT count(*) INTO backfilled_label
    FROM chat_sessions WHERE chat_type = 'label' AND label_id IS NOT NULL;
  SELECT count(*) INTO null_label
    FROM chat_sessions WHERE chat_type = 'label' AND label_id IS NULL;
  SELECT count(*) INTO total_artist
    FROM chat_sessions WHERE chat_type IS DISTINCT FROM 'label';
  SELECT count(*) INTO msgs_for_label
    FROM chat_messages m
    JOIN chat_sessions s ON s.id = m.session_id
    WHERE s.chat_type = 'label';
  SELECT count(*) INTO ideas_for_label
    FROM session_ideas i
    JOIN chat_sessions s ON s.id = i.session_id
    WHERE s.chat_type = 'label';
  -- Label sessions whose owner has no label_id in user_profiles (these rows
  -- are now invisible under the new RLS — users need a label assignment).
  SELECT count(*) INTO orphan_sessions
    FROM chat_sessions cs
    LEFT JOIN user_profiles up ON up.user_id = cs.user_id
    WHERE cs.chat_type = 'label'
      AND (up.label_id IS NULL OR up.user_id IS NULL);

  RAISE NOTICE '═══ chat RLS migration audit ═══';
  RAISE NOTICE 'label chats: % total, % backfilled, % NULL (invisible post-RLS)',
    total_label, backfilled_label, null_label;
  RAISE NOTICE 'non-label chats (unaffected): %', total_artist;
  RAISE NOTICE 'label chat messages: %', msgs_for_label;
  RAISE NOTICE 'label session ideas: %', ideas_for_label;
  RAISE NOTICE 'label sessions with orphan/no-label owner: %', orphan_sessions;
  RAISE NOTICE '';
  RAISE NOTICE 'If counts look right, COMMIT. Otherwise ROLLBACK.';
END $$;

-- NO COMMIT — dry-run by default. Add \`COMMIT;\` at the psql prompt after
-- reviewing the NOTICE block above.

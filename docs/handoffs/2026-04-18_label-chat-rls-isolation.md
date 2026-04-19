# Backend handoff — Label Intelligence chat: per-label RLS isolation

**Date:** 2026-04-18
**Requested by:** Paul
**Security severity:** high — users from one label can currently read other labels' chats

## The problem

Today, `chat_sessions` and `chat_messages` are scoped by `user_id` only. There is no `label_id` column, no RLS enforcement, and the frontend-only `.eq("user_id", ...)` filter is not a security boundary. A Columbia user who obtains a Warner session UUID (via logs, a shared link, the edge function, or guessing) can read that chat. The same gap exists for `session_ideas` and—when used as an AI-history fallback—`n8n_chat_histories`.

Roster / artist-search surfaces are NOT affected (audit found all those paths already filter by `label_id` client-side and the backend edge function scopes tool executions to the authenticated user's label_id). The gap is isolated to chat persistence.

## What's already landed on the frontend (this session)

1. **`migrations/20260418_chat_label_rls.sql`** — dry-run-by-default migration. Adds `label_id` to `chat_sessions`, backfills from `user_profiles.label_id`, enables RLS on `chat_sessions`/`chat_messages`/`session_ideas`, and writes label-scoped policies. Artist chats (`chat_type != 'label'`) keep user-only scoping.
2. **`src/hooks/useChatSessions.ts`** — now accepts `labelId` as a second arg and writes it on both `createSession` and `persistDraftSession` inserts.
3. **`src/pages/label/LabelAssistant.tsx`** — pulls `labelId` from `useUserProfile()` and passes it in.
4. Type includes `label_id?: string | null` on `ChatSession`.

tsc clean.

## What backend needs to do

### Step 1 — Run the migration

Dry-run first:

```bash
psql "$DATABASE_URL" -f migrations/20260418_chat_label_rls.sql
```

Review the NOTICE block it prints (number of label-chat rows backfilled, how many have orphan owners, etc.). If the numbers match expectations, connect interactively and COMMIT:

```bash
psql "$DATABASE_URL"
\i migrations/20260418_chat_label_rls.sql
-- read NOTICE output
COMMIT;
\q
```

### Step 2 — Audit `label-chat.ts` edge function

The edge function at `edge-functions/label-chat.ts` uses `supabaseAdmin()` (service role), so it bypasses RLS automatically. But it also **creates chat_sessions and chat_messages programmatically** via service role — which means those writes won't go through the RLS CHECK. Please confirm:

- **Every INSERT into `chat_sessions` inside `label-chat.ts` now sets `label_id`**, sourced from the `labelId` already resolved at the top of the request handler (line ~3376 — `fetchChatHistory()` already resolves it).
- **Messages** don't need label_id since they inherit via `session_id`, but verify no path creates a session without resolving `labelId` first.
- The `fetchChatHistory()` function (line ~3255) should additionally verify the session's `label_id` matches the requesting user's current `user_profiles.label_id` before returning messages. Today it only checks `user_id` ownership — which becomes moot once RLS is enforced on direct queries, but the edge function bypasses RLS, so add an explicit `.eq("label_id", labelId)` on the session lookup.

### Step 3 — Post-migration verification

Manual test from two accounts:

1. Log in as a Columbia user → create a label chat → note the session ID.
2. Log in as a Warner user → try to fetch that session ID directly through Supabase (e.g., `supabase.from("chat_sessions").select("*").eq("id", <columbia-session-id>)`). Should return zero rows.
3. Confirm the Columbia user still sees their own chat.
4. Try as an admin impersonating Warner — should see Warner's chats, not Columbia's.

SQL shortcut for verification:

```sql
-- Confirm RLS is live
SELECT tablename, rowsecurity FROM pg_tables
  WHERE tablename IN ('chat_sessions','chat_messages','session_ideas');
-- All three should show t (true).

-- Confirm policy count
SELECT tablename, count(*) FROM pg_policies
  WHERE tablename IN ('chat_sessions','chat_messages','session_ideas')
  GROUP BY tablename;
```

## Open design question for you

- **`n8n_chat_histories` fallback**: the frontend currently reads this as an assistant-reply fallback when `chat_messages` has no assistant rows (see `useChatSessions.ts:221-234`). It has no `label_id` and no RLS. Probably should also get a session-delegated RLS policy—same pattern as `chat_messages`. I did not add it to this migration because I'm unsure if the table is managed by n8n (external writer) and if enabling RLS would break the n8n agent. **Decide whether to include it, and if so how service-role access flows from the n8n worker.**

## Rollout risk notes

- Current deployed frontend (before this session's change) inserts `chat_sessions` rows without `label_id`. After migration, those inserts will be **rejected by RLS for `chat_type='label'`**. The window is only as long as it takes to deploy the updated frontend. Non-label chats are unaffected.
- Admins with `user_profiles.label_id = NULL` (no impersonation set) lose access to any label chats they own under the new RLS. The audit in the migration reports this count; treat as acceptable (admins can set an override to regain access).
- The backfill assigns historical chats to each user's **current** `user_profiles.label_id`. If an admin wrote chats while impersonating multiple labels, the historical chats all follow to whichever label they're currently on. No audit trail exists to reconstruct original context.

## Files changed in this session (frontend only)

- `migrations/20260418_chat_label_rls.sql` (new)
- `src/hooks/useChatSessions.ts`
- `src/pages/label/LabelAssistant.tsx`

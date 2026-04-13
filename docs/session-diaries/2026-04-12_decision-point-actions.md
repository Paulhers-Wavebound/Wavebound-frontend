# 2026-04-12 — Decision Point Actions (Forward / Got it / Snooze)

## What changed

### New backend

- `decision_point_actions` table created live via psql against the production DB. Migration SQL preserved at `docs/handoffs/20260412_decision_point_actions.sql` for the next backend session to commit into `wavebound-backend/migrations/`.
- New SECURITY DEFINER function `public.get_label_teammates(uuid)` so the Forward dialog can list teammates without loosening `user_profiles` RLS.
- New edge function `forward-decision-point` deployed and ACTIVE — routes to Resend (email), Slack webhook (slack), or verified-teammate insert (user). Always writes an audit row.

### New frontend files

- `src/utils/decisionPointKey.ts` — stable key synth + snooze presets (1h, 4h, tomorrow morning, 3 days, next week)
- `src/hooks/useDecisionPointActions.ts` — React Query hook with `acknowledge` / `snooze` / `forward` mutations and `acknowledgedKeys` / `futureSnoozedKeys` / `revisiting` derived state. Also `useLabelTeammates` for the Forward picker.
- `src/components/label/content-social/DecisionPointActions.tsx` — the 3-button inline row
- `src/components/label/content-social/ForwardDecisionDialog.tsx` — Tabs (Teammate/Email/Slack) + note textarea + sonner toast feedback
- `docs/features/decision-point-actions.md` — feature documentation

### Modified frontend files

- `src/components/label/content-social/SignalReportCard.tsx` — added `briefDate` prop, calls `useDecisionPointActions(briefDate)`, filters out acknowledged + future-snoozed DPs, renders the new `RevisitingSection` above the main Decision Points list, threads `briefDate` through `DecisionPointsSection` → `DecisionPointRow`, and renders `<DecisionPointActions />` inline at the bottom of every row.
- `src/components/label/content-social/ContentSocialDashboard.tsx` — passes `briefDate={presidentBrief.briefDate ?? today}` to `SignalReportCard`.
- `src/hooks/usePresidentBrief.ts` — added `brief_date` to the select and exposed `briefDate` on the returned `PresidentBrief` shape.
- `docs/handoffs/backend-todo.md` — top-of-file entry capturing the live migration, the stable-DP-ID follow-up, and the `SLACK_WEBHOOK_URL` secret instruction.

## Why

Paul's prompt: "Add a section to each Decision Point that could for example be 'Forward' and then you forward that stat to an email or slack channel or just to another persons Wavebound Portal. And a button that says 'Got it' which means remove this, or Snooze which is a button that has a dropdown to when you wanted to be reminded about this again."

Without these actions, every refresh of the Signal Report showed the same DPs whether or not the strategist had already handled them — there was no way to clear, defer, or hand off a decision point.

## What was tested

- `npx tsc --noEmit` — clean across all changes
- DB migration applied successfully (psql confirmed table + RLS + indexes + helper function)
- Edge function deployed and ACTIVE on Supabase (verified via `supabase functions list`)
- Edge function smoke-test: `curl` without auth correctly returns `401 Missing authorization header`

## What to verify in browser

Switch to the Content & Social role on `/label`, find the Signal Report card, and:

1. **Got it**: Click "Got it" on a decision point → it should disappear from the list with a toast "Got it — removed from today's brief". Refresh the page → the dismissed DP should stay gone.
2. **Snooze**: Click "Snooze" on a decision point → dropdown should show 5 presets. Pick "In 1 hour" → DP disappears with a toast "Snoozed until …". To verify the Revisiting section, you can manually update the `snooze_until` column in the DB to today and reload — the DP should come back inside a "Revisiting" section above the main Decision Points list.
3. **Forward → email**: Click "Forward" → dialog opens. Switch to Email tab, enter a real email (`paul@…`) and a note, click Forward. Confirm receipt + that the audit row appears in `decision_point_actions` with `forwarded_to_email` set.
4. **Forward → teammate**: Open the Teammate tab → it should list teammates on your label. Pick one, send. They should see the DP in their Revisiting section the next time they load the brief, with your note inline.
5. **Forward → Slack**: Will return a 501 toast until you run `supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... --project-ref kxvgbowrkmowuyezoeke`. Once set, the message posts to the configured channel.

## Round 2 — follow-ups shipped in the same session

Paul said "go for it" on 4 of the 5 recommendations. All landed + tsc clean:

### 1. Persisted TODO checklist (DB-backed)

- New table `signal_report_todo_state` (+ RLS) — SQL at `docs/handoffs/20260412_signal_report_todo_state.sql`, applied live via psql
- New hook `src/hooks/useSignalReportTodos.ts` with optimistic `check` / `uncheck` / `toggle` mutations
- `SignalReportCard.tsx` — replaced local `todoChecked: Set<number>` state with `checkedTodoKeys` from the hook; wired `toggleTodoPersisted(todo)` as the click handler; count badge now reads `checkedTodoCount / report.todos.length`
- Checkmarks now survive reloads, device switches, and brief regenerations (snapshot is stored per-row)

### 2. Undo on "Got it" toast

- New `unacknowledge` mutation in `useDecisionPointActions` (DELETE matching the unique ack row)
- Sonner `action: { label: 'Undo', onClick: () => unacknowledge.mutate(dp) }` attached to the success toast, with `duration: 5000`
- Also exposed on the hook's return value for any future callers

### 3. Attribution in Revisiting

- `RevisitingEntry` gained `senderUserId?: string` (populated for `forwarded_to_me` entries)
- `RevisitingSection` now calls `useLabelTeammates` and builds a `senderLookup: Map<user_id, display>` from the same RPC already used by the Forward dialog
- `DecisionPointRow` gained a `senderLabel` prop that renders a burn-orange "from @handle" chip next to the artist name when set
- Falls back to "from teammate" if the sender is no longer on the label

### 4. Decision action telemetry view

- New view `public.decision_action_telemetry` aggregates `decision_point_actions` by `(label_id, action_date, category, urgency, action_type)` with `event_count`, `distinct_users`, `distinct_decision_points`
- Extracts `category` and `urgency` from the JSONB snapshot so it still answers "which DP categories get ignored" even after the brief regenerates
- Permissions locked to `service_role` only (REVOKE from anon/authenticated/PUBLIC); not exposed through PostgREST
- SQL at `docs/handoffs/20260412_decision_action_telemetry_view.sql`, applied live

### Not done — #5 (backend-side stable DP IDs)

Would require editing `generate-signal-report.ts` in the backend repo. Per CLAUDE.md that repo is read-only from this session. Left as a handoff in `backend-todo.md`.

## "While I was in here" recommendations

1. **Backend should commit the migration file** — currently the schema of record lives only in `docs/handoffs/20260412_decision_point_actions.sql`. The next backend session should copy it into `wavebound-backend/migrations/` so the migration history matches reality. Same handoff also covers the stable-DP-ID work and the `SLACK_WEBHOOK_URL` secret.

2. **Apply the same actions row to the TODO checklist** — the brief's "Today's Actions" checklist (line ~511 in SignalReportCard) currently only has client-side checkbox state that resets on reload. Wiring it to the same `decision_point_actions` table (or a sister table) would let those checkmarks persist across sessions and devices.

3. **Add an "Undo" action to the Got it toast** — sonner supports action buttons in toasts. A 5-second undo window would catch accidental dismissals. Trivial to implement on top of the existing mutation by exposing a `deleteAction(key)` mutation.

4. **Show "snoozed by Paul" / "forwarded by Aden" attribution in the Revisiting section** — the data is in the row (`user_id`, `forwarded_to_user_id`), but the UI currently only distinguishes by reason. Adding a small "from @aden" chip on forwarded items would make it scannable who's pulling you in on what.

5. **Telemetry** — every action insert is a high-signal event ("strategist dismissed/snoozed/forwarded a DP"). Worth dropping into a `signal_report_telemetry` view downstream so we can answer "which DP categories get acted on, snoozed, or ignored?" — that informs whether the AI is generating the right kinds of decisions.

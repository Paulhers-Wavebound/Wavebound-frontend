# Decision Point Actions — Forward, Got it, Snooze

## What it does

Each row in the Signal Report's "Decision Points" list now has three inline actions:

- **Forward** — opens a dialog to send the decision point to (a) a teammate on the same label via their Wavebound portal, (b) an external email address, or (c) a Slack channel. Optionally with a note. The forwarding edge function dispatches via Resend / Slack webhook / a row insert and writes an audit row in `decision_point_actions`.
- **Got it** — marks the DP as acknowledged for the current user only. It immediately disappears from this user's brief. Other teammates still see it until they themselves dismiss it.
- **Snooze** — dropdown of presets (in 1h / in 4h / tomorrow morning / in 3 days / next week). Hides the DP from the brief until the snooze time arrives, then re-surfaces it on the brief on that day inside a new **Revisiting** section above the main Decision Points list.

A **Revisiting** section also surfaces decision points that were forwarded to the current user by a teammate, with the sender's note inline.

## Who uses it and why

The Content & Social role's morning workflow is to triage 3–5 critical decisions and act on them. Without these actions, every refresh of the brief showed the same DPs whether or not the strategist had already handled them. The actions let users:

- Clear handled items from view (Got it) so the brief reflects what actually still needs attention.
- Defer items that aren't actionable right now to the moment they will be (Snooze).
- Pull a teammate in on a decision they own (Forward → user) without leaving the dashboard.
- Push key signals into the team's broader workflow (Forward → Slack channel or email).

## Correct behavior

- Forward, Got it, and Snooze all appear inline at the bottom of every Decision Point row (after the evidence chips).
- Got it instantly removes the DP from the visible list and shows a sonner toast: "Got it — removed from today's brief".
- Snooze opens a dropdown menu; selecting a preset writes a row, removes the DP from the visible list, and shows a toast like "Snoozed until Mon 9:00 AM".
- Forward opens a dialog with three tabs (Teammate / Email / Slack), an optional note textarea, and Cancel / Forward buttons. Forward is disabled until a target is selected (or a valid value entered). On success the dialog closes and a toast confirms.
- Snoozes survive page reloads (queried from `decision_point_actions`).
- Snoozes survive brief regeneration: even if tomorrow's `president_briefs` row replaces today's DPs, a snoozed DP whose `snooze_until::date = today` still surfaces in the Revisiting section because the full DP snapshot is stored on the action row.
- A Decision Point forwarded to a teammate appears in their Revisiting section the next time they load the brief, with the sender's note shown beneath the row.
- Got it is **per user**. If Paul dismisses a DP, his teammates still see it.
- Slack forwarding requires `SLACK_WEBHOOK_URL` in Supabase secrets. Without it, the edge function returns 501 with a clear "Slack forwarding is not configured" message — the frontend surfaces this as a toast.

## Edge cases

- **Empty state**: when all DPs are acknowledged or snoozed, the Decision Points section says "No critical decisions needed today. Roster is stable." The card itself still renders.
- **Loading**: while `useDecisionPointActions` loads, all DPs are visible (we default to "nothing dismissed"). Mutations are disabled while in flight.
- **Error**: failed mutations show a red sonner toast with the error message; the DP stays visible. Forward errors propagate the edge function's `error` field verbatim.
- **No teammates on label**: the Teammate tab in the Forward dialog shows "No teammates on this label yet."
- **Invalid email**: the Forward button stays disabled until the email regex (`/^\S+@\S+\.\S+$/`) passes.
- **Slack channel without `#` prefix**: the dialog auto-prepends one before sending.
- **Brief with no `brief_date` in DB** (client-built fallback): defaults to today's ISO date, so actions still key correctly.
- **Re-snoozing a snoozed DP**: inserts another row; the most-recent snooze_until wins because the Revisiting query keys on `created_at DESC`.

## Architecture

### Database — `decision_point_actions`

```
id UUID PK
user_id UUID FK auth.users
label_id UUID FK labels
brief_date DATE
decision_point_key TEXT             -- synthesized: brief_date:artist_handle:category:urgency
decision_point_snapshot JSONB       -- full DP for re-rendering on snooze day
action_type TEXT                    -- 'acknowledged' | 'snoozed' | 'forwarded'
snooze_until TIMESTAMPTZ
forwarded_to_user_id UUID NULL
forwarded_to_email TEXT NULL
forwarded_to_slack_channel TEXT NULL
forward_note TEXT NULL
created_at TIMESTAMPTZ
```

RLS: SELECT where `user_id = auth.uid() OR forwarded_to_user_id = auth.uid()`. INSERT/UPDATE/DELETE locked to `user_id = auth.uid()`. Migration SQL: `docs/handoffs/20260412_decision_point_actions.sql` (also pending commit to `wavebound-backend/migrations/`).

A SECURITY DEFINER helper `public.get_label_teammates(uuid)` returns minimal teammate info for the Forward dialog's user picker, since `user_profiles` RLS would otherwise hide other rows.

### Edge function — `forward-decision-point`

`POST /functions/v1/forward-decision-point`

Authenticates the caller via JWT, dispatches to Resend (email) / Slack webhook (slack) / verified-teammate insert (user), and always writes an audit row in `decision_point_actions` with `action_type = 'forwarded'`. Source: `edge-functions/forward-decision-point.ts`.

### Frontend

- `src/utils/decisionPointKey.ts` — stable key synth + snooze presets
- `src/hooks/useDecisionPointActions.ts` — React Query hook with `acknowledge`, `snooze`, `forward` mutations + `acknowledgedKeys`, `futureSnoozedKeys`, `revisiting` derived state
- `src/hooks/useDecisionPointActions.ts:useLabelTeammates` — RPC call to `get_label_teammates`
- `src/components/label/content-social/DecisionPointActions.tsx` — the 3-button row
- `src/components/label/content-social/ForwardDecisionDialog.tsx` — the Forward dialog
- `src/components/label/content-social/SignalReportCard.tsx` — wires the hook, filters DPs, renders the Revisiting section

## Known limitations / future work

- Decision points have no backend-assigned UUID — the synthesized key collides if two DPs share artist + category + urgency on the same day (rare). Backend handoff filed.
- No undo on Got it (the row stays in the DB; future toast action could expose it).
- Custom snooze datetime picker is not implemented — only the five presets.
- Forward to Slack hardcodes the webhook target; the channel name in the dialog is recorded for audit but doesn't actually pick the channel (the webhook decides). Multi-channel support would need a label-level webhook directory.

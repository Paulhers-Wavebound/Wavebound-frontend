# 2026-04-23 — Factory v2: kill-feedback → Autopilot priors

Hand-off for a future backend session. Do NOT execute until Paul gives the green light to promote Factory v2 out of prototype state — this is a v1 item, not a now item.

## The UI side already ships the data

When a user hits **Kill + feedback** in `/label/content-factory-v2` (Review tab, both Pending and Scheduled sub-tabs), the modal collects:

- `itemId: string` — the queue item being killed
- `reason: 'angle_wrong' | 'tone_off' | 'factual_issue' | 'other'`
- `note: string` — free text, optional

Frontend entry points (already in the codebase, both marked with `// TODO: feeds back into artist's Autopilot priors`):

- `src/pages/label/ContentFactoryV2.tsx` — `handleKillWithFeedback` in the page component
- `src/components/content-factory-v2/KillFeedbackModal.tsx` — submit handler

Currently the data is dropped after a toast. Nothing is persisted.

## What to build, backend side

### 1. Schema

A `kill_feedback` table capturing every kill event:

```sql
CREATE TABLE kill_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  queue_item_id TEXT NOT NULL,   -- stays TEXT — queue items are ephemeral until v1 adds a real queue table
  output_type TEXT NOT NULL,     -- matches OutputType enum: short_form | mini_doc | sensational | self_help | tour_recap | fan_brief | link_video
  angle_family TEXT,             -- nullable — link_video and fan_brief have no angle family
  angle_id UUID,                 -- nullable — kills can happen on items without a source angle
  reason TEXT NOT NULL CHECK (reason IN ('angle_wrong', 'tone_off', 'factual_issue', 'other')),
  note TEXT,
  killed_by UUID NOT NULL REFERENCES auth.users(id),
  killed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX kill_feedback_artist_idx ON kill_feedback(artist_id, killed_at DESC);
CREATE INDEX kill_feedback_label_idx ON kill_feedback(label_id, killed_at DESC);
```

RLS: standard label-scoped policy matching `fan_briefs` / `cf_jobs`.

### 2. Edge function

`POST /functions/v1/factory-kill-feedback` taking `{ queue_item_id, output_type, angle_family?, angle_id?, reason, note? }`. Derives `artist_id` + `label_id` from the queue item (v1 will have a real queue table with both). Inserts one row.

### 3. Priors rollup

The point of collecting kill feedback is to bias future Autopilot generation per-artist + per-family. Two places this matters:

1. **Generate-time filtering.** When Autopilot drafts N angles for artist X in family Y, it should de-weight (or skip) angles that echo a recently killed one. Simple heuristic for v1: look at the last 14 days of kills for (artist, family). If `reason='angle_wrong'` showed up >2x, drop that family from Autopilot's generation mix for this artist until a human explicitly re-enables.
2. **Confidence grounding.** We explicitly dropped numeric confidence scores on angle cards (Paul: "grounded in nothing = AI tell"). If we bring a number back in v1, the approval-rate for this (artist, family) tuple IS a grounded signal — compute it from `queued_and_approved - killed / queued_total` over the last 30 days. Show it as a bar or percentile, not a raw number.

A pg view like this gets you most of the way:

```sql
CREATE VIEW artist_family_priors AS
SELECT
  artist_id,
  angle_family,
  COUNT(*) FILTER (WHERE reason = 'angle_wrong') AS angle_wrong_14d,
  COUNT(*) FILTER (WHERE reason = 'tone_off') AS tone_off_14d,
  COUNT(*) FILTER (WHERE reason = 'factual_issue') AS factual_issue_14d,
  COUNT(*) AS total_kills_14d,
  MAX(killed_at) AS last_kill_at
FROM kill_feedback
WHERE killed_at > now() - INTERVAL '14 days'
GROUP BY artist_id, angle_family;
```

### 4. Frontend wire-up (after this is live)

In `ContentFactoryV2.tsx::handleKillWithFeedback`, swap the toast-only path for:

```ts
await supabase.functions.invoke("factory-kill-feedback", {
  body: { queue_item_id: itemId, reason, note, output_type: item.outputType, ... }
});
```

Plus remove the two `// TODO: feeds back into artist's Autopilot priors` markers.

## Priority

Low until Factory v2 leaves prototype. Don't burn a cycle on this while the UX is still being validated — the shape of the feedback model depends on whether Autopilot lands in v1 or v2.

## Linked context

- Frontend session diary: `docs/session-diaries/2026-04-23_content-factory-v2-prototype.md`
- Merge-path decision: `docs/handoffs/2026-04-23_factory-v2-merge-path.md`

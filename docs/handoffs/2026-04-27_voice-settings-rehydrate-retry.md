# Backend handoff — Persist voice_settings on cartoon/realfootage scripts

**Repo:** `wavebound-backend`
**Stack:** Postgres migration + Edge Functions (Deno)
**Estimated effort:** 30 min. One column on two tables, one assignment in two edge functions.

---

## Background

The Retry button on a Content Factory v2 Story card re-fires `/functions/v1/content-factory-vo-dispatch` with the original `chat_job_id` + the user's chosen `voice_id` and `voice_settings`. As long as the in-memory queue item or the localStorage snapshot is intact, the original `voice_settings` (`stability` / `style` / `use_speaker_boost`) flow through and the retry sounds identical to the first attempt.

After a long-absent rehydrate (localStorage cleared, browser change, incognito), the queue item is reconstructed from `cartoon_scripts` / `realfootage_scripts`. Both tables persist `voice_id_used`, but neither persists the voice settings JSON. The retry handler falls back to the dispatcher's default settings — same voice, but possibly different stability / style. Most users won't notice; users who tuned the voice will hear a different cartoon than the original.

The frontend comment at `src/components/content-factory-v2/cartoonReconciler.ts:532-535` already documents this honestly. This handoff is for the optional consistency upgrade.

## What to ship on the backend

### 1. Migration

```sql
-- migrations/20260428_*_voice_settings_used.sql
alter table public.cartoon_scripts
  add column if not exists voice_settings_used jsonb;
alter table public.realfootage_scripts
  add column if not exists voice_settings_used jsonb;

comment on column public.cartoon_scripts.voice_settings_used is
  'ElevenLabs voice_settings JSON the dispatcher used on the original render. Read by the Retry button after a DB-only rehydrate so retries match the original voice tuning.';
comment on column public.realfootage_scripts.voice_settings_used is
  'ElevenLabs voice_settings JSON the dispatcher used on the original render. Read by the Retry button after a DB-only rehydrate so retries match the original voice tuning.';
```

Backfill: leave existing rows null. The frontend already handles null by falling back to defaults (current behavior), so existing scripts are not retroactively broken.

### 2. Both VO functions write the column on first dispatch

In `cartoon-vo` and `realfootage-vo`, where the new `cartoon_scripts` / `realfootage_scripts` row is inserted, also persist the resolved voice settings:

```ts
// inside the Insert builder for the script row
{
  // ... existing fields
  voice_id_used: resolvedVoiceId,
  voice_settings_used: resolvedVoiceSettings ?? null,
}
```

`resolvedVoiceSettings` should already be in scope — it's whatever the dispatcher passed through (or the function's defaults if the dispatcher passed none).

### 3. (Optional) Realtime publication

No change needed — the column is read at retry time via the rehydrate query, not via Realtime.

## What changes in the frontend after this lands

Two small follow-ups in `src/components/content-factory-v2/cartoonReconciler.ts`:

1. Add `voice_settings_used: { stability: number; style: number; use_speaker_boost: boolean } | null` to the `CartoonScriptRow` interface.
2. Project the column in both rehydrate queries in `src/pages/label/ContentFactoryV2.tsx`:
   - `recentCartoonScriptsQuery`: add `voice_settings_used` to the `.select(...)` string.
   - `recentRealfootageScriptsQuery`: same.
3. Backfill `cartoonVoiceSettings` from the row on the rehydrate merge (mirroring the existing `cartoonVoiceId ?? row.voice_id_used` pattern).

These follow-ups are not in this PR — file them after the migration is live so the type matches reality.

## Acceptance

- A new cartoon job creates a `cartoon_scripts` row where `voice_settings_used` is the JSON the user picked (e.g. `{"stability": 0.6, "style": 0.4, "use_speaker_boost": true}`), not null.
- Same for realfootage.
- A retry on a rehydrated card (after `localStorage.clear()`) sends the persisted settings back to the dispatcher — verify by checking the dispatcher's request log shows the same JSON the user originally picked.

## Notes / context

- Don't break this into a normalized `voice_settings` table — the JSON is small (3 fields), the join cost outweighs the structure benefit.
- Don't add a CHECK constraint on the JSON shape — ElevenLabs has added fields (`speed`, `similarity_boost`) over time, the column should accept whatever the SDK passes through.

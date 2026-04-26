# cartoon_scripts duplicates per chat_job — add uniqueness on source_chat_job_id

**Repo:** `wavebound-backend`
**Files:** `edge-functions/content-factory-cartoon-vo.ts` + a new
migration in `migrations/`
**Priority:** Medium — wastes one full ElevenLabs + Creatomate spend
(~$8) per duplicate, and confuses the V2 frontend's reconciliation
which assumes 1:1 chat_job → cartoon_script.

## Symptom

Live evidence as of 2026-04-26 ~05:42 UTC. Single user kicked off **one**
cartoon for Addison Rae. Two `cartoon_scripts` rows exist for the
single `chat_jobs.beaa6af4-17e2-4a7d-99c1-7d6b0d304d2a`:

```
cartoon_scripts
  id=f903042d-2ebc-4dc2-a1a8-7a7eab8ccdf3  status=complete           created_at=05:42:41Z
  id=bab885cf-178d-4aa3-ac76-c6de423ce9eb  status=rendering_images   created_at=05:42:49Z
```

Both have `source_chat_job_id=beaa6af4-…`. The two scripts diverge
through the pipeline — first one already produced
`cartoon_videos.e1863a52-…` (final MP4 ready); second one still
spending money on image generation. The user only ever saw one
cartoon's worth of UI; the second is invisible spend.

## Root cause

`ensureCartoonScript()` in
`edge-functions/content-factory-cartoon-vo.ts:328-403` takes either a
`scriptId` (loads existing, returns `isNew: false`) **or** a
`chatJobId` (always inserts a fresh row, no dedup check):

```ts
if (args.scriptId) {
  const { data, error } = await sb.from('cartoon_scripts').select('*').eq('id', args.scriptId).single()
  …
  return { script: data, isNew: false }
}

// ↓ chatJobId path: no SELECT, straight to INSERT
const { data: created, error: insertErr } = await sb
  .from('cartoon_scripts')
  .insert({
    …
    source_chat_job_id: chatJobId || null,
    …
  })
```

Combined with three race vectors on the FE that all trigger the
`chatJobId` POST against this edge function:

1. **Realtime UPDATE + 15s poll race** — `cartoonReconcileLocksRef` in
   `ContentFactoryV2.tsx` is process-local, doesn't survive HMR or
   remount. Two reconciles can fire after `chat_jobs` flips to
   `complete`, both POST `cartoon-vo` with the same `chat_job_id`.
2. **HMR / hard refresh after the POST started but before
   `cartoon_scripts` was created** — the FE doesn't know a script was
   inserted, so on rehydrate it fires `cartoon-vo` again.
3. **Two tabs on the same chat_job** — different operator users on the
   same label, or one user with two browser tabs.

Today there's nothing in the edge function or the DB stopping the
second insert.

## Fix

### Part 1 — DB-level safety net (a migration)

Add a unique partial index on `cartoon_scripts.source_chat_job_id`
(partial because old rows may have NULL — we don't want to break those):

```sql
CREATE UNIQUE INDEX cartoon_scripts_source_chat_job_id_uniq
ON cartoon_scripts (source_chat_job_id)
WHERE source_chat_job_id IS NOT NULL;
```

After this, a duplicate INSERT raises `23505 unique_violation`. Catch
it in the edge function (Part 2) and treat as "already exists" rather
than 500.

### Part 2 — SELECT-then-INSERT in `ensureCartoonScript`

In `edge-functions/content-factory-cartoon-vo.ts:328`, add a
short-circuit before the insert:

```ts
// Right after the scriptId-path early return (line 342), before the
// chatJobId resolution block:
if (chatJobId) {
  const { data: existing } = await sb
    .from("cartoon_scripts")
    .select("*")
    .eq("source_chat_job_id", chatJobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return { script: existing, isNew: false };
}
```

Then wrap the INSERT in a try/catch that, on `23505`, re-runs the SELECT
and returns the row that won the race. (Two concurrent edge invocations
will both pass the SELECT check, both attempt INSERT, exactly one
wins — the loser catches and reads.)

### Part 3 — One-time cleanup of the existing duplicate

```sql
-- Keep the script that has a cartoon_videos row attached.
-- bab885cf… has no cartoon_videos and is mid-render — kill it.
UPDATE cartoon_scripts
   SET status = 'failed',
       error_message = 'duplicate of f903042d (deduped 2026-04-26)'
 WHERE id = 'bab885cf-178d-4aa3-ac76-c6de423ce9eb';
```

(Hard delete is also fine if `cartoon_image_jobs` / `cartoon_vo_clips`
FKs cascade — verify before deleting.)

## Why the frontend can't fix this alone

The V2 reconciler can't know whether its first POST already wrote a
script row before it crashed / refreshed / lost network. The only
authoritative answer is "ask the DB whether this chat_job already has
a script." Putting that check in the edge function means every caller
benefits, including future ones we haven't built.

## Test plan

1. Run the migration against a non-prod project ref.
2. Re-deploy the edge function.
3. Hit `cartoon-vo` twice in quick succession with the same
   `chat_job_id` — both responses should resolve to the same
   `script_id`, only one row in `cartoon_scripts`.
4. Verify the cleanup SQL only mutates the orphan row.

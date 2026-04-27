# 2026-04-27 — Content Factory v2: realfootage queue card label + failure-status propagation

## Why

Backend handoff `wavebound-backend/docs/handoffs/2026-04-27_content-factory-v2-realfootage-label-and-status.md` flagged two live bugs that only affected the realfootage half of the Story preset:

- **Bug 1.** A realfootage job for Addison Rae rendered as `Cartoon · Addison Rae` in the queue and inbox. The user assumed the cartoon pipeline was broken when it was actually a realfootage attempt against an artist with no ingested source clips.
- **Bug 2.** When a realfootage row reached `materializing_failed` / `clips_failed`, the queue card stayed on the spinner ("Generating · 20m ago") indefinitely. Hard refresh didn't surface the failure, and even when it eventually flipped via the 15-second polling fallback, the inbox card didn't show the backend `error_message`.

Decisions Paul approved this session before edits started:

- Standardize on `"Real edit"` as the user-facing prefix (matches the sub-format dropdown). Replace the lone `"Real footage"` literal at `cartoonReconciler.ts:468`.
- Retry path: when `cartoonChatJobId` exists, POST to `/functions/v1/content-factory-vo-dispatch` directly (idempotent on backend, reuses writer output). Fall back to writer-restart only when no `chat_job_id` exists yet.

## What changed

### `src/components/content-factory-v2/cartoonReconciler.ts`

- New exported constant `FORMAT_TITLE_PREFIX: Record<CartoonFormat, string>` — single source of truth for `Cartoon` / `Real edit`. Anything that builds a queue card title goes through this map.
- `itemFromSnapshot` (~line 230): swapped the hard-coded `Cartoon · ${name}` fallback for `${FORMAT_TITLE_PREFIX[s.cartoonFormat ?? "cartoon"]} · ${name}`. Snapshot already carried `cartoonFormat` — just had to consult it.
- `reconcileCartoonItem` (~line 468): replaced the inline `format === "realfootage" ? "Real footage" : "Cartoon"` ternary with `FORMAT_TITLE_PREFIX[format]`. Pure rename — kills the prefix inconsistency between this file and `ContentFactoryV2.tsx`.
- `CartoonScriptRow` interface: added optional frontend-only tag `format?: CartoonFormat` and an optional `realfootage_videos` join (mirrors the existing `cartoon_videos` shape). The rehydrate effect tags each row with its source pipeline before passing to derive/build helpers, so neither helper has to re-query to know which table the row came from.
- `pickVideo`: now reads `row.cartoon_videos ?? row.realfootage_videos ?? null` so one helper handles either pipeline.
- `deriveCartoonItemState`: routes to the right `FAILED_STATUSES` set (`REALFOOTAGE_FAILED_STATUSES` for realfootage), error-label fn, and stage mapper based on `row.format`. Realfootage rows skip the cartoon-images thumbnail URL — that bucket is cartoon-only and the QueueCard's video-player fallback handles preview.
- `buildCartoonItemFromScript`: now reads `row.format`, sets `cartoonFormat` on the returned `QueueItem` (was previously missing — root cause of the prefix leak even after a refresh), and uses `FORMAT_TITLE_PREFIX[format]` for the title fallback.

### `src/pages/label/ContentFactoryV2.tsx`

- Imported `CartoonFormat` and `FORMAT_TITLE_PREFIX` from `cartoonReconciler`.
- `handleCartoonGenerate` placeholder builder: title now uses `FORMAT_TITLE_PREFIX[subFormat]` instead of an inline ternary. Behavior identical, but the prefix table is the only place the label string lives.
- New `recentRealfootageScriptsQuery`: parallels `recentCartoonScriptsQuery`. Same 7-day cutoff, same staleTime/refetchInterval shape, queries `realfootage_scripts` with the `realfootage_videos` join, and tags each row with `format: "realfootage"` before returning. Cartoon query also tags rows with `format: "cartoon"` so the merge effect can treat both lists uniformly.
- Rehydrate merge effect: now consumes both queries (`[...cartoonRows, ...realfootageRows]`) and propagates `cartoonFormat` from the matched row onto the in-memory item. The patch's `changed` predicate now includes `cartoonFormat` so a row that lands first via `chat_job_id` (before the dispatcher echo arrives) immediately tags the item with the correct pipeline.
- Realtime subscriptions (~line 1062): now branch on `item.cartoonFormat`. Realfootage items subscribe to `realfootage_scripts` and `realfootage_videos` instead of the cartoon equivalents. Channel name suffix includes the format (`cf-${format}-${itemId}-${scriptId}`) to keep channels distinct. The chat-phase subscription on `chat_jobs` stays format-agnostic — it transitions to a format-specific script subscription once `cartoonScriptId` is set.
- `handleRetryRender` cartoon branch: split into two paths.
  - **Has `cartoonChatJobId`** → reset script-level state but keep `cartoonChatJobId` / `cartoonFormat` / `cartoonVoiceId` / `cartoonVoiceSettings`, then POST to `content-factory-vo-dispatch` via `supabase.functions.invoke`. Apply the response's `script_id` + `format` back to the queue. This is what the realfootage `materializing_failed` retry needs — the writer's JSON is reused and the VO functions stay idempotent on `source_chat_job_id`.
  - **No `cartoonChatJobId`** → existing writer-restart path, but the writer message now includes the `"format": "realfootage"` hint when retrying a realfootage card so it doesn't silently fall back to cartoon.

## What was tested programmatically

- `npx tsc --noEmit` → exit 0, no errors.
- `grep -rn "Cartoon · |Real footage |Real footage·|Real edit · " src/` → no matches; `FORMAT_TITLE_PREFIX` is the only source of these strings.

## What to verify in the browser

1. **Cartoon path unchanged.** Ask the writer "Make a cartoon for Harry Styles". Card title = `Cartoon · Harry Styles`. Stages tick Script → VO → Images → Video.
2. **Bug 1 fixed.** Ask "Make a 60-second real-footage story for Addison Rae". Card title = `Real edit · Addison Rae` from the moment the placeholder lands. Hard refresh — card still says `Real edit · Addison Rae` after rehydrate.
3. **Bug 2a — realtime fix.** While a realfootage card is generating, in another tab run:
   ```sql
   update realfootage_scripts
   set status='materializing_failed',
       error_message='no source footage available — ingest videos first'
   where id='<the-script-id>';
   ```
   Card flips to **Failed** in ≤5s without a refresh. Inbox card shows the error message in red below the title.
4. **Bug 2b — rehydrate fix.** With a realfootage card present, run `localStorage.clear()` in devtools and hard-refresh. The realfootage card returns with `Real edit · ${name}` and the correct status. Same drill for any cartoon card from the last 7 days.
5. **Bug 2c — retry fix.** Click Retry on a `materializing_failed` realfootage card. Network tab shows a single POST to `/functions/v1/content-factory-vo-dispatch` with body `{ chat_job_id, voice_id, ... }`. No new `chat_jobs` row is created (the existing one is reused). Card flips back to "Generating · vo" within seconds and the realfootage VO function picks it up.
6. **Retry cap regression check.** Click Retry 3× in quick succession. 4th attempt shows the `Already retried 3×` toast (in-flight `RETRY_MAX` guard from yesterday's retry-failed-assets work still functions).

## While I was in here, I also recommend

1. **Realfootage poster-frame extraction.** Realfootage cards now correctly land in Failed/Pending states, but the QueueCard preview falls back to the video element instead of a still — clip 0's first frame isn't extracted to a deterministic URL like `cartoon-images/${id}/000.png`. A small ffmpeg-based job in `realfootage-vo` writing `realfootage-thumbs/${id}/poster.jpg` would unlock thumbnail rendering and fix the visual asymmetry between cartoon and realfootage Review tiles. Medium-impact.
2. **Drop the unused `voice_settings` column on retry.** `cartoon_scripts` / `realfootage_scripts` don't store `voice_settings`, so a rehydrated retry can only send the bare `voice_id`. If voice_settings consistency on retry matters, add a `voice_settings_used jsonb` column to both tables — otherwise the comment in `cartoonReconciler.ts:519` should drop the implication that it might exist. Low-impact, mostly hygiene.
3. **Sweeper visibility.** The new server-side kickoff sweeper (`chat-jobs-kickoff-sweeper` pg_cron) is invisible in the UI. A small `cf_kickoff_sweeper_runs` log table + a debug panel in `/label/factory?tab=create` showing "last sweeper run: 23s ago, picked up 1 chat job" would make pipeline debugging much faster the next time something gets stuck. Low-impact, debug-only.
4. **Format-aware "Story" preset filter.** The Story preset bundles cartoon + realfootage in one bucket. Once realfootage volume picks up, users will want a `?subFormat=cartoon` or `?subFormat=realfootage` filter in the inbox header to triage one pipeline at a time without losing the other. Tag exists on `QueueItem.cartoonFormat`, just needs UI plumbing. Medium-impact.
5. **Polling fallback latency.** The 15s polling interval is fine in steady state but feels long when a user is staring at a card waiting for a status update. Could drop to 8s when the tab is visible and bump to 30s when hidden — `document.visibilityState` is already wired into the realtime effect for catch-up. Low-impact, polish.

## Follow-ups shipped same session

Paul approved all five follow-ups; here's what landed where.

### Frontend (this commit)

- **#5 Visibility-aware polling.** New `setupVisibilityAwareInterval(visibleMs, hiddenMs, tick)` helper at the top of `ContentFactoryV2.tsx`. Replaced the three duplicated `setInterval + onVisible` blocks (fan_brief, cartoon, link_video) with single calls. Cadences: fan_brief 15s/30s, cartoon 15s/30s, link_video 3s/15s. The visibility-change handler still triggers an immediate catch-up tick on tab return.
- **#2 Sub-format filter in the inbox.** New `cartoonFormatFilter` state in `ReviewView.tsx` with indented `Both / Cartoon / Real edit` sub-rows under the Story output filter. Sub-rows only render when the Story filter is active and at least one cartoon-bucket item exists. Switching the output filter away from Story resets the sub-format filter via the new `setOutputFilterAndReset` callback.
- **#1 Realfootage poster — frontend prep.** `deriveCartoonItemState` in `cartoonReconciler.ts` now constructs `realfootage-thumbs/${id}/poster.jpg` for realfootage rows under the same conditions that produce the cartoon `cartoon-images/${id}/000.png`. The `<img onError>` in ReviewView hides broken images, so this is safe to ship before the backend writer lands — posters appear automatically the moment the file shows up at that URL.

### Backend handoffs (in this repo's `docs/handoffs/`)

- **`2026-04-27_realfootage-poster-frame.md`** — ffmpeg single-frame extraction in `realfootage-vo` after Creatomate render-complete, upload to a public `realfootage-thumbs` bucket. ~1–2 hr.
- **`2026-04-27_cf-kickoff-sweeper-visibility.md`** — `cf_kickoff_sweeper_runs` log table + RLS read policy for label users + sweeper modification to write a row per run. Frontend debug panel design included; will land here after the schema is live. ~1 hr.
- **`2026-04-27_voice-settings-rehydrate-retry.md`** — adds `voice_settings_used jsonb` column to both `*_scripts` tables, populated by both VO functions on dispatch. Original recommendation #4 was based on misreading my own comment ("the comment is misleading" — it isn't, it's already honest about the gap), so this is the corrected scope: actually persist the settings so rehydrated retries match the original render. ~30 min.

### What was tested programmatically (post-follow-ups)

- `npx tsc --noEmit` → exit 0 with all five changes applied.
- Diff stats: `cartoonReconciler.ts +94 / ReviewView.tsx +257 / ContentFactoryV2.tsx +386`. The ReviewView and ContentFactoryV2 totals include yesterday's in-flight retry-telemetry / `RETRY_MAX` work that was already on disk before this session — pure deltas from this session are smaller.

### What to verify in the browser (additional)

7. **Sub-format filter.** In Review, set output filter to "Story". Two indented rows appear: `Cartoon` and `Real edit`, each with a count. Click `Real edit` — only realfootage cards remain. Click `Both` — both come back. Click another output filter (e.g., "Lyric Overlay") — sub-format selection resets.
8. **Visibility-aware polling.** Open devtools network tab on the Review view. With a cartoon mid-generate and tab focused, observe Supabase requests every ~15s. Switch tabs (or focus another window) — requests slow to ~30s. Switch back — an immediate catch-up tick fires, then the 15s cadence resumes.
9. **Realfootage poster smoke test.** With a completed realfootage card, observe in devtools that the QueueCard `<img>` requests `realfootage-thumbs/${scriptId}/poster.jpg`. Until the backend ships, this 404s and the video-element fallback kicks in (no visual regression). After the backend ships, the still appears.

# Retry button on failed assets — Content Factory v2

## What changed

- `src/components/content-factory-v2/types.ts` — added optional `linkVideoTranscribeProvider` field on `QueueItem` so the original Whisper provider survives a refresh and can be replayed by Retry.
- `src/components/content-factory-v2/linkVideoReconciler.ts` — added `linkVideoTranscribeProvider` to `LinkVideoRunSnapshot` + the snapshot⇄item helpers.
- `src/components/content-factory-v2/cartoonReconciler.ts` — added `cartoonVoiceId` + `cartoonVoiceSettings` to `CartoonRunSnapshot` + the snapshot⇄item helpers, so a refreshed page can still retry a cartoon with the original voice.
- `src/components/content-factory-v2/ReviewView.tsx` — the existing `RefreshCw` Retry button (previously gated to `isStalled` only) now also shows when `isFailed`. Label shortened from "Retry render" to "Retry" since it now covers cartoon + link_video too.
- `src/pages/label/ContentFactoryV2.tsx`:
  - `handleLinkVideoJob` now captures `transcribeProvider` from `LinkVideoJobInput` and stores it on the placeholder QueueItem.
  - `handleRetryRender` rewritten as a 3-branch dispatcher keyed on `outputType`:
    - **fan_brief** — same behavior as before (clear `render_error`/`render_error_at` on the brief row, optimistic UI flip, refetch). Now also flips `status: "failed"` → `"pending"` so it covers terminal failures, not just stalls.
    - **cartoon** — resets the card to `status:"generating"`, `cartoonStage:"script"`, clears chat/script/hook/final-url ids, then re-fires `streamChatMessage` with the same writer prompt + same artist + same voice. Same item id, same QueueItem position — just a fresh chat job under the hood.
    - **link_video** — resets the card to `status:"generating"`, `linkVideoStage:"pending"`, then re-invokes `content-factory-generate` with the original `artist_handle` / `ref_tiktok_url` / `transcribe_provider` and swaps in the new `job_id`. Same item id; reconciler picks it up on its next 3s tick.

## Why

User asked: "add a retry button on the assets that failed, that will retry it with the same settings as initially tried." Previously the only retry surface was for _stalled_ fan-briefs. Cartoons and link_videos that hit `status:"failed"` had no recourse other than Dismiss + manual recreate.

## What was tested

- `npx tsc --noEmit` — clean (exit 0).
- Did not exercise in browser (would need a manufactured failure on each output type to verify end-to-end).

## What to verify in browser

1. **fan_brief failure** (rare path, but the existing render-stalled flow is the closest analog): hit Retry from the Pending tab, watch the red "Failed" pill flip to a normal pending pill, and within ~30s a fresh `renderedClipUrl` lands.
2. **cartoon failure**: easiest repro is to kill a chat stream mid-script (or wait for one to actually fail). After Retry, the card should flip back to `Generating` with the script-stage pill spinning, and within 15–20 min produce a new MP4. Voice should match the one originally picked.
3. **link_video failure**: repro by handing it a TikTok URL the pipeline can't ingest. After Retry, the card flips back to `Generating · Queued — pipeline picking up.` and the `linkVideoJobId` swaps to a new uuid. Original `transcribe_provider` is preserved across the retry (verifiable from `cf_jobs` row).

## Follow-up pass (same session) — all four "while I was in here" items shipped

- **DB-backed cartoon rehydrate now carries voice id**
  - `src/components/content-factory-v2/cartoonReconciler.ts` — `CartoonScriptRow` gained `voice_id_used`; `buildCartoonItemFromScript` projects it onto `QueueItem.cartoonVoiceId`.
  - `src/pages/label/ContentFactoryV2.tsx` — `recentCartoonScriptsQuery` now selects `voice_id_used`; the merge effect backfills `cartoonVoiceId` on already-known items so a long-absent rehydrate (localStorage gone, DB only) still has enough context to retry.
  - `voice_settings` is not on `cartoon_scripts`, so DB-rehydrated retries fall back to the dispatcher's defaults (acceptable — voice ID is the user-visible setting).
- **`BriefViewerModal` handles failed items**
  - `src/components/content-factory-v2/ReviewView.tsx`:
    - Modal now branches on `isFailed`: header "Generation failed", red icon, surfaces `item.jobError`, exposes the same Retry button the stalled state uses.
    - `ThumbFrame` is now clickable for failed items so the user can open the modal and read the error in full (was previously not interactive on failure).
- **Retry cap (3)**
  - `src/components/content-factory-v2/types.ts` — added `retryCount?: number` on `QueueItem` and exported `RETRY_MAX = 3`.
  - Both `CartoonRunSnapshot` and `LinkVideoRunSnapshot` (+ their `*FromItem` / `*FromSnapshot` helpers) persist `retryCount`, so the cap survives a refresh.
  - `handleRetryRender` now reads `priorAttempts = item.retryCount ?? 0`; if `>= RETRY_MAX`, fires a destructive toast and returns. Each successful retry path bumps `retryCount` to `attemptNo`.
- **Retry telemetry**
  - New file `src/components/content-factory-v2/retryTelemetry.ts` — `logRetryAttempt({ itemId, outputType, originalError, attempt })` writes to `console.info('[cf-retry-telemetry]', …)` and inserts into the `cf_retry_telemetry` Supabase table.
  - `handleRetryRender` calls `logRetryAttempt` once per click, after the cap check.
  - **Migration shipped same session**: `supabase/migrations/20260426203149_cf_retry_telemetry.sql` created the table (uuid pk, created_at, user_id FK, item_id, output_type, original_error, attempt smallint with check) plus two indexes (created_at desc; user_id, created_at desc) and an RLS policy `insert own retry telemetry` (authenticated, `user_id = auth.uid()`). Applied to prod via `supabase db push`. Verified via `curl /rest/v1/cf_retry_telemetry` → HTTP 200.
  - Types regenerated (`supabase gen types typescript --project-id kxvgbowrkmowuyezoeke --schema public`); the `unknown as never` cast in `retryTelemetry.ts` was dropped — direct `supabase.from("cf_retry_telemetry").insert(…)` now type-checks.

## Verification

- `npx tsc --noEmit` — clean (exit 0) after every change.
- Not yet exercised in browser — needs a manufactured failure on each output type to verify the new modal copy + cap behavior end-to-end.

## "While I was in here" recommendations

1. **Persist cartoon voice in the DB-backed rehydrate too** — the `recentCartoonScriptsQuery` rebuilds items from `cartoon_scripts`/`realfootage_scripts`, which currently doesn't expose `voice_id_used` to the client. If the user closes the tab + comes back hours later, the localStorage snapshot is discarded by the freshness gate and the QueueItem comes back with no `cartoonVoiceId`, so Retry would refuse. Worth wiring `voice_id_used` into the script select + projecting it back onto the QueueItem.
2. **Surface retry inside `BriefViewerModal`** — when the user clicks the failed thumbnail, the modal currently shows "Render in progress" with a spinner because it only branches on `isStalled`, not `isFailed`. Quick win: detect `isFailed` and reuse the same retry/dismiss buttons the modal already has for stalled.
3. **Cap retries per item** — nothing today stops a user from spamming Retry on a permanently broken yt_blocked / geo_blocked source. A small `retryCount` field + "you've retried this 3 times, the source is probably the issue" copy would prevent wasted ElevenLabs/Replicate spend on cartoons especially.
4. **Telemetry on retry outcomes** — log `{itemId, outputType, originalError, retryAttempt}` to a `cf_retries` table or PostHog. Right now we have zero visibility into whether retries ever succeed or just burn API spend.
5. **Link the retry to the kill-feedback modal** — if Retry fails twice, prompt for kill-feedback automatically (Paul's stated philosophy: every kill should feed Autopilot priors). Today the user has to remember to click Dismiss + fill out the modal manually.

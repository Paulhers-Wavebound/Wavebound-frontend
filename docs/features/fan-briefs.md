# Fan Briefs

AI-generated content briefs for an artist's fan accounts. The pipeline mines long-form source material (YouTube interviews, podcasts, live performances), extracts the moments most likely to land as fan content, and surfaces them as ready-to-post brief cards inside Content Factory V2 — where a social manager reviews, tweaks, approves, and downloads them as 9:16 clips.

**Fan briefs no longer have a standalone page.** The original `/label/fan-briefs` window was retired on 2026-04-25; all generation, review, and approval now happens inside `/label/content-factory-v2` (Create + Review tabs).

## Who uses it and why

Content & Social teams running fan accounts on behalf of label-signed artists. They open Content Factory V2, kick off a fan-brief job from the Create wizard, and review the resulting clips in the Review tab — editing hooks in their own voice, approving the ones that resonate, and downloading the rendered MP4 for posting on TikTok / Reels / Shorts.

## Correct behavior

Lives entirely under `/label/content-factory-v2`:

- **Create tab → Fan brief preset.** User picks artist + source (`Live performance` | `Podcasts`) + clip count (1–20), hits **Create**. POST `/functions/v1/fan-briefs-generate-on-demand` returns `{ jobId, status: 'queued' }` (HTTP 202). The view flips to Review and N optimistic placeholders prepend to the queue with `status='generating'`, `fanBriefJobId`, `jobIndex 0..N-1`.
- **Review tab.** Each placeholder reconciles in real time off `fan_brief_jobs` UPDATE events. `jobStage` text updates live; on `complete`, placeholders swap to real `pending` brief cards (matched by `jobIndex` against `produced_brief_ids`); on `failed`, they go red with `error_message`.
- **Approve / Tune / Kill.** Standard QueueCard actions on real briefs. Kill cascades to the backend by writing `fan_briefs.status='archived'` so the row doesn't reappear on the next sync.
- **Briefs from the wizard land at `status='approved'`**, not pending — the wizard's intent replaces the pending-review step. The CLI / cron path is unchanged and still defaults to `pending`.

## Edge cases

- **Pipeline produces fewer briefs than requested** (e.g., 3 of 5): 3 placeholders swap to real cards, surplus 2 are dropped silently. Toast surfaces the partial count via the worker's `current_stage`.
- **Pipeline produces zero briefs** (no segments found): all placeholders flip to `failed` with a friendly message. User can re-trigger immediately (zero-result jobs do not trip the 1-hour cooldown).
- **429 cooldown / in-flight cap:** wizard surfaces a toast like "Already running for this artist + source. Wait a minute and retry." User keeps their wizard selections (no reset on error).
- **Browser refresh mid-job:** queue is in-memory only — placeholders are lost, but the briefs still land in `fan_briefs` and reappear next time the Review tab is loaded.
- **Rendering in progress:** `rendered_clip_url` is null → spinner placeholder in the 9:16 frame; the render worker writes the URL back when done.
- **No labelId (Paul-only / impersonation off):** wizard hidden, mock Select + textarea fallback shown instead.

## Status workflow

`pending → approved → posted` with `skipped`, `modified`, `archived` as side branches. Wizard-generated briefs skip pending and start at `approved`. Modifying writes `modified_hook` without changing status. Kill is soft (`status='archived'`) plus storage cleanup downstream.

## Data flow (backend)

1. **Discover** — `scripts/fan-briefs/discover.ts` hits ScrapeCreators YouTube search for `{artist} interview` (or live-performance variant), filters >10min, fetches metadata + timestamped transcripts, upserts into `content_catalog` (dedup on `source_url` UNIQUE).
2. **Segment** — Two-stage analysis (Claude on transcript, Gemini fallback for video-only) emits rows into `content_segments`: `transcript_excerpt`, `moment_summary`, `moment_type`, `fan_potential_score`, plus 768-dim embedding + tsvector for `segment_hybrid_search()` (RRF fusion of BM25 + cosine).
3. **Generate** — Briefs land in `fan_briefs` with `hook_text`, `caption`, `format_recommendation`, `platform_recommendation[]`, `sound_pairing`, `why_now`, `confidence_score`, plus source ref (`source_url`, `timestamp_start/end`, `youtube_timestamp_url`).
4. **Render** — A long-running Deno worker (`scripts/fan-briefs/render-worker.ts`) subscribes to Supabase Realtime for approved briefs. On approval it extracts a 9:16 MP4 with hook overlay + karaoke captions into the `fan-brief-clips` storage bucket; `rendered_clip_url` is written back. If the worker is not running, approvals stack up in the backlog and render on next startup.

## Key files

- `src/pages/label/ContentFactoryV2.tsx` — `handleCreateJob`, Realtime channel management, `reconcileJobUpdate`, `statusFallbackLabel`, the kill-cascade to `fan_briefs.status='archived'`
- `src/components/content-factory-v2/CreateView.tsx` — wizard inputs + endpoint POST + URL persistence (`fbArtist` / `fbSource` / `fbCount`)
- `src/components/content-factory-v2/ReviewView.tsx` — `QueueCard` branches for `generating` / `failed` / `pending`
- `src/components/content-factory-v2/types.ts` — `QueueStatus`; `QueueItem` extended with `fanBriefId`, `fanBriefJobId`, `jobIndex`, `jobStage`, `jobError`
- `src/types/fanBriefs.ts` — `FanBrief`, `ContentSegment`, `ContentCatalogItem`, `BriefStatus`, `PeakEvidence`
- `src/hooks/useLabelArtists.ts` — roster dropdown source for the wizard
- `migrations/fan-briefs-schema.sql` — `content_catalog`, `content_segments`, `fan_briefs`, `segment_hybrid_search()`, `fan-brief-clips` bucket
- Backend: `scripts/fan-briefs/discover.ts`, `mine-live-signals.ts`, `generate-briefs.ts`, `render-worker.ts`, `render-clip.ts`

## Permissions

All three tables (`content_catalog`, `content_segments`, `fan_briefs`) are RLS-scoped to `label_id` via `user_profiles`. Authenticated label members can SELECT/INSERT/UPDATE/DELETE; service_role bypasses RLS for the backend pipeline. Anon role has no access. Storage bucket `fan-brief-clips` is public-read so the `<video>` tag can stream without signed URLs; writes are service-role only via the render worker.

## Backend reference

See `wavebound-backend/docs/features/fan-briefs-on-demand.md` for the full endpoint contract, validation order, worker design, and operational notes.

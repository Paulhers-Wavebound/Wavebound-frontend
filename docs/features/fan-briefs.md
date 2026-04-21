# Fan Briefs

AI-generated content briefs for an artist's fan accounts. The pipeline mines long-form source material (YouTube interviews, podcasts), extracts the moments most likely to land as fan content, and presents them as ready-to-post brief cards a social manager can review, tweak, approve, and download as 9:16 clips.

## Who uses it and why

Content & Social teams running fan accounts on behalf of label-signed artists. They open this page to review the day's AI-suggested clips, edit the hook copy in their own voice, approve the ones that resonate, and download the rendered MP4 for posting on TikTok / Reels / Shorts.

## Correct behavior

- Route lives at `/label/fan-briefs` (sidebar entry with Sparkles icon, gated by `PreviewGate` until enabled per label)
- Two tabs split by lifecycle, with count chips next to each label:
  - **Content** — `status='pending'` and no `rendered_clip_url`. Sorted by `confidence_score DESC`, capped at 50.
  - **Clips** — `status='approved'`. Sorted by `approved_at DESC`, capped at 50.
- The page polls every 30s so a brief moves from "Rendering..." to a playable clip without a manual refresh
- Each card shows: artist handle, confidence % chip (tiered: <70 amber, 70–84 blue, ≥85 green), status badge, source video preview, hook (editable), tag row (format / platforms / sound pairing), source title + timestamp range + `why_now` reasoning, "Chat about this" handoff to the assistant, and a "Details" button that opens the full `BriefDetail` modal
- Content tab supports **batch actions**: each card shows a selection checkbox; a sticky bar appears at the bottom of the viewport with "Approve N / Skip N / Clear" once one or more briefs are selected. Selection clears automatically when the user switches tabs or the label changes.
- `BriefDetail` modal (opened via the Details button) shows the full `why_now`, caption, source link + "Open on YouTube" deep link, tag row, editable hook, and — if `segment_id` is linked — the transcript excerpt, speaker, moment type, and summary pulled from `content_segments`. Approve / Skip / Chat actions are available from the modal footer.
- **Content mode** card shows a YouTube iframe scoped to `start`/`end` timestamps + a Replay button
- **Clips mode** card shows a 270×480 `<video>` of the rendered MP4 + Download button + collapsible source preview, OR a "Rendering..." spinner if `rendered_clip_url` is still null
- Action buttons (Content tab): **Approve** (writes `status='approved'` + `approved_at`, optimistically moves card to Clips, kicks the render off backend), **Modify Hook** (inline textarea, Enter saves to `modified_hook`, status stays `pending`), **Skip** (writes `status='skipped'`, removes from list)
- Action buttons (Clips tab): confirmable **Remove** (writes `status='archived'` and deletes the rendered MP4 from the `fan-brief-clips` storage bucket)
- "Chat about this" pre-fills `/label/assistant` with the brief details and starts a new session

## Edge cases

- **No briefs yet:** Empty state with Sparkles icon and "No content to review. New briefs will appear here when the pipeline runs." (Content tab) or "No clips yet. Approve content to start rendering." (Clips tab)
- **Rendering in progress:** `rendered_clip_url` is null → spinner placeholder in the 9:16 frame, polling refreshes it on completion
- **Source has no timestamp:** `embedUrl` returns null → no embed renders, only the brief copy
- **Modified hook present:** Card displays `modified_hook` instead of `hook_text`, both content tab and clips tab
- **Storage delete fails:** DB row still archives, console warning only — the row is the source of truth
- **No label_id (admin not impersonating):** Both lists stay empty, no error

## Data flow

1. **Discover** — `scripts/fan-briefs/discover.ts` hits ScrapeCreators YouTube search for `{artist} interview`, filters >10min, fetches metadata + timestamped transcripts, upserts into `content_catalog` (dedup on `source_url` UNIQUE)
2. **Segment** — Two-stage analysis (Claude on transcript, Gemini fallback for video-only) emits rows into `content_segments`: `transcript_excerpt`, `moment_summary`, `moment_type`, `fan_potential_score`, plus 768-dim embedding + tsvector for `segment_hybrid_search()` (RRF fusion of BM25 + cosine)
3. **Generate** — Briefs land in `fan_briefs` with `hook_text`, `caption`, `format_recommendation`, `platform_recommendation[]`, `sound_pairing`, `why_now`, `confidence_score`, plus source ref (`source_url`, `timestamp_start/end`, `youtube_timestamp_url`)
4. **Render** — A long-running Deno worker (`scripts/fan-briefs/render-worker.ts`, local/background) subscribes to Supabase Realtime for approved briefs. On approval it extracts a 9:16 MP4 with hook overlay + karaoke captions into the `fan-brief-clips` storage bucket; `rendered_clip_url` is written back on the row and the spinner resolves on the next poll. If the worker is not running, approvals stack up in the backlog and render on next startup.

## Status workflow

`pending → approved → posted` with `skipped`, `modified`, `archived` as side branches. Approve writes `approved_at`. Modifying writes `modified_hook` without changing status (so the brief stays reviewable). Delete is soft (`status='archived'`) plus storage cleanup.

## Key files

- `src/pages/label/LabelFanBriefs.tsx` — Two-tab page, React Query polling, mutations, batch selection state
- `src/components/fan-briefs/BriefCard.tsx` — Card component (content / clips modes)
- `src/components/fan-briefs/BriefDetail.tsx` — Expanded modal with transcript + full hook editor
- `src/types/fanBriefs.ts` — `FanBrief`, `ContentSegment`, `ContentCatalogItem`, `BriefStatus`
- `src/components/coming-soon/mocks/FanBriefsMock.tsx` — Preview shown via `PreviewGate` for un-enabled labels
- `migrations/fan-briefs-schema.sql` — `content_catalog`, `content_segments`, `fan_briefs`, `segment_hybrid_search()`, `fan-brief-clips` bucket
- Backend: `scripts/fan-briefs/discover.ts` (Sprint 2 — ingestion)
- Backend: `scripts/fan-briefs/render-worker.ts` + `render-clip.ts` — Realtime-subscribed long-running Deno worker; must be running for approvals to produce clips
- Backend: Sprints 3–5 cover segment extraction, brief generation, and clip rendering

## Permissions

All three tables are RLS-scoped to `label_id` via `user_profiles`. Authenticated label members can SELECT/INSERT/UPDATE/DELETE; service_role bypasses RLS for the backend pipeline. Anon role has no access. Storage bucket `fan-brief-clips` is public-read so the `<video>` tag can stream without signed URLs; writes are service-role only via the render worker.

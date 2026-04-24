# 2026-04-23 — Fan Briefs: Live Performance support

## What changed

Added Live Performance card variant to the existing `/label/fan-briefs` feed without regressing interview briefs. All new UI is additive and gated on `content_type === 'live_performance'` (with a fallback path that detects live via `content_segments.peak_evidence` presence).

**Files modified**

- `src/types/fanBriefs.ts` — added `BriefContentType`, `RenderStyle`, `PeakComment`, `PeakEvidence`, `BriefSegmentJoin`. Extended `FanBrief` with `content_type`, `render_style`, and optional `content_segments` nested-join field.
- `src/integrations/supabase/types.ts` — regenerated (last regen was 2026-04-13, prior to the live-extension migration). Includes the new columns on `fan_briefs`, `content_catalog`, `content_segments` + unrelated drift from other landed migrations (artist*deletion_log, cf_jobs, matched_song*\*).
- `src/pages/label/LabelFanBriefs.tsx` — query select now pulls the nested join `content_segments(peak_evidence, hook_source, content_catalog(live_venue, content_type, title, duration_seconds))`. Added URL-backed filter pills (All / Interview / Live), venue sub-pill row (derived from loaded data, counted, sorted DESC), client-side filtering of content + clips lists, audit-modal state, empty-state copy that references filters.
- `src/components/fan-briefs/BriefCard.tsx` — additions gated on `isLive`:
  - Venue badge (muted palette per design rule "max 3 accent uses per viewport") + ⓘ audit trigger in the header.
  - "Why this moment" collapsible panel with top-3 fan comments; clicking a comment immediately calls `onModifyHook` with the truncated content.
  - Inline ✍️ "edited from fan comment" marker — deterministic on reload via `hookCameFromFanComment`.
  - Hook-edit subtitle explaining the comment-swap affordance.
  - Karaoke banner replacing the embed when `render_style='karaoke'`; Approve button stays enabled.
  - Deep-linked venue · timestamp below the source title.
  - Confidence-chip `title` tooltip showing the breakdown formula.

**Files added**

- `src/components/fan-briefs/venues.ts` — `VENUE_STYLES` palette (Grammys gold-amber, Tiny Desk warm terracotta, Fallon indigo, Kimmel teal, Colbert emerald, Live Lounge coral, SNL cherry, Coachella dusty pink, AMAs / VMAs / COLORS / VEVO / Official Channel / other fallbacks). `deriveVenue()` combines DB `live_venue` + title regex — essential because many `live_venue='official_channel'` rows need title-based disambiguation (Grammys / Coachella / AMAs live on official channels). `truncateFanComment()` strips YouTube timestamps, dangling `at`/`@`, truncates at a word boundary ≤ 60 chars, preserves fan voice (no sentence-case — per Paul's override). `isLiveBrief()`, `peakEvidenceOf()`, `hookCameFromFanComment()` helpers.
- `src/components/fan-briefs/BriefAuditModal.tsx` — shadcn Dialog (separate from `BriefDetail` — audit is read-only / spot-check, detail is action-taking; mixing them would muddy both). Header with venue chip, YouTube deep link, stat chip row (cluster_size · sum_likes · confidence · chapter_title? · chapter_duration?), full comment list (not truncated to 3), collapsible raw JSON in `<details>`.

## Why

Backend shipped `migrations/20260423_fan_briefs_live_extension.sql` the same day. Managers at Warner US need to review live-performance briefs (Grammys speeches, Tiny Desk banter, Fallon appearances) alongside interview briefs. Live briefs use crowd-timestamped fan comments as the peak signal instead of LLM-picked transcript moments — the audit modal exists so legal/QA can spot-check that the evidence backs the synthesized hook.

## What was tested

- `npx tsc --noEmit` — clean, exit 0.
- Supabase types regenerated; confirmed `fan_briefs.content_type`, `fan_briefs.render_style`, `content_catalog.live_venue`, `content_segments.peak_evidence`, `content_segments.hook_source` all appear in the new file.
- PostgREST nested join (`fan_briefs?select=*,content_segments(peak_evidence,content_catalog(live_venue,...))`) tested with service role — resolves cleanly; the nested `content_catalog` join works through the segment FK.
- Comment-to-hook transform sanity (manual trace): `"Chills when he hit that note at 2:35, I was NOT ready"` → `"Chills when he hit that note, I was NOT ready"` (timestamp + trailing fragment stripped). `"2:35-2:50 is the best 15 seconds of TV this year"` → `"is the best 15 seconds of TV this year"`.

## What to verify in browser (needs Paul's eyes)

1. Load `/label/fan-briefs` as a Warner US session → feed renders exactly as before for interview briefs (no regressions).
2. Click the **Live** pill → feed narrows. **Caveat below** — no live_performance fan_briefs exist yet.
3. The `?type=live` URL param round-trips on reload.

## 🟠 Important mismatch between prompt and reality

The backend prompt claimed _"Benson Boone (label: Warner US) has 3 live briefs ready"_ and referenced `fan_briefs.generation_context.peak_evidence`. Both are wrong:

- **Zero rows** in `fan_briefs` have `content_type='live_performance'` right now. The upstream pipeline has populated `content_catalog` (11 live videos for Boone: Fallon, Coachella, Grammys, Live Lounge, SNL, AMAs) and `content_segments.peak_evidence` (mined comment clusters with real top_comments — the Brian May / Coachella segment has 668 total likes across 3 comments). The **brief-synthesis step for live_performance has not been run**.
- `peak_evidence` lives on `content_segments`, not on `fan_briefs.generation_context`. The frontend reads it via the nested join, which is the canonical path anyway.

To actually see live briefs in the UI, run:

```bash
deno run --allow-net --allow-env scripts/fan-briefs/generate-briefs.ts \
  --artist bensonboone --content-type live_performance
```

(from `~/Projects/wavebound-backend`). That should insert ~11 live_performance briefs — one per catalog row with mined evidence.

## While I was in here — recommendations

Ranked by user impact:

1. **Run `generate-briefs.ts --content-type live_performance` for Benson Boone.** Without this, you can't verify the live card UX. Five-minute task. I can't run Deno scripts from the frontend repo directly; backend CLI.
2. **Add a "Revert to synthesized hook" button** on live cards when `modified_hook` is set. Single button that calls `onModifyHook(id, '')` (needs a small tweak on `handleModifyHook` to treat empty string as null-write). Useful if a manager clicks a fan comment by mistake.
3. **Upgrade the confidence tooltip to shadcn `<Tooltip>`.** I used the HTML `title` attribute — works but renders as the native browser tooltip (slow, ugly, cuts off). Shadcn Tooltip is already installed; twenty-line swap.
4. **Venue-level analytics.** Once the pipeline has produced ≥50 live briefs, a small "Approval rate by venue" chart on this page would show which venues produce briefs that actually get approved — strong signal for where to focus discovery.
5. **Regenerate types hook.** The generated types were 10 days stale and missed three recent migrations. Consider adding a `postinstall` script or a pre-commit hook that runs `npx supabase gen types typescript ...` when any `migrations/*.sql` file changes in the sibling backend repo. Low-lift, high-value — stale generated types silently drift into runtime null-deref bugs.

## Follow-up for backend-todo.md

- Backend should backfill `fan_briefs.content_type` for existing interview briefs (currently NULL for all rows). The frontend treats NULL as 'interview' via `isLiveBrief` but an explicit value avoids the ambiguity.
- Consider copying `content_segments.peak_evidence` into `fan_briefs.generation_context.peak_evidence` at brief-generation time. The nested join works today, but a single-table read is cheaper and more resilient to RLS changes on `content_segments` / `content_catalog`.

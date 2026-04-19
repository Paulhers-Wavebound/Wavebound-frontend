# Session Diary: Content tab Format Performance fallback

## What changed

- `src/hooks/useContentIntelligence.ts` — added `synthesizeFormatPerformance()` and `synthesizeContentDna()` helpers. When `artist_format_performance` rows are empty OR `artist_content_dna` row is null, the hook now derives them from `deep_research_jobs.content_analysis_data` (individual analyses, `category_performance`, `content_style_profile`, `summary`). The ContentTab component is unchanged — it just starts getting non-empty data.

## Why

Charlie Puth's Content tab rendered only Content Activity + TikTok Profile — the Format Performance section was hidden. Root cause: `artist_format_performance` and `artist_content_dna` are empty for him, and the section is gated on `rows.length > 0 || dna`. But `deep_research_jobs` for `charlieputh` has 90 videos scraped, 5 deep-analyzed, with `category_performance` and `content_style_profile` precomputed. That's enough raw material to fill the UI.

## What was tested

- `npx tsc --noEmit` — clean
- Playwright: `/label/artists/charlieputh?tab=content` now renders Format Performance with 4 formats (Selfie Performance, Personal/Lifestyle, Selfie Lip-Sync, Story), "5 videos analyzed · Avg Hook 8.0 · Genre: Pop · Mood: Happy" summary chips, and correct vs-median bars

## What to verify in browser

- **Other artists that weren't broken**: open an artist whose `artist_format_performance` IS populated (any roster artist with a recent agg run) and confirm the agg-table data still wins over the synthesized fallback (it does — I gated on `fmtRows.length > 0 ? ... : synthesized`).
- **vs-median multipliers**: Charlie's top video (193M views) against his median (3M) produces a 64x bar. That's accurate but visually dominant. Cap display at e.g. 10x with a "10x+" badge if that feels misleading — flag this if it does, I didn't want to change display semantics in this pass.
- **Formats with 1 video**: single-video formats show as full bars. Expected given the small sample (5 deep-analyzed). The existing "More" toggle surfaces hook/viral/engagement if available, and engagement will show "—" because `individual_analyses` doesn't include likes (no way to compute rate).

## Follow-ups in this same session

- **Bar scaling fix** (`ContentTab.tsx`): introduced a `barBaseline` that clamps to `3 × median(avgViews)` when `max > 3 × median`. Before: Selfie Performance (193M) at 100% compressed Personal/Lifestyle (26M) to a 13% sliver. After: outlier still hits 100%, but the other formats get proportional widths against the clamped baseline.
- **Sweep**: 9 artists currently have `deep_research_jobs.content_analysis_data` but no `artist_format_performance` row: `alexwarren`, `bensonboone`, `brunomars`, `charlieputh`, `dontolivermusic`, `fredagainagain`, `imsorrymissjacksonuhh`, `itsbellakayy`, `sombr`. All were broken until today's synthesis fallback landed. Handoff updated with this list.

## While I was in here

- `synthesizeContentDna` populates `videosAnalyzed` from `summary.videos_deep_analyzed` (5), not `videos_scraped` (90). The "videos analyzed" label is accurate to what's behind the bars — the 5 deep-analyzed sample — not the full 90-video scrape.
- I did NOT backfill `signatureStyle`, `topHooks`, `adContentPct`, `avgViralScore`, or the vs-median sub-fields on the synthetic DNA. Those require either the aggregation job or more arithmetic on `individual_analyses`. The UI handles null for all of them.
- Backend handoff written at `docs/handoffs/2026-04-18_backfill-format-performance-dna.md` — the real fix is to run the aggregation jobs for all artists in the Columbia roster, not leave this as a permanent fallback.

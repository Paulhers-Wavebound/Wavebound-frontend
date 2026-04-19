# Backend handoff — Backfill artist_format_performance + artist_content_dna

**Date:** 2026-04-18
**Requested by:** Paul noticed on Charlie Puth's Content tab that "it doesn't show the content types / formats and what performs well"
**Frontend workaround shipped:** yes (synthetic derivation from `deep_research_jobs`)

## Problem

Several artists on the Columbia roster have rich `deep_research_jobs.content_analysis_data` (90 videos scraped, 5 deep-analyzed, full `category_performance` + `content_style_profile`) but their derived aggregation tables are empty:

- `artist_format_performance` → 0 rows for `charlieputh`
- `artist_content_dna` → 0 rows for `charlieputh`

The frontend Content tab's Format Performance section is gated on those tables, so it rendered blank.

## Frontend mitigation (already deployed)

`src/hooks/useContentIntelligence.ts` now synthesizes both when the real tables are empty, reading from `deep_research_jobs.content_analysis_data.{summary, category_performance, content_style_profile, individual_analyses}`. This is a **fallback**, not a replacement — if the agg tables get populated, the real data wins.

## What we actually need from backend

1. **Identify artists with `deep_research_jobs` but no aggregation row.** Rough SQL:
   ```sql
   SELECT drj.artist_handle
   FROM deep_research_jobs drj
   LEFT JOIN artist_format_performance afp ON afp.artist_handle = drj.artist_handle
   WHERE drj.content_analysis_data IS NOT NULL
     AND afp.artist_handle IS NULL
   GROUP BY drj.artist_handle;
   ```
2. **Run the aggregation job** that populates `artist_format_performance` + `artist_content_dna` for each. (Whatever script/Edge Function owns those tables — I don't know which one.)
3. **Verify**: after backfill, reload `/label/artists/charlieputh?tab=content` — the Format Performance card should render the SAME data it's rendering now, but sourced from `artist_format_performance` instead of the synthetic fallback. Visual should be identical minus one thing: engagement rate column will be populated (the synthetic version leaves it null because `individual_analyses` doesn't include likes).

## What the frontend synthesis does NOT cover

These stay null in the fallback because the raw data doesn't carry them:

- `avgEngagementRate` per format — no `likes` field on `individual_analyses`
- `topHooks` — we have `hook_summary` per video but not a distribution
- `adContentPct` — we have `is_ad` per video but I didn't aggregate
- `avgViralScore` on contentDna (we do populate it per-format)
- `signatureStyle` — free-text, no source in the raw blob

The agg job presumably has access to the broader video corpus beyond the 5 deeply-analyzed ones, so it can compute these properly. **Please don't try to match the synthetic output exactly — the real agg output should be richer.**

## Full list of affected handles (as of 2026-04-18)

9 artists had `deep_research_jobs.content_analysis_data` populated but no row in `artist_format_performance`:

- `alexwarren`
- `bensonboone`
- `brunomars`
- `charlieputh`
- `dontolivermusic`
- `fredagainagain`
- `imsorrymissjacksonuhh`
- ~~`itsbellakayy`~~ — false positive: `content_analysis_data` is set but `individual_analyses` is `[]`, so there's nothing to aggregate. The frontend synthesis correctly produces no rows for this case (the Format Performance section stays hidden, which matches reality).
- `sombr`

(Count: 36 with deep research vs 28 with agg rows.) Real backfill candidates: 8.

**Status (2026-04-18, after backend dbt run):** Resolved. `artist_format_performance` is now 35 artists / 405 rows; `artist_content_dna` is 35. Charlie Puth verified with real `avg_engagement_rate` populated (0.112 / 0.666 / 0.130 / 0.302).

## Sample evidence (Charlie Puth)

- Entity: `c47cb9e5-d7b2-4020-9002-dab5320b5371`
- Handle: `charlieputh`
- `deep_research_jobs` has 90 videos scraped, 5 deep-analyzed with full categories/moods/genres/viral scores
- Top format by views: "Selfie Performance" (1 video, 193M views — the Brazil post)
- Dominant genre: Pop (80%), R&B (20%)
- Dominant mood: Happy, Energetic (40% each)

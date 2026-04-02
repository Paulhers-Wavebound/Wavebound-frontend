# Backend TODO — From Frontend Sessions

## "Not Visible" Demographics Parsing (2026-04-02)

**Problem:** The v2 classification splits the `"Not Visible"` creator profile string into `age="Not"` and `gender="Visible"` when building `age_breakdown` and `gender_breakdown`. This is a parsing artifact — the frontend currently filters these out, but it's fragile.

**Current frontend workaround:** Filters `age !== "Not"` and `gender !== "Visible"` from demographics, sums `"Not Visible"` profile entries for a footnote.

**Recommended fix:** In the synthesis step (WF-SI-3), emit a top-level `not_visible_count: number` field in `creator_demographics` instead of including "Not Visible" as a profile entry. Exclude "Not Visible" entries from `age_breakdown` and `gender_breakdown` entirely at the source.

**Impact:** Low urgency — frontend handles it, but any new parsing edge case (e.g., "Partially Visible") could slip through the filter.

## Expose `unique_creators` in Analysis Response (2026-04-02)

**Problem:** The Sound Health Strip wants to show a creator count (e.g., "196 creators"), but the API only returns `user_count` (total videos on the sound from TikTok) and `videos_analyzed`. Neither is an actual unique creator count.

**Current frontend workaround:** Falls back to `userCount` for the "creators" stat, which is really the total video count on the sound — misleading.

**Recommended fix:** Add a `unique_creators: number` field to the analysis JSONB (or derive it from the `creator_tiers` sum of `count`). The synthesis step already has per-video creator handles — just `COUNT(DISTINCT handle)`.

**Where it's used:** `SoundHealthStrip.tsx` — the compact stat strip below the song header.

**Impact:** Medium — label execs see "196 creators" which may actually be "196 total videos on sound". Confusing metric.

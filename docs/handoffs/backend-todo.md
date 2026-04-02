# Backend TODO — From Frontend Sessions

## ~~Fix `get-plan-variants` GIF Loading — Silent Failure (2026-04-02)~~ FIXED 2026-04-02

**Fixed:** Deployed `get-plan-variants` v5. Three bugs resolved: (1) catch block now logs errors via `console.error`, (2) `Array.isArray()` guards on `individual_analyses` and `rag_inspiration`, (3) out-of-bounds GIF indices (e.g., `v100` when only 88 analyses exist) no longer crash the block — they return `0x` metadata gracefully. Tested on `thechainsmokers` (33 GIFs now returned, was 0) and `presleylynhaile` (10 GIFs, unchanged).

**Problem:** `get-plan-variants` returns `gifs.available: []` for artists that have GIFs in storage. The catch block at line 190 of `edge-functions/get-plan-variants.ts` swallows all errors, so the function returns 200 with empty GIFs instead of surfacing the issue.

**Evidence:** `thechainsmokers` has 12 GIFs in `gifs/thechainsmokers/` (v0, v100, v1001-v1014) confirmed via direct storage API call, but `get-plan-variants?artist_handle=thechainsmokers` returns `gifs.available: []`. The `get-content-pool` endpoint works fine and returns 88 own videos (12 with GIFs) for the same artist.

**Suspected root cause:** Something in the try block (lines 109-193) throws before reaching the `available.push()` calls. Most likely candidates:

1. **`jobData.content_analysis_data` is null/missing** — The query at line 62-64 selects `content_analysis_data` from `deep_research_jobs`, but the latest job for this artist might not have that column populated. If `contentAnalysis.individual_analyses` throws instead of returning `[]`, the entire GIF block silently fails.

2. **`sortedAnalyses` filtering/sorting throws** — The `.filter((v) => (v.views as number) > 0)` on line 136 could throw if an analysis entry has unexpected structure (e.g., `views` is a string or null causing a type coercion issue in the sort comparator).

3. **`weeklyData` is null** — Line 148 does `weeklyData?.rag_inspiration || []` which is safe, but if `weeklyData` itself came back in an unexpected format (not null, but also not an object with rag_inspiration), it could cause downstream issues.

**Fix:**

1. Add `console.error` logging inside the catch block so failures are visible in Edge Function logs:

   ```typescript
   } catch (err) {
     console.error("GIF metadata build failed:", err);
     // Keep empty payload as fallback
   }
   ```

2. Add defensive guards at the most likely failure points:

   ```typescript
   // Line 132-133: Guard against missing content_analysis_data
   const contentAnalysis = jobData.content_analysis_data || {};
   const analyses: Array<Record<string, unknown>> = Array.isArray(
     contentAnalysis.individual_analyses,
   )
     ? contentAnalysis.individual_analyses
     : [];
   ```

3. Consider whether `sortedAnalyses[idx]` is the right lookup. For `idx=100` (file `v100_*.gif`), it tries `sortedAnalyses[100]` which is almost certainly out of bounds for the sorted array. The idx from the filename should probably map to the original video index, not the sorted position. The sorted array reorders by multiplier, so `sortedAnalyses[0]` is the _highest multiplier_ video, not video #0. This is likely a logic bug — should use the unsorted `analyses` array instead, or build a separate index-to-analysis lookup.

**Impact:** High — the entire GIF swap feature in the 30-day editor depends on this. Frontend has a workaround (falls back to `buildGifMap` client-side storage scan), but the GIF strip at the top of the editor and the `gifs.removed`/`gif_overrides` state won't work without this endpoint returning data.

**Files:** `edge-functions/get-plan-variants.ts` lines 109-193. Deploy with:

```bash
supabase functions deploy get-plan-variants --project-ref kxvgbowrkmowuyezoeke --use-api
```

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

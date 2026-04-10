# Backend TODO — From Frontend Sessions

## Add pg_trgm Index to dbt `artist_score` Post-Hook (2026-04-09)

**Priority:** HIGH — index was added manually and will be dropped on next dbt rebuild.

**Problem:** The Expansion Radar artist search was timing out because:

- `wb_entities` has 1.6M rows — ilike `%term%` can never finish in the 3s/8s PostgREST statement timeout
- `artist_score` has 22K rows but still needed a trigram index for sub-second ilike performance

**What was done:**

- Enabled `pg_trgm` extension
- Created `idx_artist_score_name_trgm` GIN index on `artist_score.canonical_name`
- Frontend switched from `wb_entities` to `artist_score` for the ArtistSelector search

**What's needed:** Add a dbt post-hook so the index survives table rebuilds:

```sql
-- In dbt/wavebound/models/layer2_intelligence/artist_score.sql
{{
  config(
    materialized='table',
    schema='public',
    post_hook="CREATE INDEX IF NOT EXISTS idx_artist_score_name_trgm ON {{ this }} USING gin (canonical_name gin_trgm_ops);"
  )
}}
```

---

## Truncate `globe-data` Flow Paths (2026-04-09)

**Priority:** LOW — performance optimization, not a bug.

**Problem:** The `globe-data` edge function returns ~170KB of JSON. The `flows` array is the biggest contributor — each flow's `path` array contains every country observation (sometimes 40+ entries per flow × 20 flows). The frontend only uses the top 8 flows and renders arcs between consecutive path entries.

**Fix:** In the edge function, limit each flow's `path` to the 5-10 most recent entries, and limit `flows` to top 10-15 by velocity/relevance. This would reduce the payload by ~60-70%.

---

## Add `mode=arbitrage` Route to `globe-data` Edge Function (2026-04-07)

**Priority:** MEDIUM — frontend falls back to mock data, but real arbitrage data would be much better.

**Problem:** The `globe-data` edge function handles `?country=`, `?genre=`, and the default globe view, but has no branch for `?mode=arbitrage`. When the frontend calls `globe-data?mode=arbitrage&label_id=...`, the function ignores the `mode` param and returns regular globe data (200 OK with wrong shape). The frontend now validates the response and falls back to mock data when `leaderboard` is missing.

**What the frontend expects:** An `ArbitrageData` response:

```typescript
{
  leaderboard: Array<{
    country_code: string;
    country_name: string;
    arbitrage_score: number; // 0-100
    arbitrage_label: "HIGH" | "MEDIUM" | "LOW";
    roi_vs_us: number; // multiplier, e.g. 3.2
    avg_cpm_blended: number; // USD
    total_songs: number;
    active_songs: number;
    dominant_genre: string;
    dominant_genre_pct: number; // 0-100
  }>;
  hero_insight: {
    country_name: string;
    country_code: string;
    roi_vs_us: number;
    avg_cpm: number;
    active_songs: number;
    headline: string;
  }
  opportunity_buckets: {
    high: number;
    medium: number;
    low: number;
  }
  us_baseline_cpm: number;
}
```

**Recommended approach:** Add an `if (url.searchParams.get("mode") === "arbitrage")` branch in `globe-data.ts` that calls a new `get_arbitrage_data(p_label_id)` RPC. The RPC should compute per-country CPM ratios vs US baseline from ad cost data and aggregate song counts per market.

**Frontend workaround deployed:** Validates response shape; falls back to `MOCK_ARBITRAGE_DATA` (20 markets) when the API returns globe data instead of arbitrage data.

**Files:** `edge-functions/globe-data.ts` — add new branch before the default globe route (line ~217)

---

## Active Markets Missing `estimated_monthly_streams` in Expansion Radar (2026-04-07)

**Priority:** HIGH — every active market tooltip shows "0 streams" because the field is missing.

**Problem:** In `edge-functions/expansion-radar-v2.ts` lines 229-266, the `activeMarkets` array is built from `geographic_footprint` which doesn't have `estimated_monthly_streams`. The field IS included for expansion opportunities (line 322 via `opp2.estimated_monthly_streams`), but for active markets it's never set — even though `oppData` (from `opportunityByCountry`) is already looked up and used for other fields like `discovery_divergence`.

**Fix:** Add two lines inside the active markets push block (~line 264):

```typescript
// Add after "recommended_action" line:
estimated_monthly_streams: oppData?.estimated_monthly_streams || null,
estimated_revenue_monthly: oppData?.estimated_revenue_monthly || null,
```

**Frontend workaround deployed:** The frontend now falls back to `chart_streams` (from geographic_footprint) when `estimated_monthly_streams` is missing, and hides the streams text entirely when both are 0. But the proper fix is to include the field from `oppData`.

**Files:** `edge-functions/expansion-radar-v2.ts` lines 229-266

---

## Pre-Breakout Alert Endpoint for Sidebar Badge (2026-04-07)

**Need:** A lightweight edge function that returns the count of pre-breakout signals for all roster artists in a label. This powers a sidebar badge on the Expansion Radar nav item showing "3 pre-breakout signals detected" before the user even opens the page.

**Proposed endpoint:** `GET /functions/v1/expansion-alerts?label_id=<uuid>`

**Response:**

```json
{
  "pre_breakout_count": 3,
  "markets": ["FR", "DE", "AU"],
  "updated_at": "2026-04-07T12:00:00Z"
}
```

**Why it needs backend:** `wb_observations_geo` requires service_role key (no RLS policies). Can't query directly from frontend.

**Frontend ready:** Sidebar already has badge infrastructure. Once this endpoint exists, add a `usePreBreakoutAlerts(labelId)` hook that polls every 5 minutes and shows a count badge on the Expansion Radar sidebar item.

---

## Signal Feed Real-Time Data (2026-04-07)

**Need:** An edge function that returns recent geo observation spikes for the signal feed panel.

**Query:** `wb_observations_geo WHERE z_score > 2.0 AND observed_at > NOW() - INTERVAL '48 hours'` (from the SignalFeed TODO comment).

**Current state:** SignalFeed now derives signals from the V2 expansion data (pre-breakouts, surging markets, spillover predictions). Once this endpoint exists, the feed can show real-time geo spikes across all artists, not just the currently selected one.

---

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

## Inline Source Citations in Label Chat (2026-04-02)

**Problem:** Label execs need to trust the data in assistant responses. The frontend now shows source badges at the top of responses ("Sources: Roster Data, Artist KB"), but inline citations after specific claims would be much higher trust.

**What the frontend supports:** The `SourceTagReplacer` component in `MessageList.tsx` scans rendered responses for `[Roster Data]`, `[Artist KB]`, `[Viral DB]`, `[Sound Intel]`, `[Alerts]`, and `[Web]` bracket patterns and renders them as styled inline badges (small, muted, monospace). CSS class: `.inline-source-tag` in `index.css`.

**Recommended fix:** Add a system prompt instruction in `edge-functions/label-chat.ts` asking Claude to include inline source tags after data-heavy claims. Example prompt addition:

```
When citing specific metrics, data points, or facts from tool results, include a source tag in brackets after the claim. Use these exact labels:
- [Roster Data] for metrics from search_roster
- [Artist KB] for data from search_artist or search_all_artists
- [Viral DB] for data from search_videos
- [Sound Intel] for data from search_sounds
- [Alerts] for data from get_alerts
- [Web] for information from web_search

Example: "Harry's engagement rate is 31.3% [Roster Data] and her selfie lip-syncs average 4.43x the base [Artist KB]."

Only tag key data points — not every sentence. 2-4 tags per response is ideal.
```

**Frontend readiness:** Fully ready. The regex replacer and CSS are deployed. Once the prompt includes these patterns, they'll render automatically as styled badges.

**Impact:** High trust signal for label executives who forward AI answers to their teams.

## Sound Intelligence V2 — Return New Data from `get-sound-analysis` (2026-04-02)

**Priority:** HIGH — Frontend V2 redesign is deployed but these fields are empty until the backend populates them.

**What the frontend expects in the analysis JSON:**

### 1. `spotify_snapshots: SpotifySnapshot[]`

```typescript
{ date: string; monthly_listeners: number; streams?: number; playlist_count?: number }
```

Used by: `ConversionChart.tsx` — dual-axis chart overlaying TikTok velocity + Spotify monthly listeners. If empty, chart degrades gracefully to velocity-only.

**Source:** Query `spotify_snapshots` table (or whatever it's called) filtered by `sound_id` / `track_name`. Return sorted by date ascending.

### 2. `playlist_tracking: PlaylistTracking[]`

```typescript
{ playlist_name: string; playlist_id: string; action: "added" | "removed"; date: string; followers: number; curator?: string; position?: number }
```

Used by: `PlaylistActivityFeed.tsx` — timeline of Spotify playlist adds/removes. Shows placeholder when empty.

**Source:** Query `playlist_tracking` table filtered by sound/track. Return sorted by date descending.

### 3. `spark_score` per-format and per-video

- `FormatBreakdown.spark_score: number` — Average of `sound_scan_videos.spark_score` grouped by format
- `TopVideo.spark_score: number` — Direct from `sound_scan_videos.spark_score` for that video

Used by: `FormatBreakdownTable.tsx` (new "Spark" column) and `CreatorActionList.tsx` (color-coded badge per creator).

**Source:** `sound_scan_videos.spark_score` already exists per the V2 plan. In the synthesizer:

```sql
-- Per-format average
SELECT format, AVG(spark_score) as spark_score FROM sound_scan_videos WHERE job_id = $1 GROUP BY format;
-- Per top video
SELECT spark_score FROM sound_scan_videos WHERE id = $video_id;
```

### 4. `shazam_snapshots: ShazamSnapshot[]` (optional, Phase 4)

```typescript
{ date: string; shazam_count: number; country?: string }
```

Not rendered yet — just pass through if available.

**Files to modify:** `edge-functions/get-sound-analysis.ts` (add the new arrays to the response JSON) and the synthesizer that builds the analysis JSONB.

**Frontend types ready at:** `src/types/soundIntelligence.ts`

## `subscribe-sound` Must Set `label_id` on Subscription Row (2026-04-03)

**Problem:** The `sound_subscriptions` table has a `label_id` column and an RLS policy "Label members see shared subscriptions" that filters by `label_id IN (SELECT label_id FROM user_profiles WHERE user_id = auth.uid())`. If `subscribe-sound` doesn't set `label_id` when inserting the subscription row, other label members won't be able to see shared subscriptions.

**Current state:** The `subscribe-sound` edge function receives a JWT. It should look up the user's `label_id` from `user_profiles` and write it into the `sound_subscriptions.label_id` column on INSERT.

**Impact:** Medium — the "Users manage own subscriptions" policy (filtered by `user_id = auth.uid()`) ensures users can always see their own subscriptions. But the label-scoped SELECT policy won't return anything unless `label_id` is populated, which blocks any future "team subscriptions" or shared portfolio features.

**Fix:** In `subscribe-sound`, after authenticating the JWT, query `user_profiles.label_id` and include it in the INSERT:

```typescript
const { data: profile } = await supabaseAdmin
  .from("user_profiles")
  .select("label_id")
  .eq("user_id", user.id)
  .single();

await supabaseAdmin.from("sound_subscriptions").insert({
  user_id: user.id,
  job_id: body.job_id,
  label_id: profile?.label_id,
  is_own_sound: body.is_own_sound ?? true,
  notes: body.notes,
});
```

**Files:** `edge-functions/subscribe-sound.ts`

## Persist Chat Image Attachments (2026-04-04)

**Problem:** When a user sends an image with a label-chat message, the image preview only lives in frontend local state. If the user refreshes the page, the chat history loads from `chat_messages` and the image is gone — the user sees their text but not the screenshot they attached.

**Recommended fix:** Two options, in order of preference:

1. **Supabase Storage + metadata column** — Upload the image to a `chat-attachments/` bucket, store the resulting public URL in a `metadata` JSONB column on `chat_messages`. Frontend reads `metadata.image_url` when rendering historical messages. This is the clean solution and keeps the DB small.

2. **Inline base64 in metadata** — Store the base64 data URL directly in `metadata.image_preview`. Quick to implement but inflates the DB — a 5MB image becomes ~6.7MB of text in the row. Only viable if images are rare and small.

**Schema change needed:**

```sql
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
```

**Frontend readiness:** The `Message` interface already has `image?: string` and `MessageList` renders it. Just needs the DB sync in `useChatSessions` to read `metadata.image_url` and populate the field.

**Impact:** Medium — power users who reference earlier screenshots in a conversation will see missing images. Low frequency for now since image upload just shipped.

## Add Platform IDs & Relationships Daily Accumulation (2026-04-04)

**Problem:** The Data Totals section now shows daily pace projections for observations, geo, and entities. But `wb_platform_ids` and `wb_entity_relationships` have no daily intake data, so those two cards cannot show projections.

**Recommended fix:** Add four new fields to `get_admin_health_extended()` in the DAILY ACCUMULATION section:

```sql
'platform_ids_today', (SELECT COUNT(*)::bigint FROM wb_platform_ids WHERE created_at >= CURRENT_DATE),
'platform_ids_yesterday', (SELECT COUNT(*)::bigint FROM wb_platform_ids WHERE created_at >= CURRENT_DATE - 1 AND created_at < CURRENT_DATE),
'relationships_today', (SELECT COUNT(*)::bigint FROM wb_entity_relationships WHERE created_at >= CURRENT_DATE),
'relationships_yesterday', (SELECT COUNT(*)::bigint FROM wb_entity_relationships WHERE created_at >= CURRENT_DATE - 1 AND created_at < CURRENT_DATE)
```

Then in `admin-health.ts`, pass them through in the accumulation object.

**Frontend readiness:** `AccumulationData` type already has the optional fields. Once the API returns them, add entries to `ACCUMULATION_KEY_MAP` and `DAILY_TARGETS` in `constants.ts` and the projection UI lights up automatically.

**Impact:** Low urgency — cosmetic enhancement for 2 of 5 cards.

## Ops Dashboard — New RPC Sections for `get_admin_health_extended()` (2026-04-06)

**Priority:** HIGH — Frontend components are built and deployed, waiting for backend data.

The System Health page has been redesigned as an ops dashboard. The frontend renders 6 new components (MorningBriefing, ConcurrentScrapers, ApiQuotaGauges, PlatformCoverageTrend, UnresolvedEntitiesCard, CronGapDetection) and the edge function (`admin-health.ts`) already extracts and passes through the new fields. All that's needed is adding the queries to the RPC function.

### Required Index

```sql
CREATE INDEX IF NOT EXISTS idx_wb_pid_linked_at ON wb_platform_ids(linked_at DESC);
```

### 1. SC Credit History (`sc_credit_history`)

Last 50 successful SC scraper runs with `credits_remaining` from metadata (7-day window). All SC scrapers already write this field to `scraper_runs.metadata`.

```sql
'sc_credit_history', COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'scraper_name', t.scraper_name,
    'completed_at', t.completed_at,
    'credits_remaining', (t.metadata->>'credits_remaining')::int,
    'api_calls', COALESCE((t.metadata->>'api_calls')::int, t.rows_inserted)
  ) ORDER BY t.completed_at DESC)
  FROM (
    SELECT scraper_name, completed_at, metadata, rows_inserted
    FROM scraper_runs
    WHERE status = 'success'
      AND metadata->>'credits_remaining' IS NOT NULL
      AND completed_at >= NOW() - INTERVAL '7 days'
    ORDER BY completed_at DESC
    LIMIT 50
  ) t
), '[]'::jsonb)
```

### 2. YouTube Quota History (`yt_quota_history`)

Last 7 YouTube API runs with `quota_units_used` from metadata. `scrape-youtube-api.ts` already writes this.

```sql
'yt_quota_history', COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'completed_at', t.completed_at,
    'quota_units_used', (t.metadata->>'quota_units_used')::int
  ) ORDER BY t.completed_at DESC)
  FROM (
    SELECT completed_at, metadata
    FROM scraper_runs
    WHERE scraper_name = 'free_youtube_api'
      AND status = 'success'
      AND completed_at >= NOW() - INTERVAL '7 days'
    ORDER BY completed_at DESC
    LIMIT 7
  ) t
), '[]'::jsonb)
```

### 3. Platform ID Trend (`platform_id_trend`)

Per-platform totals + 7-day adds from `wb_platform_ids`. Needs the `linked_at` index above.

```sql
'platform_id_trend', COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'platform', t.platform,
    'total', t.total,
    'added_7d', t.added_7d
  ))
  FROM (
    SELECT platform,
           COUNT(*)::int as total,
           COUNT(*) FILTER (WHERE linked_at >= NOW() - INTERVAL '7 days')::int as added_7d
    FROM wb_platform_ids
    GROUP BY platform
    ORDER BY total DESC
  ) t
), '[]'::jsonb)
```

### 4. Platform ID Daily (`platform_id_daily`)

Daily `linked_at` counts by platform for sparkline charts (7-day window).

```sql
'platform_id_daily', COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'platform', t.platform,
    'day', t.day,
    'count', t.cnt
  ))
  FROM (
    SELECT platform, linked_at::date as day, COUNT(*)::int as cnt
    FROM wb_platform_ids
    WHERE linked_at >= NOW() - INTERVAL '7 days'
    GROUP BY platform, linked_at::date
    ORDER BY platform, day
  ) t
), '[]'::jsonb)
```

### 5. Unresolved Artists (`unresolved_artists` + `unresolved_sample`)

Artists with 0 platform_ids — distinct from existing `orphan_entities` which counts entities with 0 observations.

```sql
'unresolved_artists', (
  SELECT COUNT(*)::int FROM wb_entities e
  WHERE e.entity_type = 'artist'
  AND NOT EXISTS (SELECT 1 FROM wb_platform_ids pid WHERE pid.entity_id = e.id)
),
'unresolved_sample', COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'name', t.canonical_name,
    'created_at', t.created_at
  ))
  FROM (
    SELECT e.canonical_name, e.created_at
    FROM wb_entities e
    WHERE e.entity_type = 'artist'
    AND NOT EXISTS (SELECT 1 FROM wb_platform_ids pid WHERE pid.entity_id = e.id)
    ORDER BY e.created_at DESC
    LIMIT 10
  ) t
), '[]'::jsonb)
```

### 6. Scraper Run History (`scraper_run_history`)

Last 48h of all scraper starts for cron gap detection on the frontend. Used to compare actual vs expected intervals.

```sql
'scraper_run_history', COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
    'scraper_name', t.scraper_name,
    'scraper_group', t.scraper_group,
    'started_at', t.started_at,
    'status', t.status
  ) ORDER BY t.started_at DESC)
  FROM (
    SELECT scraper_name, scraper_group, started_at, status
    FROM scraper_runs
    WHERE started_at >= NOW() - INTERVAL '48 hours'
    ORDER BY started_at DESC
    LIMIT 200
  ) t
), '[]'::jsonb)
```

### Edge Function

The frontend copy of `admin-health.ts` has already been updated to extract and compute these fields (SC burn rate, projected exhaustion, etc). The **backend copy** (`edge-functions/admin-health.ts`) needs the same additions — specifically the section after `dataQuality` that computes `apiQuotas`, `platformIdTrend`, `platformIdDaily`, `unresolvedEntities`, and `scraperRunHistory` from the `ext` object, plus the 5 new fields in the response JSON.

**Files:** `migrations/YYYYMMDD_ops_dashboard_health.sql` (new migration), `edge-functions/admin-health.ts` (sync with frontend copy's additions)

## ~~`start-onboarding` Must Create `wb_entities` + Return `entity_id`~~ DONE 2026-04-07

**Fixed:** `start-onboarding` now creates `wb_entities` + `wb_platform_ids` inline and returns `entity_id` in its response. Frontend reads it and fires `trigger-artist-onboarding`. Both paths live (frontend-driven + DB trigger safety net).

---

## Add `entity_id` Column to `artist_intelligence` Table (2026-04-07)

**Priority:** HIGH — eliminates fragile name-based lookup for the Intelligence tab.

**Problem:** The new Intelligence tab needs `entity_id` (from `wb_entities`) to call `get-artist-card`, `get-artist-alerts`, and `get-market-map`. But the artist detail page only has `artist_intelligence.id`, which is a different UUID. Currently the frontend resolves entity_id by querying `wb_entities WHERE LOWER(canonical_name) = LOWER(artist_name)`, which is:

1. Fragile — case/spelling mismatches between tables cause lookup failures
2. Potentially blocked by RLS on `wb_entities` (anon key may not have SELECT)
3. An extra round-trip before any intelligence data can load

**Recommended fix:**

```sql
-- Add column
ALTER TABLE artist_intelligence ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES wb_entities(id);
CREATE INDEX IF NOT EXISTS idx_ai_entity_id ON artist_intelligence(entity_id);

-- Backfill from existing name match
UPDATE artist_intelligence ai
SET entity_id = e.id
FROM wb_entities e
WHERE LOWER(e.canonical_name) = LOWER(ai.artist_name)
  AND e.entity_type = 'artist'
  AND ai.entity_id IS NULL;
```

Then ensure the entity linking step (wherever new artists are added to `artist_intelligence`) also sets `entity_id`.

**Frontend impact:** Once this column exists, `IntelligenceTab` can receive `entity_id` directly from the parent page's Supabase query instead of doing a separate lookup. The `resolveEntityId()` function in `src/utils/artistIntelligenceApi.ts` becomes unnecessary.

**Files:** New migration + update any insert/upsert logic for `artist_intelligence`

## `platforms_tracked` Shows 0 When Platform Data Exists (2026-04-07)

**Priority:** MEDIUM — cosmetic but confusing for label users.

**Problem:** The `artist_score` dbt model computes `platforms_tracked`, `platforms_growing`, and `platforms_declining` in a way that returns 0 for all three when there are fewer than 7 days of observation data. For Addison Rae (who has Spotify, TikTok, YouTube data in `wb_observations`), the Intelligence tab shows "0 growing, 0 declining, 0 tracked" with all platform trends as "—".

**Expected:** `platforms_tracked` should count platforms with _any_ observations for the entity, regardless of whether a 7-day trend can be computed. `platforms_growing` / `platforms_declining` can remain 0 until trend data exists.

**Likely fix:** In the `artist_score` dbt model, compute `platforms_tracked` as:

```sql
(SELECT COUNT(DISTINCT platform) FROM wb_observations WHERE entity_id = e.id)
```

instead of counting only platforms where `*_trend IS NOT NULL`.

**Frontend impact:** The Platform Signals card in `PlatformSignals.tsx` will show "4 tracked" with individual "—" trends, which is much less confusing than "0 tracked".

**Files:** `dbt/wavebound/models/layer2_intelligence/artist_score.sql`

## Expose Discovery-Streaming Divergence in `get-artist-card` or New Endpoint (2026-04-07)

**Priority:** HIGH — this is the single most valuable expansion signal for labels.

**What exists:** `dbt/wavebound/models/layer1_health/discovery_streaming_divergence.sql` computes per-entity × per-country divergence scores. Positive divergence = Shazam/Apple demand forming before Spotify streams catch up. The model classifies signals as `pre_breakout`, `early_demand`, `discovery_only`, `streaming_only`, `balanced`.

**What the frontend needs:** Either add to the `get-market-map` response per-market or create a new `get-divergence-signals` endpoint:

```typescript
// Per market entry, add:
divergence_score: number;       // -100 to +100 (positive = untapped demand)
divergence_signal: 'pre_breakout' | 'early_demand' | 'discovery_only' | 'streaming_only' | 'balanced';
discovery_platforms: string[];  // which platforms showing discovery signal
```

**Frontend readiness:** Will add a "Pre-Breakout" badge and divergence indicator to GeoMarketMap once data is available. This is the feature that makes labels say "how did we not know this?"

**Files:** New endpoint or extend `get-market-map` response + query `discovery_streaming_divergence` table

## Expose Market Spillover Predictions (2026-04-07)

**Priority:** HIGH — predictive timing data for release planning.

**What exists:** `dbt/wavebound/models/layer2_intelligence/market_spillover.sql` computes from/to country pairs with `spillover_probability`, `median_lag_days`, and `sample_size` based on historical artist breakout patterns.

**What the frontend needs:** A new `get-spillover-predictions` endpoint or add to `get-market-map`:

```typescript
spillovers: Array<{
  from_country: string;
  to_country: string;
  probability: number; // 0-1
  median_lag_days: number; // e.g. 18
  sample_size: number; // historical precedent count
}>;
```

**Use case:** "This artist charted in UK. France typically follows in 18 days (based on 47 similar artists)."

**Frontend readiness:** Will render as timeline/prediction cards in GeoMarketMap.

**Files:** New endpoint + query `market_spillover` table

## Expose Entry Song per Market from market_opportunity_v2 (2026-04-07)

**Priority:** HIGH — operationally actionable, tells labels exactly which song to push where.

**What exists:** `dbt/wavebound/models/layer2_intelligence/market_opportunity_v2.sql` computes per market:

- `entry_song_entity_id`, `entry_song_name` — recommended song to push
- `song_entry_score` — how good the fit is
- `song_velocity` — is that song accelerating?
- `song_adjacent_markets` — how many markets it already charts in
- `urgency` — 'act_now', 'plan', 'monitor'

**What the frontend needs:** Add to each market in `get-market-map` response:

```typescript
// Per market entry, add:
entry_song: string | null;
entry_song_velocity: string | null;
urgency: "act_now" | "plan" | "monitor" | null;
```

**Use case:** "Push 'Summer Hit' in Brazil — it's already #15 in Colombia and accelerating."

**Frontend readiness:** Will add entry song name + urgency badge to GeoMarketMap rows.

**Files:** Extend `get-market-map` to join `market_opportunity_v2`

## RLS Policies for Intelligence V2 Direct Queries (2026-04-07)

**Priority:** HIGH — Artist Intelligence V2 frontend queries these materialized tables directly via Supabase client. Without SELECT policies for authenticated users, these queries return empty arrays and the briefing sections show empty states.

**Tables needing RLS policies:**

```sql
-- song_velocity: needed for Signal Map (velocity-grouped songs)
ALTER TABLE song_velocity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read song_velocity"
  ON song_velocity FOR SELECT
  TO authenticated
  USING (true);

-- market_opportunity_v2: needed for Opportunity Engine + Outlook predictions
ALTER TABLE market_opportunity_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read market_opportunity_v2"
  ON market_opportunity_v2 FOR SELECT
  TO authenticated
  USING (true);

-- market_intelligence: needed for CPM data in opportunity cards
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read market_intelligence"
  ON market_intelligence FOR SELECT
  TO authenticated
  USING (true);

-- market_spillover: needed for cascade predictions + spillover targets
ALTER TABLE market_spillover ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read market_spillover"
  ON market_spillover FOR SELECT
  TO authenticated
  USING (true);
```

**Note:** If label-scoped access is preferred (only see data for your roster artists), the `song_velocity` and `market_opportunity_v2` policies should join through `wb_entity_relationships` to check the artist belongs to the user's label. But for MVP, allowing all authenticated users to read these read-only materialized tables is fine.

**Frontend impact:** Once these policies are in place, the Intelligence Briefing page's Signal Map, Opportunity Engine, and Outlook sections will populate with real data. Without them, those sections show graceful empty states ("data loading or not yet available").

**Files:** New migration `migrations/YYYYMMDD_intelligence_v2_rls.sql`

---

## Create `get_latest_scraper_runs()` RPC Function (2026-04-08)

**Priority:** HIGH — without this, the health dashboard misses low-frequency scrapers.

**Problem:** The `admin-health` edge function calls `supabase.rpc("get_latest_scraper_runs")` but this function doesn't exist in the database. It falls back to `SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 5000` with JS-side deduplication. This works but is inefficient — scanning thousands of rows to find ~40 unique scrapers.

**Fix:** Create the RPC:

```sql
CREATE OR REPLACE FUNCTION get_latest_scraper_runs()
RETURNS SETOF scraper_runs
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (scraper_name) *
  FROM scraper_runs
  ORDER BY scraper_name, started_at DESC;
$$;
```

**Context:** High-frequency scrapers (carl_reels, carl_tiktok, oscar_reels, oscar_tiktok) run every 1-2 minutes, generating ~130 rows/hour. The old `LIMIT 200` fallback was completely consumed by these, causing all Kworb scrapers (4x daily) to show "Never run" on the dashboard. The edge function fallback has been bumped to `LIMIT 5000` as a stopgap, but creating this RPC is the proper fix.

**Files:** New migration `migrations/YYYYMMDD_get_latest_scraper_runs.sql`

---

## Add Radio & Apple Music Fields to `get-artist-card` (2026-04-07)

**Priority:** MEDIUM — execs don't know if their artists have radio play.

**What exists:** `artist_score` table already has: `songs_on_radio`, `best_radio_position`, `total_radio_audience`, `apple_charting_songs`, `best_apple_position`.

**What the frontend needs:** Add to `get-artist-card` response:

```typescript
radio: {
  songs_on_radio: number;
  best_position: number | null;
  total_audience: number;
} | null;

apple_music: {
  charting_songs: number;
  best_position: number | null;
} | null;
```

**Frontend readiness:** Will add a "Traditional Media" row to PlatformSignals or ScoreHeroCard once fields exist in the response.

**Files:** `edge-functions/get-artist-card.ts` — add fields from `score` object to response JSON

---

## Fix `song_velocity` dbt Model — 0 Rows Due to CURRENT_DATE Filter (2026-04-08)

**Priority:** HIGH — cascading failure. `song_velocity` feeds `catalog_intelligence`, which means both tables are empty.

**Problem:** `dbt/wavebound/models/layer1_compression/song_velocity.sql` lines 25 and 35 filter with `ds.date = CURRENT_DATE`. If dbt runs before scrapers finish populating `daily_summaries` for today (common — dbt runs "daily after scrapers" but timing is fragile), the CTEs return 0 rows and the entire model rebuilds as an empty table.

**Root cause:** The model is `materialized='table'` (overrides the project-level `incremental`), so it fully rebuilds each run. With `CURRENT_DATE`, there's a race condition: scraper completion time vs dbt start time.

**Fix:** Replace `CURRENT_DATE` with the latest available date:

```sql
-- In song_streams CTE (line 25) and song_totals CTE (line 35), change:
AND ds.date = CURRENT_DATE
-- To:
AND ds.date = (SELECT MAX(date) FROM {{ ref('daily_summaries') }} WHERE platform = 'spotify' AND metric = 'daily_streams')
```

Also update line 55:

```sql
-- Change: CURRENT_DATE AS date
-- To:     (SELECT MAX(date) FROM {{ ref('daily_summaries') }} WHERE platform = 'spotify' AND metric = 'daily_streams') AS date
```

**Verification after fix:** `SELECT COUNT(*) FROM song_velocity;` should return 100K+ rows (there are ~750K songs with Spotify data in daily_summaries).

**Files:** `dbt/wavebound/models/layer1_compression/song_velocity.sql` — lines 25, 35, 55

---

## Drop Orphaned `catalog_moments` Table (2026-04-08)

**Priority:** LOW — table exists with 0 rows, no dbt model produces it, nothing references it.

**Problem:** The `catalog_moments` table exists in the database (0 rows) but there is no corresponding dbt model anywhere in `dbt/wavebound/models/`. No scripts, edge functions, or frontend code reference it. It appears to have been a planned feature that was never implemented.

**Fix:** Drop the table, or if the concept is still wanted, create a dbt model for it:

```sql
-- Option A: Drop it
DROP TABLE IF EXISTS catalog_moments;

-- Option B: Create a model (if the concept is still useful)
-- Would track notable catalog events: new release peaks, viral moments, playlist adds
```

**Files:** New migration to drop, or new `dbt/wavebound/models/layer2_intelligence/catalog_moments.sql`

---

## Clean Stale `artist_health.sql` Compiled Artifact (2026-04-08)

**Priority:** LOW — doesn't affect runtime, but confuses dbt audits.

**Problem:** `dbt/wavebound/target/compiled/wavebound/models/layer1_health/artist_health.sql` exists as a compiled artifact but the source model was removed from `models/layer1_health/`. The compiled SQL references `"postgres"."public"."entities"` (old table name, now `wb_entities`), confirming it's stale from before the entity model rename. It was replaced by `entity_health.sql`.

**Fix:**

```bash
cd dbt/wavebound
dbt clean  # Removes target/ and dbt_packages/ per clean-targets in dbt_project.yml
dbt compile  # Regenerates clean compiled SQL from current models
```

**Files:** `dbt/wavebound/target/` — clean and recompile

---

## Increase Instagram Scraping Coverage for `cross_platform_arbitrage` (2026-04-08)

**Priority:** MEDIUM — only 8 artists have both TikTok + Instagram data, limiting arbitrage insights.

**Problem:** `cross_platform_arbitrage.sql` uses `INNER JOIN ig ON tt.entity_id = ig.entity_id` (line 143), which means only artists present in BOTH `tiktok_video_summary` AND `instagram_video_summary` produce rows. Currently only 8 artists qualify.

**This is not a dbt bug** — the join logic is correct (you need both platforms to compute ratios). The issue is upstream coverage: not enough artists have Instagram Reels scraped.

**Two-pronged fix:**

1. **Increase IG scraping coverage** — ensure all roster artists with TikTok handles also get their Instagram handles resolved and scraped. Check `wb_platform_ids WHERE platform = 'instagram'` coverage vs `platform = 'tiktok'`.

2. **Optional: Change to LEFT JOIN** — if partial data (TikTok-only or Instagram-only) is valuable, change line 143 to `LEFT JOIN` and add `COALESCE` wrappers for all ratio calculations. This would produce rows for all artists with at least one platform, with NULL ratios where the other platform is missing.

**Current row counts for context:**

- `tiktok_video_summary`: likely 100+ artists
- `instagram_video_summary`: likely ~10 artists
- Intersection (INNER JOIN): 8 artists

**Files:** `dbt/wavebound/models/layer2_intelligence/cross_platform_arbitrage.sql` line 143 (optional), plus identity resolution scripts for IG handle discovery

---

## Optimize `admin-health` Edge Function — Move dbt Counts to RPC (2026-04-08)

**Priority:** LOW — performance optimization, not a bug.

**Problem:** The `admin-health` edge function now fires 34 parallel `SELECT count(*)` queries (one per dbt model table) alongside the existing RPC calls. While Supabase handles parallel queries well, this adds ~1-2s of latency and 34 connections per health dashboard load.

**Recommended fix:** Add the counts to `get_admin_health_extended()` RPC:

```sql
-- Add to the existing RPC function's JSON output:
'dbt_compression_counts', (
  SELECT jsonb_agg(jsonb_build_object('name', t.table_name, 'rows', t.row_count))
  FROM (
    SELECT unnest(ARRAY['daily_summaries','daily_summaries_geo','song_velocity',
      'artist_catalog_summary','playlist_momentum','instagram_artist_daily',
      'instagram_video_summary','tiktok_artist_daily','tiktok_video_summary',
      'tiktok_global_benchmarks']) AS table_name
  ) names
  CROSS JOIN LATERAL (
    SELECT reltuples::bigint AS row_count
    FROM pg_class WHERE relname = names.table_name
  ) t
),
'dbt_health_counts', (
  -- Same pattern for 8 health tables
),
'dbt_intelligence_counts', (
  -- Same pattern for 15 intelligence tables
),
'dbt_anomalies_rows', (SELECT reltuples::bigint FROM pg_class WHERE relname = 'anomalies')
```

Using `pg_class.reltuples` (estimate) is instant vs actual `COUNT(*)`. Good enough for a health dashboard.

Once the RPC returns these, the edge function can remove the 34 individual count queries and read from `ext.dbt_compression_counts` etc.

**Files:** `get_admin_health_extended()` RPC function + `edge-functions/admin-health.ts`

---

## The Pulse — Dedup Song Rows in `globe-data` Country Detail (2026-04-08)

**Priority:** MEDIUM — frontend now deduplicates, but cleaner data from the API means less client work.

**Problem:** The `globe-data?country=XX` endpoint returns duplicate song rows (same `entity_id` appearing multiple times) and duplicate platform observations per song (same platform+metric combo repeated). The frontend now deduplicates by `entity_id` and `platform+metric`, but the backend should do this at the SQL level for consistency and performance.

**Fix:** Add `DISTINCT ON (entity_id)` to the country detail query, and aggregate platform observations per song so each entity appears once with all its platform entries deduplicated by `(platform, metric)`.

**Files:** `edge-functions/globe-data.ts` — the country detail query branch

---

## The Pulse — Velocity Classification Tuning (2026-04-08)

**Priority:** HIGH for demo — almost all songs return `velocity_class = 'steady'`, making the sidebar feel dead.

**Problem:** The `velocity_class` computation in the globe-data country detail response classifies nearly everything as "steady". For the Columbia demo, we need a meaningful distribution (accelerating, growing, new, declining) based on position changes over time.

**Suggested logic:**

- `accelerating`: position improved by >20% in last 48h
- `growing`: position improved by >5% in last 48h
- `new`: first observed within last 72h
- `declining`: position worsened by >10% in last 48h
- `steady`: everything else

**Files:** `edge-functions/globe-data.ts` or the underlying RPC

---

## The Pulse — Normalize Platform Names in `wb_observations_geo` (2026-04-08)

**Priority:** LOW — frontend handles case-insensitive dedup, but source normalization prevents drift.

**Problem:** Platform names arrive as mixed case ("tiktok" vs "TikTok", "spotify" vs "Spotify"). The frontend merges these case-insensitively, but a `LOWER()` normalization on insert or in the RPC would be cleaner.

**Fix:** Either normalize on ingest (`LOWER(platform)` in the insert trigger) or in the country detail RPC (`LOWER(platform) as platform`).

**Files:** `wb_observations_geo` insert pipeline or `edge-functions/globe-data.ts`

---

## Catalog Velocity: All Songs Show "new" Status (2026-04-10)

**Priority:** MEDIUM — makes the velocity_class column useless on the frontend.

**Problem:** Every song in `song_velocity` has `velocity_class = 'new'` for The Chainsmokers (and likely all artists). The frontend displays this faithfully, but the dashboard shows every song as "NEW" in purple — defeating the purpose of velocity classification (viral/accelerating/growing/steady/declining/new).

**Expected behavior:** The velocity classification pipeline should compute the class based on `pct_change_7d`, `daily_streams` trajectory, and time since first observation. Songs with established streaming history (e.g., "Closer" with 19.5M total streams) should NOT be classified as "new".

**Likely cause:** The dbt model or ingestion pipeline that populates `velocity_class` either:

1. Defaults to "new" and never reclassifies
2. Doesn't have the classification logic implemented yet
3. Resets on every rebuild

**Files:** `song_velocity` dbt model or the pipeline that writes to it

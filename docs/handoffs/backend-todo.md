# Backend TODO — From Frontend Sessions

## 1. TikTok Scraper: Resolve `music_id` → `sound_title`

**Priority: High**
**Found:** 2026-04-11

`artist_videos_tiktok` has `music_id` populated for all posts but `sound_title` is null on most entries. The AI focus picker had to fall back to reading captions to identify new releases (e.g. The Chainsmokers' "Echo" was only discoverable via caption text "OUR NEW SONG 'Echo'").

**Fix:** After scraping a video, resolve `music_id` to the actual sound name via TikTok's sound page or API, and populate `sound_title` + `is_original_sound`.

## 2. `latest_release` Freshness on `artist_intelligence`

**Priority: High**
**Found:** 2026-04-11

`latest_release` is only updated during the weekly deep research scrape. The Chainsmokers released "Echo" on April 10 but `latest_release` still showed "The Fate of Ophelia" from November 2025. The AI focus picker treated a 4.5-month-old song as "new."

**Fix:** Either:

- Add a lightweight daily Spotify check for new releases (just hit Spotify API `/artists/{id}/albums?limit=1`)
- Or trigger a `latest_release` update whenever the TikTok scraper detects a new `music_id` that matches an original sound

## 3. Bb Trickz: Wrong TikTok Handle Was `belize.kazi` (Fan Account)

**Priority: High — FIXED in DB, needs scraper re-run**
**Found:** 2026-04-11

The TikTok handle for Bb Trickz was `belize.kazi` — a **fan account** that reposts clips and tags `@Bb trickz` in every caption. Her real handle is `imsorrymissjacksonuhh`. This caused the dashboard to show "308 days since last post" when she actually posted on March 9, 2026.

**Already fixed:**

- `artist_intelligence.artist_handle` → `imsorrymissjacksonuhh`
- `roster_dashboard_metrics.artist_handle` → `imsorrymissjacksonuhh`
- `artist_content_dna.artist_handle` → `imsorrymissjacksonuhh`
- `artist_content_evolution.artist_handle` → `imsorrymissjacksonuhh`
- Deleted 90 fan-account videos from `artist_videos_tiktok`
- Reset `total_videos=0`, `days_since_last_post=null`, `has_baseline=false`

**Backend action needed:**

- Trigger a full TikTok scrape for handle `imsorrymissjacksonuhh` to populate fresh video data
- Re-run content DNA and evolution analysis once videos are scraped
- Re-run the `generate-artist-focus` edge function for Bb Trickz after data is refreshed
- **Audit other artists**: Check if any other handles in `artist_intelligence` point to fan accounts instead of official artist accounts (look for accounts where every caption tags another user)

## 4. Populate `catalog_tiktok_performance` for ALL Roster Artists (Currently Only Harry Styles)

**Priority: CRITICAL — this is the #1 data gap in the AI pipeline**
**Found:** 2026-04-11

`catalog_tiktok_performance` only has data for Harry Styles (179 sounds). The other 12 Columbia artists have **zero rows**. This table provides the detailed per-sound UGC breakdown that the AI focus picker needs: `videos_last_7d`, `videos_last_30d`, `fan_to_artist_ratio`, `unique_creators`, `tiktok_status`.

Without this data, the AI is making sound-level decisions based on the velocity RPC summary only (which gives just the top sound) instead of seeing the full catalog picture.

**What the SC scraper needs to do:**

- For each artist on the roster, discover all their TikTok sounds (via the artist's posts or Spotify catalog → TikTok sound search)
- For each sound, scrape the TikTok sound page to get: total video count, total plays, videos in last 7d/30d, unique creators, fan videos vs artist videos
- Calculate `fan_to_artist_ratio` (fan_videos / artist_videos)
- Set `tiktok_status` based on velocity (viral / trending / active / established / flat)
- Run daily to keep `videos_last_7d` and `videos_last_30d` current

**Scale:** ~200 sounds across 13 artists. Daily SC cost estimate: ~$6-30/month at current rates.

**Current state per artist** (from sound velocity RPC — these sounds exist but lack detailed breakdown):
| Artist | Sounds Tracked | Top Sound | Weekly UGC |
|--------|---------------|-----------|------------|
| The Chainsmokers | 28 | Don't Let Me Down | 290 |
| Presley Haile | 26 | Sunny Day | 0 |
| Harry Styles | 24 | American Girls | 4,838 |
| The Kid LAROI | 21 | PRIVATE | 27 |
| Malcolm Todd | 13 | Earrings | 20,037 |
| Meg Moroney | 13 | Bells & Whistles | 654 |
| Miles Caton | 13 | Don't Hate Me | 15 |
| Addison Rae | 12 | Fame is a Gun | 864 |
| Chance Peña | 10 | In My Room | 0 |
| Max McNown | 10 | A Lot More Free | 0 |
| Alina | 10 | original sound | 0 |
| Henry Moodie | 6 | drunk text | 0 |
| Bb Trickz | 4 | Soy la Más Mala | 0 |

**Impact:** Once this is populated, the AI Signal Report and per-artist focus picks will have dramatically richer data — seeing full catalog UGC curves instead of just the top sound summary. This is the single highest-ROI scraper improvement we can make.

## 5. `artist_sounds` Table Staleness

**Priority: Medium**
**Found:** 2026-04-11

`artist_sounds` for The Chainsmokers was last updated March 11. All entries show `sound_id: null`. This table should be the canonical list of an artist's TikTok sounds but it's not keeping up with new posts.

**Fix:** The daily scraper should upsert new sounds into `artist_sounds` whenever it encounters a new `music_id` on an artist's post.

## 6. `get_table_sizes` RPC: Exclude System Tables

**Priority: Low**
**Found:** 2026-04-11

The `get_table_sizes()` RPC returns all tables from `pg_class` where `relkind = 'r'` in the `public` schema. Postgres can include system-internal or partitioned tables with null `relname` values, which crashed the frontend Database health page.

The frontend now filters these out client-side, but the RPC should also exclude them at the SQL level for defense in depth:

```sql
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IS NOT NULL
  AND c.relname NOT LIKE 'pg_%'
```

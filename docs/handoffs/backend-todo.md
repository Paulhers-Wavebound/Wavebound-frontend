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

## 4. `artist_sounds` Table Staleness

**Priority: Medium**
**Found:** 2026-04-11

`artist_sounds` for The Chainsmokers was last updated March 11. All entries show `sound_id: null`. This table should be the canonical list of an artist's TikTok sounds but it's not keeping up with new posts.

**Fix:** The daily scraper should upsert new sounds into `artist_sounds` whenever it encounters a new `music_id` on an artist's post.

## 5. `get_table_sizes` RPC: Exclude System Tables

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

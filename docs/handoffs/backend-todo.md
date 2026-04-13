# Backend TODO — From Frontend Sessions

Last cleaned: 2026-04-13 — removed all items shipped through commit `a99e0cd`
(dbt pct_change pipeline + roster velocity columns) and the earlier batch
(decision point actions, A&R pipeline, Culture Genome, Simulation Lab,
catalog_tiktok_performance backfill, get_table_sizes fix).

---

## NEW (2026-04-12): TikTok Avatar URLs Expire — Always Cache to Storage

**Priority: Medium (frontend mitigation already shipped)**
**Found:** 2026-04-12 while debugging Signal Report decision points showing category icons instead of artist photos.

### The bug

`artist_intelligence.avatar_url` (which feeds `roster_dashboard_metrics.avatar_url` via `refresh_roster_metrics()`) sometimes contains raw TikTok CDN signed URLs:

```
https://p16-common-sign.tiktokcdn-us.com/tos-useast5-avt-0068-tx/<hash>?...
```

These signed URLs **expire** (return 403 from Cloudflare/origin), and they may also be region-locked. When they expire, the frontend `<img>` `onError` fires and the avatar slot disappears.

For Columbia (`8cd63eb7-7837-4530-9291-482ea25ef365`) on 2026-04-12, four roster artists were affected: `addisonre`, `malcolmtodddd`, `hshq`, `presleylynhaile` — all four had working JPGs already in the `avatars` Supabase Storage bucket but `artist_intelligence.avatar_url` was still pointing at the original (now expired) TikTok CDN URL.

### Hot-patch already applied

I ran this from the frontend session and verified all four resolve to 200:

```sql
UPDATE artist_intelligence ai
SET avatar_url = 'https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/avatars/'
                 || ai.artist_handle || '.jpg'
WHERE ai.artist_handle IN ('addisonre','malcolmtodddd','hshq','presleylynhaile')
  AND EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'avatars' AND name = ai.artist_handle || '.jpg'
  );
SELECT refresh_roster_metrics();
```

### Frontend mitigation also shipped

`SignalReportCard.tsx` now ships an `ArtistAvatar` component with a chained fallback:

1. Try the URL on the row
2. If it errors, try `https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/avatars/<artist_handle>.jpg`
3. If that errors too, render initials inside a category-colored circle (no longer falls back to the lucide category icon)

This means even if the next pipeline run overwrites `avatar_url` back to a stale CDN URL, the row will still display the storage-cached photo.

### What backend should fix

The pipeline that writes `artist_intelligence.avatar_url` (likely n8n `WF2 - TikTok Scrape & Content Analysis`) should:

1. **Always download** the TikTok avatar bytes after scraping the profile.
2. **Upload to** `storage.objects` bucket `avatars` with key `<artist_handle>.jpg` (overwrite if exists).
3. **Write** `https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/avatars/<artist_handle>.jpg` into `artist_intelligence.avatar_url` — never the raw `tiktokcdn-us.com` URL.

That guarantees the URL never expires and `refresh_roster_metrics()` keeps populating clean URLs into `roster_dashboard_metrics`.

Bonus: do the same for any other table that stores avatar URLs (`profile_tiktok`, `artist_profiles_tiktok`, `culture_genome_nodes`, `ar_prospects`) — same expiry problem, same fix.

---

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

## 6. `artist_sounds` Table Staleness

**Priority: Medium**
**Found:** 2026-04-11

`artist_sounds` for The Chainsmokers was last updated March 11. All entries show `sound_id: null`. This table should be the canonical list of an artist's TikTok sounds but it's not keeping up with new posts.

**Fix:** The daily scraper should upsert new sounds into `artist_sounds` whenever it encounters a new `music_id` on an artist's post.

## 8b. TikTok Scraper: Always Populate `author_avatar_url`

**Priority: Medium**
**Found:** 2026-04-12

242 of 1,075 ar_prospects have no avatar because `hitl_tiktok.author_avatar_url` is null for those rows. The scraper fetches the video data but doesn't always include the author's profile picture.

**Backfill already done:** 833 prospects now have avatars (up from 2) by copying from hitl_tiktok where available. The remaining 242 have null avatars at the source.

**Fix:** Ensure the TikTok scraper always populates `author_avatar_url` when inserting/updating `hitl_tiktok` rows. The avatar URL is available in the TikTok API response at `author.avatar_thumb` or `author.avatar_medium`. Run a one-time backfill for existing rows missing avatars.

## 10. A&R Pipeline: Social Handles Already in DB — Verify Populated

**Priority: Medium**
**Found:** 2026-04-12

The `ar_prospects` table already has `source_platform`, `source_handle`, `tiktok_handle`, `instagram_handle`, and `spotify_url` columns, and `get-ar-prospects` uses `SELECT *` so they're returned to the frontend.

The frontend now constructs clickable social links from these fields:

- TikTok: `https://www.tiktok.com/@{tiktok_handle || source_handle}`
- Instagram: `https://www.instagram.com/{instagram_handle}`
- Spotify: direct URL from `spotify_url`
- SoundCloud: from `wb_platform_ids` (detail view only)

**Backend actions needed:**

1. **Verify `source_handle` is populated for all prospects.** The frontend falls back to `source_handle` when `tiktok_handle` is null, so as long as `source_handle` is set, at minimum the discovery platform link will always show.

2. **Backfill `instagram_handle`:** For TikTok-sourced prospects, cross-reference against `wb_platform_ids` or parse from TikTok bio links to populate `instagram_handle`. Without this, IG links only show for Instagram-sourced prospects.

3. **Backfill `spotify_url`:** Attempt Spotify search by artist name for prospects missing this field. The frontend displays this prominently on the dossier page.

4. **Add `soundcloud_url` column to `ar_prospects`** (optional): Currently SoundCloud links only show on the dossier page via `wb_platform_ids`. For pipeline row visibility, add to `ar_prospects` schema.

5. **Ensure the ingestion pipeline populates these fields** when creating new prospects — not just for existing backfill.

**Frontend type reference:** `src/types/arTypes.ts` — `ARProspect.source_platform`, `.source_handle`, `.tiktok_handle`, `.instagram_handle`, `.spotify_url`

---

## NEW (2026-04-13): A&R region filter — data gaps + server-side param

**Priority: Medium**

While adding a region filter to `ARPipelineTable` the frontend hit a blocker: **`ar_prospects.origin_country` was empty for all 1075 rows**. Root cause + partial fix landed today, but two follow-ups remain.

### What already shipped (frontend session)

- **Backfilled `ar_prospects.origin_country`** from `wb_entities.metadata->>'country'` via direct SQL (186 rows populated, 889 rows still empty because `wb_entities` has no `country` value for those entities).
- Frontend region filter is live at `/label/ar` — client-side only, groups ISO‑2 codes into US/UK/DACH/Nordics/Europe/LatAm/SEA/Asia/Oceania/Africa/MENA/Other (see `src/components/label/ar/ARPipelineTable.tsx`).
- Filter state now persists in URL via `useSearchParams` (`stage`, `region`, `sort`, `order`, `mf_*` params).

### Backend follow-ups

1. **Populate `wb_entities.metadata.country` for the other 889 prospects.** The enrichment pipeline fills this from TikTok's `region` field, but it's empty for most. Need a secondary signal — TikTok bio parsing, Spotify artist profile country, or Chartmetric lookup — so the region filter is useful on the majority of the roster. Owning file: `edge-functions/enrich-ar-prospect.ts` (sets `origin_country` at line 191 from `region.toUpperCase().substring(0,2)`).

2. **Also write to `ar_prospects.origin_country` directly on insert/enrich**, not just via `wb_entities.metadata`. Today the only code path that populates `ar_prospects.origin_country` is `enrich-ar-prospect.ts:191` (conditional on the TikTok `region` field). Prospects created by other flows (HITL drops, manual inserts) never get a country. Add a fallback: `coalesce(tiktok_region, wb_entities.metadata->>'country', null)` at insert time.

3. **Add `region` query param to `get-ar-prospects`** so client-side filtering (currently limited to the ≤200 prospects in the loaded page) can be pushed to the server. Frontend would pass `?region=Africa`, backend translates to a country-code `IN (...)` predicate using the same map below. This unlocks filtering across the full dataset once the roster grows.

**Canonical region → ISO‑2 mapping used by the frontend** (keep these in sync when implementing the server-side param — eventually extract into a shared helper): see `COUNTRY_TO_REGION` in `src/components/label/ar/ARPipelineTable.tsx`.

**Context:** session diary `docs/session-diaries/2026-04-13_ar-region-filter.md`.

---

## Add `velocity_followers_pct` to `roster_dashboard_metrics`

**Priority: Low (cosmetic — closes the last inconsistency in the Velocity column group)**
**Requested:** 2026-04-13 frontend session

`HealthRosterCoverage` still ships a legacy `Δ Foll %` column (reads `delta_followers_pct`, which carries Wavebound Impact Delta semantics) alongside the renamed `velocity_views_pct` / `velocity_engagement_pct` / `velocity_posting_freq_pct` columns. The group reads inconsistently.

Now that `daily_summaries.pct_change_7d` is populated for `platform='tiktok' AND metric='tiktok_followers'` (backend commit `a99e0cd`), we can compute a real 7-day follower velocity and clamp it the same way as the other platform trends.

**Fix:**

1. Add column: `ALTER TABLE roster_dashboard_metrics ADD COLUMN velocity_followers_pct double precision;`
2. In `refresh_roster_metrics()`, left-join `daily_summaries` on `entity_id`, `platform='tiktok'`, `metric='tiktok_followers'`, `date=CURRENT_DATE` and store `LEAST(500, GREATEST(-500, pct_change_7d))` (wrapped in `CASE ... IS NOT NULL`) into the new column.
3. Frontend then swaps the `Δ Foll %` column in `HealthRosterCoverage` from `delta_followers_pct` → `velocity_followers_pct` and the Velocity group becomes consistent.

**Note:** `artist_intelligence` rows link to `wb_entities` via name match — verify the join path works for all roster artists; some may need `LOWER(canonical_name)` matching. Sample Columbia first, then confirm row coverage before shipping.

---

## Deferred / not-blocking

- **Decision Point Actions `SLACK_WEBHOOK_URL` secret.** Slack forwarding is implemented in `edge-functions/forward-decision-point.ts` but intentionally gated on the `SLACK_WEBHOOK_URL` secret. Paul deferred setting it on 2026-04-12 — the Slack tab in the Forward dialog currently returns a clean "not configured" toast, which is the desired behavior until the label-level Slack integration is wired up. When ready to enable:
  ```bash
  supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... --project-ref kxvgbowrkmowuyezoeke
  ```

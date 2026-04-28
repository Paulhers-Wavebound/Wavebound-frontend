# Artist Score is Fundamentally Broken — Every Megastar Tier'd as "Developing"

**Severity:** P0 — the headline number on every artist profile is wrong
**Reported:** 2026-04-27 (Paul, looking at Addison Rae's profile)
**Owner:** Backend (dbt models in `wavebound-backend/dbt/wavebound/models/`)

## What Paul saw

Addison Rae's overview header:

- 46 / **DEVELOPING**
- Health 52, Momentum 55, Discovery 58, **Catalog 15**
- 65 Release Ready

Addison Rae has 88M TikTok followers, 34M IG followers, 18.3M Spotify monthly listeners. She is not "developing." The score is wrong.

## What I confirmed against live data

Queried `artist_score` for 17 of the world's biggest artists. **Every single one is "developing":**

```
Olivia Rodrigo    | 58 | developing
Ariana Grande     | 54 | developing
Harry Styles      | 54 | developing
The Weeknd        | 53 | developing
Sabrina Carpenter | 51 | developing
Beyoncé           | 51 | developing
Dua Lipa          | 51 | developing
Bad Bunny         | 50 | developing
Taylor Swift      | 50 | developing
Travis Scott      | 49 | developing
Billie Eilish     | 49 | developing
SZA               | 47 | developing
Addison Rae       | 46 | developing
Chappell Roan     | 46 | developing
Drake             | 46 | developing
Post Malone       | 46 | developing
Kendrick Lamar    | 43 | developing  ← lowest of the group
```

**Nobody is "Strong" or "Elite."** The thresholds (≥80 elite, ≥60 strong) are mathematically unreachable in the current implementation.

## Root causes — three independent bugs

### Bug 1 — `catalog_daily_streams = 0` for every artist in the table

`artist_catalog_summary` reports `catalog_daily_streams = 0` for **all 50,769 artists**:

```sql
SELECT date, COUNT(*) AS rows, MAX(catalog_daily_streams) AS max_streams
FROM artist_catalog_summary GROUP BY date ORDER BY date DESC LIMIT 1;
-- 2026-04-28 | 50769 | 0
```

But the underlying data is fine. For Addison Rae:

- 79 song relationships in `wb_entity_relationships` where `relationship='performed_by'`
- 17 of her songs have rows in `daily_summaries` for `platform='spotify' AND metric='daily_streams'` on the latest date (2026-04-27)
- Sum of those 17 daily_streams = **2,594,323** (~2.6M/day)

Yet `artist_catalog_summary` rolls those up to 0. The model file is `dbt/wavebound/models/layer1_compression/artist_catalog_summary.sql`. Suspect issues:

- The `latest_date` CTE uses `MAX(date) WHERE platform='spotify' AND metric='daily_streams'` — but the `song_daily` CTE then filters `ds.date = ld.d`. If `latest_date` resolves to a date that was already partially written when `song_daily` ran, OR if there's a CTE materialization quirk, every join row returns NULL → `COALESCE(NULL, 0) → 0`.
- Could also be a transactional/snapshot ordering issue between layer0 ingestion and layer1 dbt runs.
- Possibly the `wb_entity_relationships.source_id` (song) doesn't match `daily_summaries.entity_id` for songs — but I verified above that the join _does_ find 17 rows for Addison, so the IDs do match. So the bug is in the dbt model itself, not the source data.

**This bug alone caps every artist's catalog_score at 25** (the `total_songs >= 100` bucket, since the `catalog_daily_streams` bucket and `songs_accelerating` bucket are both zeroed out). That's 5 points instead of up to 75.

### Bug 2 — `cross_platform_signal` returns 0 platforms growing/declining for everyone

Every megastar has `platforms_growing = 0` and `platforms_declining = 0`. With at least 0–1 exceptions out of 17.

That's mathematically impossible — Spotify, TikTok, YouTube, Shazam, Apple Music are all tracked, and at least one is always moving WoW for any active artist. So `cross_platform_signal.sql` is also broken or stale.

**This caps `momentum_score` near the baseline of 50** for everyone. The model awards +8 per growing platform (max +64) and -6 per declining; with both at 0, the only momentum boosts come from the catalog/TikTok/sound-intel bonuses, which max out around +30 total. That's why everyone is in the 49–69 range.

Model: `dbt/wavebound/models/layer1_health/cross_platform_signal.sql` — needs an audit. Likely the same kind of join/date issue as Bug 1.

### Bug 3 — `entity_health` rewards growth rate, not scale (algorithmic, not a join bug)

`entity_health.sql` builds streaming/social/discovery momentum entirely from week-over-week percentage deltas:

```sql
streaming_momentum = 50
  + listeners_wow * 2
  + streams_wow * 1.5
  + ...

social_momentum = 50
  + tiktok_growth * 1.5  -- pct_change_7d on follower count
  + ig_growth * 1.0
  + ...
```

This means at megastar scale, growth rate is naturally tiny:

- 88M TikTok → 88.1M = +0.11% growth → +0.17 momentum points
- 1k TikTok → 1.5k = +50% growth → +75 momentum points

A nano-influencer growing 50% WoW from a tiny base mathematically beats Addison Rae. The "law of large numbers" problem. **Health is locked at 52–53 for every megastar in the list above.** Never crosses 60.

Even if Bugs 1 and 2 were fixed, this ceiling means the `health_score * 0.40` term contributes only ~21 points out of 100 for elite-scale artists. They cannot reach Elite (≥80) without absolute scale being rewarded.

## Recommended fixes (backend)

### Fix 1 — Repair `artist_catalog_summary` join (immediate)

Rewrite `song_daily` to inner-join more defensively, OR pin the date inside the CTE rather than referencing a separate `latest_date` CTE. Also worth verifying the dbt build order — `artist_catalog_summary` should run after `daily_summaries` is fully written for the day. Add a row count assertion: `MAX(catalog_daily_streams) > 0` in the model's `.yml` test.

Validation query after fix:

```sql
SELECT canonical_name, catalog_daily_streams
FROM artist_catalog_summary
WHERE entity_id IN (
  SELECT id FROM wb_entities WHERE canonical_name IN ('Drake','The Weeknd','Taylor Swift','Addison Rae')
);
-- All four must be > 100k. Drake should be in the millions.
```

### Fix 2 — Repair `cross_platform_signal` (immediate)

Same audit. `platforms_growing/declining` should be > 0 for ~80% of tracked artists with active signals. Add a model-level test that `(platforms_growing + platforms_declining) > 0` for at least 50% of rows.

### Fix 3 — Add an audience scale tier to `artist_score` (architectural, P1)

Add a 0–30 "scale" component that's NOT growth-rate-based. Rough proposal:

```sql
-- Pull absolute audience metrics (NOT pct_change)
audience_scale AS (
    SELECT
        entity_id,
        MAX(CASE WHEN platform IN ('spotify','kworb') AND metric = 'monthly_listeners' THEN latest_value END) AS monthly_listeners,
        MAX(CASE WHEN platform = 'tiktok' AND metric = 'tiktok_followers' THEN latest_value END) AS tiktok_followers,
        MAX(CASE WHEN platform = 'instagram' AND metric = 'instagram_followers' THEN latest_value END) AS ig_followers,
        MAX(CASE WHEN platform = 'youtube_api' AND metric = 'subscriber_count' THEN latest_value END) AS yt_subs
    FROM daily_summaries
    WHERE date = CURRENT_DATE  -- or latest_date pattern
    GROUP BY entity_id
),

-- Scale score 0-30
scale_score AS (
    SELECT
        entity_id,
        LEAST(30,
            CASE
                WHEN monthly_listeners >= 30000000 THEN 15
                WHEN monthly_listeners >= 10000000 THEN 12
                WHEN monthly_listeners >= 1000000 THEN 8
                WHEN monthly_listeners >= 100000 THEN 4
                ELSE 0
            END
            + CASE
                WHEN tiktok_followers >= 50000000 THEN 10
                WHEN tiktok_followers >= 10000000 THEN 7
                WHEN tiktok_followers >= 1000000 THEN 4
                WHEN tiktok_followers >= 100000 THEN 2
                ELSE 0
            END
            + CASE
                WHEN ig_followers >= 50000000 THEN 5
                WHEN ig_followers >= 10000000 THEN 3
                WHEN ig_followers >= 1000000 THEN 1
                ELSE 0
            END
        ) AS scale_score
    FROM audience_scale
)
```

Then either:

- **Option A (cleanest):** Add `scale_score * 0.20` as a 5th component of the composite, rebalancing weights to 0.30/0.20/0.15/0.15/0.20 (health/momentum/catalog/discovery/scale).
- **Option B (less invasive):** Fold `scale_score` into the existing `health_score` by adding it as a sub-component before the LEAST(100,...) clamp in `entity_health.sql`. This removes the megastar-ceiling problem without changing `artist_score.sql`.

I'd recommend Option A — scale is a different _kind_ of signal than health, and conflating them dilutes both.

After this fix, Addison Rae should score:

- Health 52 + Momentum ~70 (after Bugs 1+2 fixed) + Catalog ~75 (after Bug 1 fixed) + Discovery ~60 + Scale ~28
- = 52*0.30 + 70*0.20 + 75*0.15 + 60*0.15 + 28\*0.20 = 15.6 + 14 + 11.25 + 9 + 5.6 = **~55** still
- Hmm — the multiplier needs to be higher OR scale needs more weight, OR the scale floor needs to lift the ceiling. Suggest weighting tier of 0.25–0.30 for scale, or applying it as a multiplicative bonus on the composite for top-tier artists.
- Alternative shape: cap the composite below scale_score's tier — e.g., monthly_listeners ≥ 30M floors the artist at "Strong" regardless of momentum.

The point is: the _architecture_ of the score needs scale baked in at the formula level, not just the inputs.

### Fix 4 — Tier thresholds may need rebalancing too (P2)

Even after Fixes 1–3, the current thresholds (≥80 elite, ≥60 strong, ≥40 developing) might still leave the distribution skewed. Worth running a histogram of `artist_score` across all 50k artists post-fix and rebalancing thresholds based on actual percentile distribution (e.g., top 1% = elite, top 10% = strong, top 30% = developing, etc.).

## What the frontend can do in the meantime

Honestly, not much — the data is wrong at the source. Options:

1. **Hide the tier badge until fixes ship.** Show only the numeric score without the "DEVELOPING" label. Reduces user confusion when looking at megastars.
2. **Add a banner on artist profiles** — "Scoring system in calibration — values may not reflect artist scale." Honest and buys time.
3. **Build an admin override** — let label users manually tier their priority artists for now. (Probably overkill for a temporary issue.)

Recommend option 1 as the lightest-touch interim fix. I can ship that today if you want — flag in `OverviewTab.tsx:217-222` to hide the badge when `artist_score < 60` AND `monthly_listeners > 5M` (i.e., the obvious mismatch case).

## Files to look at (backend repo)

- `dbt/wavebound/models/layer1_compression/artist_catalog_summary.sql` — Bug 1
- `dbt/wavebound/models/layer1_health/cross_platform_signal.sql` — Bug 2
- `dbt/wavebound/models/layer1_health/entity_health.sql` — Bug 3 (algorithm)
- `dbt/wavebound/models/layer2_intelligence/artist_score.sql` — composite + tier thresholds

## Validation after fixing

A validation query that should pass after all three fixes:

```sql
SELECT canonical_name, artist_score, tier, health_score, momentum_score, catalog_score, discovery_score
FROM artist_score
WHERE canonical_name IN ('Drake','Taylor Swift','The Weeknd','Bad Bunny','Beyoncé','Sabrina Carpenter')
ORDER BY artist_score DESC;

-- Expected: all 6 in 'elite' or 'strong' tier (score ≥ 60).
-- If any of these megastars are 'developing' after the fixes, something is still broken.
```

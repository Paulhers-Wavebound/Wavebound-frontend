# 2026-04-13 — Vault TikTok/YouTube columns

## Problem

Paul noticed that in the Vault ("the database") the Platform Trends table showed Spotify and Shazam values but the TikTok and YouTube columns were entirely blank — every row rendered "—". He asked whether we were tracking follower/subscriber counts on those platforms at all.

## Investigation

Both scrapers are healthy. Raw data lives in `wb_observations`:

- `tiktok.tiktok_followers` → 160,067 rows, latest 2026-04-12
- `youtube_api.subscriber_count` → 72,587 rows, latest 2026-04-12

`daily_summaries.latest_value` is 100% filled for both metrics. But `daily_summaries.pct_change_7d` is **0% filled** for them, and `artist_score.tiktok_trend` / `youtube_trend` are NULL for **all 22,734 rows** on the latest snapshot. Spotify fills ~67% for comparison.

**Conclusion:** scraping is fine, the dbt models that produce `daily_summaries.pct_change_7d` and `artist_score.{tiktok,youtube}_trend` don't pick up the `tiktok_followers` / `(youtube_api, subscriber_count)` tuples — likely wrong metric keys. This is a backend fix, documented in `docs/handoffs/backend-todo.md` under the new "2026-04-13" block.

## What changed — frontend mitigation

### `src/hooks/useArtistDatabase.ts`

- New `DailySummaryRow` interface.
- Added `tiktok_followers_latest: number | null` and `youtube_subscribers_latest: number | null` to `MergedArtistRow`.
- New `socialQuery` — fetches `daily_summaries` filtered to `(tiktok, tiktok_followers)` and `(youtube_api, subscriber_count)` for the current page's entity_ids, date ≥ 7 days ago, ordered date desc. Reduces in JS to the newest value per entity/metric.
- Merge step populates the two new fields on every row.
- Added `socialQuery.error` to the error bubble-up.

### `src/components/label/database/columns.ts`

- Renamed "TikTok" → "TikTok %" and "YouTube" → "YT %" inside the Platform Trends group so it's unambiguous that those are deltas.
- Added two new columns in the same group using the existing `bigNumber` formatter:
  - `tiktok_followers_latest` → "TT Followers"
  - `youtube_subscribers_latest` → "YT Subs"
- Columns are not server-sortable (no `sortKey`) — they come from the supplementary query, not from `artist_score`.

### `docs/handoffs/backend-todo.md`

New block "NEW (2026-04-13): `artist_score` and `daily_summaries` — TikTok/YouTube trends never populate" with the SQL findings, hypothesis, fix checklist, and a note that the frontend mitigation can be dropped once `artist_score` carries clean trend values.

## What was tested

- `npx tsc --noEmit` → clean.
- Raw DB queries (documented in the backend handoff) confirm the data source is populated.

## What Paul should verify in the browser

1. Load `/label/database` (the Vault).
2. Confirm new columns "TT Followers" and "YT Subs" appear inside the Platform Trends group.
3. Scroll to an artist Paul knows is large (e.g. a major-label pop star) — those rows should show compact-formatted follower / subscriber counts (e.g. `12.5M`, `476M`).
4. Trend % columns (TikTok %, YT %) will still be "—" until the backend dbt fix lands. That is expected.

## While I was in here, I also recommend (ranked by impact)

1. **Backfill the `daily_summaries.pct_change_7d` for TikTok/YouTube in the dbt layer.** That's the real fix — until it lands, we have blank trend columns. The backend handoff has a full SQL reproduction. This should be the next backend session.
2. **Sort-on-merged-columns** — `tiktok_followers_latest` and `youtube_subscribers_latest` aren't server-sortable because they don't live on `artist_score`. If Paul wants to sort the Vault by "who has the most TikTok followers," we either need to add these to `artist_score` (cleanest) or add client-side sort fallback. Worth discussing.
3. **Drop the mitigation query once the backend lands** — the `socialQuery` block in `useArtistDatabase.ts` becomes dead weight after dbt is fixed. The handoff already notes this. Add a tracking TODO comment if we don't want to lose it.
4. **Fill-rate audit endpoint** — given how often we discover columns silently going NULL (Spotify trends only 67% filled, TikTok/YT at 0%), a tiny `/dev/fill-rate` utility page that shows per-column NULL percentages on `artist_score` would have caught this in 30 seconds instead of a round of SQL. Quick build, big payoff.
5. **"Data freshness" row on the Vault header** — show the snapshot date from `daily_summaries` alongside the existing `artist_score` date so it's obvious when one is stale relative to the other.

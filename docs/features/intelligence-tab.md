# Intelligence Tab — Artist Detail

**What it does:** Displays comprehensive artist intelligence data (score, alerts, platform signals, TikTok profile, catalog, sentiment, geographic markets) in a single tab on the artist detail page.

**Who uses it:** Label managers reviewing artist health, momentum, and market opportunities.

## Correct Behavior

- Default tab on artist detail page (replaces the removed "Intelligence Report" HTML tab)
- Resolves `entity_id` from `wb_entities` using the artist name (case-insensitive)
- Fetches all data in parallel from 4 edge function endpoints + 2 direct DB queries
- Shows loading spinner while resolving entity and fetching data
- Graceful empty states for each section when data is null
- "No entity" state when artist isn't linked in the intelligence pipeline yet

## Sections (top to bottom)

1. **Score Hero Card** — Artist score (0-100), tier badge, trend arrow, global rank, 4 sub-score bars, 30-day sparkline
2. **Alerts Feed** — Priority-sorted alerts with severity color coding (celebration/warning/info) and type icons
3. **Platform Signals** — Spotify/TikTok/YouTube/Shazam trend bars, cross-platform signal badge
4. **TikTok Profile Card** — Grade (A-F), posting consistency, avg plays, engagement rate, original sound %
5. **Catalog Intelligence** — Catalog status, daily streams, top songs with velocity, cross-platform conversion opportunities
6. **Fan Sentiment** — Sentiment/energy ring gauges, theme chips from comment analysis
7. **Geographic Markets** — Filterable market list with strength indicators, opportunity scores, and recommended actions

## Layout

- Score Hero Card: full width
- Alerts + Catalog: left column
- Platform Signals + TikTok Profile + Fan Sentiment: right column
- Geographic Markets: full width

## Edge Cases

- `sparkline` may have < 30 entries (data started April 5)
- `sentiment` is null for artists without TikTok comments
- `catalog` is null for artists without streaming data
- All trends show "stable" until 7+ days of history accumulates (~April 13)
- `tiktok_grade` will be D/F for most artists until more video data
- Entity resolution may fail if artist_intelligence.artist_name doesn't match wb_entities.canonical_name exactly

## API Endpoints Used

- `GET /functions/v1/get-artist-card?entity_id=<uuid>`
- `GET /functions/v1/get-artist-alerts?entity_id=<uuid>`
- `GET /functions/v1/get-market-map?entity_id=<uuid>`
- Direct: `artist_tiktok_profile` table
- Direct: `catalog_tiktok_performance` table

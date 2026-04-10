# Content & Social Intelligence View — Full Overhaul

**Date:** 2026-04-09
**Context:** Columbia meeting prep — sparse intelligence view needed to become a showstopper executive dashboard

## What Changed

### Files Modified

- `src/hooks/useContentIntelligence.ts` — expanded from 7 to 17 Supabase queries, ~120 new data fields
- `src/components/label/intelligence/ContentIntelligenceView.tsx` — rebuilt with 12 sections from 6
- `src/components/label/intelligence/FanSentiment.tsx` — null guard fix for `themes.length`
- `src/components/label/intelligence/CoverageGaps.tsx` — null guard fix for `coverage.missing`

### New Data Sources Added

1. `artist_score` — composite 0-100 score, tier, trend, sub-scores, platform trends, catalog metrics
2. `artist_tiktok_profile` — TikTok grade (A-F), posting stats, engagement
3. `artist_audience_footprint` — cross-platform followers with 7d growth deltas
4. `artist_format_performance` — per-format breakdown (multiple rows)
5. `artist_comment_pulse` — rich sentiment with intent breakdown, top comments, content ideas
6. `artist_playlist_intelligence` — playlist reach, positions, top songs
7. `artist_momentum` — 30-day daily scores for sparkline chart
8. `artist_streaming_pulse` — Spotify/Kworb/Deezer vitals with 7d deltas
9. `artist_touring_signal` — touring status, upcoming events, new announcements
10. `song_velocity` — per-song velocity classification with daily streams and 7d change
11. `market_opportunity_v2` — top expansion markets with spillover predictions, entry songs, revenue estimates

### New Sections

1. **Content Command Center** (hero) — artist score, tier/trend badges, sub-score bars, platform trends, momentum sparkline
2. **TikTok Profile** — grade badge, engagement, posting stats
3. **Audience Footprint** — cross-platform follower bars with growth deltas
4. **Format Performance** — Recharts horizontal bar chart + detailed table
5. **Streaming Pulse** — Spotify ML, daily streams, catalog streams, Kworb rank
6. **Fan Comment Pulse** — gauges, intent breakdown, top comments, AI content ideas, fan requests
7. **Playlist Intelligence** — placements, reach, top playlist songs
8. **Structured Brief** — AI-generated action items checklist + urgency-coded insight cards
9. **AI Brief HTML** — moved to bottom (data-first, narrative-last)
10. **Catalog Velocity Grid** — per-song streaming table with daily streams, 7d change %, velocity class, peak ratio indicator
11. **Touring Signal** — touring status badge, upcoming event counts, new announcements this week
12. **Where Next? Market Expansion** — top expansion markets grouped by urgency (Act Now/Plan/Monitor) with spillover predictions, entry songs, revenue estimates, discovery signals

### Enhanced Existing Sections

- Content Evolution: mood shift, new/dropped format chips, hook/views evolution
- Content Health: video count breakdown, virality ratio, pinned stats, top sound, hashtags
- Anomalies: severity-based left border accent colors

## Why

The Content & Social intelligence tab was showing mostly dashes and empty states. We have 13+ dbt models with 200+ columns of rich data that weren't being pulled. Columbia meeting is tomorrow.

## What Was Tested

- `npx tsc --noEmit` — clean pass, zero errors
- All null guards verified in code — every section handles missing data gracefully

## What to Verify in Browser

1. Navigate to artist detail page (e.g., Addison Rae) with "Content & Social" role selected
2. Verify Content Command Center shows score + tier + trend + sub-scores + sparkline
3. Check TikTok Profile and Audience Footprint populate with real data
4. Verify Format Performance chart renders correctly (Recharts horizontal bars)
5. Check Streaming Pulse shows Spotify metrics with deltas
6. Check Comment Pulse has gauges + intent bars + top comments
7. Test an artist with minimal data — sections should hide gracefully
8. Verify responsive layout at smaller viewport widths

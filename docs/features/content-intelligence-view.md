# Content & Social Intelligence View

**What it does:** Full-stack artist intelligence dashboard for the "Content & Social" role, pulling from 14 dbt models to show every dimension of an artist's content performance, audience, streaming, and sentiment.

**Who uses it:** Label content & social teams evaluating artist performance and planning content strategy.

## Correct Behavior

- Content Command Center shows artist score (0-100), tier badge, trend arrow, global rank, 4 sub-score bars, 30-day momentum sparkline, and platform trend pills
- TikTok Profile shows grade (A-F), posting consistency, engagement rate, avg plays, posts/week, total videos, best video plays
- Audience Footprint shows cross-platform follower counts with proportional bars and 7d growth deltas, dominant/fastest growing platform badges
- Format Performance shows Recharts horizontal bar chart + detailed table with per-format video count, avg views, hook/viral scores, engagement, vs-median multiplier
- Streaming Pulse shows Spotify monthly listeners, daily streams, catalog streams, followers — all with 7d deltas, plus Kworb rank and Deezer fans
- Fan Comment Pulse shows sentiment/energy gauges, audience vibe badge, intent breakdown bars, theme chips, top 3 comments, AI content ideas, fan requests
- Playlist Intelligence shows songs in playlists, total placements, total reach, best placement, top playlist songs mini-table
- Content Evolution shows strategy label, format shifts, views/hook score evolution, mood shift, new/dropped format chips
- Content Health shows cadence, consistency, engagement, performance trend, video count breakdown, virality ratio, pinned stats, top sound, hashtags
- Anomalies shows recent 7-day anomalies with severity-colored left borders
- Structured Brief shows AI-generated action items checklist and urgency-coded insight section cards
- AI Brief HTML renders the full narrative brief at the bottom

## Edge Cases

- **No entity_id AND no handle:** Shows "No content intelligence data available"
- **artist_score missing:** Content Command Center hides entirely, rest of page still renders
- **No format_performance rows:** Falls back to simple FormatDNA chips from artist_content_dna
- **No comment data:** Shows "No comment analysis data" empty state
- **No playlist data:** Shows "No playlist placements found"
- **No streaming pulse data:** Streaming Pulse section hides entirely
- **No momentum data:** Sparkline hides in Command Center
- **No brief_json:** Structured Brief section hides; HTML brief still renders if available
- **All JSONB fields (themes, intents, requests, ideas, top_playlist_songs):** Guarded with Array.isArray() before rendering

## Key Files

- `src/hooks/useContentIntelligence.ts` — data hook (14 parallel Supabase queries)
- `src/components/label/intelligence/ContentIntelligenceView.tsx` — view component (12 sections)
- `src/pages/label/ArtistIntelligence.tsx` — page component, renders this view when role === "content"

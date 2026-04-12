# Artist Page — 4-Tab Architecture (Content & Social Role)

## What it does
Reorganizes the Content & Social artist page from a 2-tab (Intelligence/Profile) layout with 2,500px vertical scroll into a decision-focused 4-tab structure where each tab answers one question.

## Who uses it and why
VP of Content & Social at a major label. Each tab maps to a different moment in their daily operating rhythm (Content Bible Section 3).

## Tabs

### Overview — "Should I pay attention right now?" (Morning scan, 30s)
- Profile hero (avatar, name, handles, platform followers, last post)
- AI Focus Pick (weekly_pulse from Opus)
- Score card + sub-scores + release readiness donut
- Platform trend pills (Spotify/TikTok/YouTube/Shazam)
- RMM Performance Trend chart (organic/all toggle)
- Top anomalies + risk alerts (if any)

### Content — "What content should we create?" (Content architecture, 5-10 min)
- Format Performance (bar chart + expandable table with vs-median multipliers)
- Content Activity + Evolution (cadence, consistency, format shifts)
- Fan Comment Pulse (sentiment, energy, intent radar, themes, AI content ideas, fan requests)
- TikTok Profile (grade, consistency, engagement, stats)

### Sounds — "Which music is hot?" (A&R alignment, 2-5 min)
- Sound Performance on TikTok (songs with UGC traction)
- Catalog Velocity (all songs with daily streams, 7d%, velocity class)
- Streaming Pulse (Spotify listeners, streams, Kworb rank)
- Playlist Intelligence (placements, reach, positions)

### Growth — "Where is this artist expanding?" (Strategy planning)
- Audience Footprint (platform reach bars with follower counts)
- Market Expansion ("Where Next?" — grouped by urgency)
- Touring Signal (status, upcoming events)
- Roster Rank (position vs roster with histogram)

### Persistent across all tabs
- Back button + Role selector
- Deliverable Links (Content Plan, 30-Day Plan, Artist Brief)
- Danger Zone (admin only)

## How tabs map to the Content Bible (Section 7)
- 7.1 Retention Topology → Content tab (format performance)
- 7.2 Hook Archetype Efficiency → Content tab (hook scores)
- 7.3 Audience Footprint Shift → Growth tab (audience footprint)
- 7.4 Platform Format Mix → Content tab (format chart)
- 7.5 Comment Pulse & Intent → Content tab (fan comment pulse)
- 7.6 Attributed Streaming Lift → Sounds tab (catalog velocity)
- 7.7 Catalog Fuel Index → Sounds tab (sound performance)
- 7.8 Competitive Gap → Growth tab (roster rank)

## URL scheme
- `/label/artists/:handle` → Overview (default)
- `/label/artists/:handle?tab=content`
- `/label/artists/:handle?tab=sounds`
- `/label/artists/:handle?tab=growth`

## Marketing role
Marketing users see the existing Intelligence Briefing view (BriefingHero/SignalMap/etc.) — unchanged from before. The 4-tab structure is Content & Social only.

## Files
- `src/pages/label/LabelArtistProfile.tsx` — page orchestrator with tab routing
- `src/components/label/artist-tabs/shared.tsx` — shared helpers (fmtNum, StatChip, SectionCard, etc.)
- `src/components/label/artist-tabs/OverviewTab.tsx`
- `src/components/label/artist-tabs/ContentTab.tsx`
- `src/components/label/artist-tabs/SoundsTab.tsx`
- `src/components/label/artist-tabs/GrowthTab.tsx`
- `src/components/label/artist-tabs/DeliverableLinks.tsx`

## Edge cases
- No content intelligence data: shows dashed empty state
- Content intelligence loading: skeleton placeholders
- No weekly_pulse: AI Focus shows "not yet available" card
- No songs/streaming/growth data: tab-specific empty states
- Marketing role: bypasses tabs entirely, shows briefing view

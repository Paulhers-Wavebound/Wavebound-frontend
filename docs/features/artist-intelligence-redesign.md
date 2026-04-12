# Artist Intelligence Page — Redesign (April 2026)

## What it does
Decision-focused artist intelligence page that surfaces AI analysis (Opus weekly_pulse) front and center, with compact data panels organized by information hierarchy.

## Who uses it and why
VP of Content/Social at major labels. They need to answer "What should I do about this artist this week?" in under 30 seconds of looking at the page.

## Layout (top to bottom)

### 1. Artist Header (compact)
- Name (Playfair Display), tier badge, sparkline inline
- One row of stats: Score, Trend, Markets, 7d momentum, catalog highlights
- ~80px total height — no hero card, no momentum bar

### 2. AI Focus (the star)
- `weekly_pulse.focused_sound`: title, reason (AI analysis with numbers), action (decision to make)
- `weekly_pulse.catalogue_alert`: old track resurging (if any)
- Old weekly_pulse format: extracts top item + content opportunities + avoid list
- Accent border, most visually prominent element on the page

### 3. Two-Column Layout
**Left (flexible width):**
- **Catalog Pulse**: Top 5 songs by velocity, compact rows (icon, name, velocity label, streams/day, 7d%). Expandable.
- **Top Opportunities**: Top 3 markets, compact rows (flag, country, type badge, one-line why, score). Expandable.

**Right (340px):**
- **Audience Pulse**: Sentiment score circle, vibe badge, themes, AI content ideas
- **Platform Status**: Spotify/TikTok/YouTube/Shazam trend bars
- **Roster Rank**: #N of M, mini histogram, vs-avg comparison
- **Risks**: Icon + one-line per risk (only shown if risks detected)

### 4. Bottom Bar
- "Bottom Line" — generated narrative summary with accent border
- "Likely Next" — predicted market entries as inline chips with probability %

## Data sources
- `artist_intelligence.weekly_pulse` — fetched directly (new addition)
- `artist_intelligence.weekly_pulse_generated_at` — timestamp display
- `get-artist-card` edge function — score, tier, sentiment, catalog, momentum, sparkline
- `song_velocity` table — catalog pulse
- `market_opportunity_v2` — opportunities, predictions
- `artist_score` — roster ranking
- `market_spillover` — predicted entries

## Correct behavior
- AI Focus card shows focused_sound title prominently with the full AI reasoning
- Falls back gracefully for old weekly_pulse format (items, avoid, content_opportunities)
- Two-column layout stacks to single column below 800px
- Classic view toggle preserved — shows old BriefingHero/SignalMap/etc layout
- Empty states for missing data (no pulse, no entity, loading)
- Content role shows separate ContentIntelligenceView (unchanged)

## Edge cases
- **No weekly_pulse**: Shows "AI focus analysis not yet available" dashed card
- **Old format weekly_pulse** (pre April 11): Extracts top item as focus, shows content_opportunities and avoid list
- **Error in pulse**: Shows error message from `pulse.error`
- **No entity in pipeline**: Shows "not yet available" + suggests Classic view
- **Briefing loading**: Spinner with "Loading intelligence..."
- **No opportunities**: "No actionable opportunities right now"
- **No risks**: Risks card hidden entirely
- **No sentiment data**: Audience Pulse hidden
- **< 2 roster artists**: Roster Rank hidden

## Files
- `src/pages/label/ArtistIntelligence.tsx` — page orchestrator
- `src/components/label/briefing/ArtistHeader.tsx` — compact header
- `src/components/label/briefing/AIFocus.tsx` — weekly_pulse display
- `src/components/label/briefing/CatalogPulse.tsx` — song velocity rows
- `src/components/label/briefing/TopOpportunities.tsx` — compact market opportunities
- `src/components/label/briefing/ContextPanel.tsx` — right column (audience, platforms, roster, risks)
- `src/components/label/briefing/BottomBar.tsx` — bottom line + predictions

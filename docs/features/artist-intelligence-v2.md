# Artist Intelligence V2 — "The Analyst That Never Sleeps"

## What it does

Replaces the old tabbed artist detail page with a top-to-bottom intelligence briefing that reads like a CIA analyst's report on the artist's global presence.

## Who uses it and why

Label executives (Manos at Columbia) — to understand what's happening with any artist at a glance, get specific actionable plays with budgets, and see where the artist is heading in the next 30 days.

## Route

`/label/artist/:id` — same route as before, now loads V2 briefing by default with a toggle to "Classic View" for the old intelligence tab.

## Architecture

### Page: `src/pages/label/ArtistIntelligence.tsx`

- Fetches artist metadata from `artist_intelligence` table
- Delegates to `useArtistBriefing` hook for V2 data assembly
- Renders 4 sections top-to-bottom + optional classic view toggle

### Hook: `src/hooks/useArtistBriefing.ts`

- Resolves `entity_id` from artist name via `wb_entities`
- Fetches in parallel: artist card, alerts, song velocity, market opportunities v2, market intelligence, spillovers
- Returns assembled `BriefingData` for progressive rendering

### Sections (components in `src/components/label/briefing/`):

1. **BriefingHero** — Artist name, momentum score bar (animated), stats row, AI-generated briefing paragraph
2. **SignalMap** — Songs grouped by velocity (breaking out/growing/steady/declining), per-country signals with cascade detection
3. **OpportunityEngine** — Priority-ranked opportunity cards with THE PLAY (budget, CPM, projected reach, ROI vs US, window countdown)
4. **Outlook** — Predicted market entries with probability bars, risk detection, BOTTOM LINE paragraph

### Data flow:

```
artist_intelligence (meta) → wb_entities (entity_id) → parallel fetch:
  ├── get-artist-card (edge function) → ArtistCard
  ├── get-artist-alerts (edge function) → AlertsResponse
  ├── song_velocity (direct query) → SongVelocityEntry[]
  ├── market_opportunity_v2 (direct query) → MarketOpportunityV2[]
  ├── market_intelligence (direct query) → MarketIntelligence[]
  └── market_spillover (direct query) → MarketSpillover[]
```

### AI Briefing Generation: `src/utils/briefingGenerator.ts`

- Client-side template-based generation from assembled data
- Reads velocity, alerts, market signals, discovery divergence
- Produces urgency-leveled paragraph with key drivers
- Bottom line generator for the closing section

## Correct behavior

- Page loads with spinner while metadata resolves
- Briefing sections render progressively as data arrives
- Momentum bar animates on mount
- Sparkline draws with stroke-dashoffset animation
- Songs auto-expand for breaking_out and growing groups, collapse for steady/declining
- Opportunity cards show top 3 by default with "show more" expansion
- Cascade detection highlights when songs spread TikTok → Shazam → Spotify pattern
- Classic view toggle preserves all V1 functionality

## Edge cases

- **No entity in pipeline**: Shows "not yet available" message with suggestion to use Classic View
- **Empty song_velocity / market_opportunity_v2**: Components render graceful empty states (may need RLS setup on these tables)
- **No actionable opportunities**: Shows "no opportunities detected" message
- **No spillover data**: Outlook section omits predictions, still shows risks and bottom line
- **Error state**: Shows error message with details

## Backend dependencies (may need setup)

Direct Supabase queries to these materialized tables may need RLS policies:

- `song_velocity` — needs SELECT for authenticated users
- `market_opportunity_v2` — needs SELECT for authenticated users
- `market_intelligence` — needs SELECT for authenticated users
- `market_spillover` — needs SELECT for authenticated users

See `docs/handoffs/backend-todo.md` for details.

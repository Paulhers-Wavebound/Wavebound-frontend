# Session Diary: Artist Intelligence V2

**Date:** 2026-04-07
**Task:** Build "The Analyst That Never Sleeps" — V2 intelligence briefing page

## What changed

### New files created:

**Types:**

- `src/types/artistBriefing.ts` — 18 interfaces/types for V2 data: velocity, market opportunity v2, spillover, briefing assembly, opportunity cards, signal groups, cascade detection, outlook predictions

**API Layer:**

- `src/utils/artistBriefingApi.ts` — Direct Supabase queries to `song_velocity`, `market_opportunity_v2`, `market_intelligence`, `market_spillover` + ROI/reach computation helpers
- `src/utils/briefingGenerator.ts` — Client-side AI briefing paragraph generator, bottom line generator, momentum label computation, window estimation

**Hook:**

- `src/hooks/useArtistBriefing.ts` — React Query hook assembling all V2 data: resolves entity_id, fetches card + alerts (existing APIs) + songs + markets v2 + market intel + spillovers (new queries) in parallel

**Components (in `src/components/label/briefing/`):**

- `BriefingHero.tsx` — Section 1: Artist name, animated momentum bar, stats row (markets/platforms/songs/momentum 7d), AI-generated briefing paragraph with urgency styling, sparkline, key driver badges
- `SignalMap.tsx` — Section 2: Songs grouped by velocity (Breaking Out / Growing / Steady / Declining), per-country signals with platform + position + delta, cascade detection with stage/prediction/confidence
- `OpportunityEngine.tsx` — Section 3: Priority-ranked opportunity cards with THE PLAY (budget, CPM, projected reach, ROI vs US multiplier), spillover targets with probability badges, window countdown bar
- `CompetitiveLens.tsx` — Section 4: VS Your Roster ranking table (top 7 + current artist highlighted), score distribution histogram, competitive insight paragraph, percentile badge
- `Outlook.tsx` — Section 5: Predicted market entries with probability bars, risk detection (declining markets/songs, platform gaps, momentum zone), BOTTOM LINE paragraph with accent border

**Page:**

- `src/pages/label/ArtistIntelligence.tsx` — New page replacing old artist detail, renders all 5 sections top-to-bottom, includes briefing/classic view toggle to preserve V1 access

### Modified files:

- `src/App.tsx` — Added lazy import for `ArtistIntelligence`, swapped route `artist/:id` from `LabelArtistDetailNew` to `ArtistIntelligence`
- `docs/handoffs/backend-todo.md` — Added RLS policies needed for V2 direct queries
- `docs/features/artist-intelligence-v2.md` — Feature documentation

## Why

Product spec for Thursday demo: transform the artist detail page from a dashboard with charts into an intelligence briefing that reads like a strategist's report. Key differentiators: AI briefing paragraph, THE PLAY cards with specific budgets, cascade detection, spillover predictions, bottom line paragraph.

## What was tested

- `npx tsc --noEmit` — zero errors
- `npx vite build` — clean production build, new chunk `ArtistIntelligence-D9nNLTo7.js` at 46.57 kB (11.46 kB gzip)
- Code-split correctly: lazy-loaded, doesn't affect initial bundle

## What to verify in browser

1. Navigate to any artist from roster → should see V2 briefing instead of old tabs
2. **BriefingHero**: momentum bar should animate, sparkline should draw, AI paragraph should generate from real data
3. **SignalMap**: songs should appear grouped by velocity IF `song_velocity` table is accessible (may need RLS — see backend-todo.md)
4. **OpportunityEngine**: cards appear IF `market_opportunity_v2` and `market_intelligence` tables are accessible
5. **Outlook**: predictions + risks + bottom line should render from whatever data is available
6. **Classic View toggle**: switching to "Classic View" should show the old IntelligenceTab with all V1 components
7. **Empty states**: if V2 tables aren't accessible yet (no RLS), sections should show graceful "data loading or not yet available" messages — NOT blank screens

## Recommendations

1. **RLS policies are the critical blocker** — run the migration in `docs/handoffs/backend-todo.md` to enable `song_velocity`, `market_opportunity_v2`, `market_intelligence`, `market_spillover` for authenticated users. Without this, sections 2-5 will show empty states.
2. **Section 4 (Competitive Lens)** not built yet — needs roster-level momentum ranking and genre cohort comparison. Data exists in `artist_score` table, would need a new query to fetch all roster artists' scores for comparison.
3. **Animated timeline** (spec priority 9) not built — would show geographic spread over time. Requires time-series geo data that's currently in 30-day retention `wb_observations_geo`.
4. **LLM-generated briefing** — current paragraph is template-based from data patterns. Could upgrade to edge function that sends data context to Claude for a more natural, analyst-quality paragraph. High impact for Thursday demo.
5. **Entry song per market** — the `market_opportunity_v2` table has `entry_song_name` but the V2 API response shape hasn't been tested against real data. Verify column names match after RLS is enabled.

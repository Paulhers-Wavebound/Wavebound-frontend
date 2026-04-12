# Session Diary — 2026-04-11 — Artist Intelligence Redesign

## What changed
Complete redesign of the artist intelligence page (`/label/artists/:id`) marketing briefing view.

### New components created:
- `src/components/label/briefing/ArtistHeader.tsx` — compact header with name, tier, stats row, sparkline
- `src/components/label/briefing/AIFocus.tsx` — weekly_pulse focused sound + catalogue alert + old format fallback
- `src/components/label/briefing/CatalogPulse.tsx` — compact song velocity rows with expand
- `src/components/label/briefing/TopOpportunities.tsx` — compact market opportunity rows with expand
- `src/components/label/briefing/ContextPanel.tsx` — right column: audience pulse, platforms, roster rank, risks
- `src/components/label/briefing/BottomBar.tsx` — bottom line narrative + predicted market entries

### Modified:
- `src/pages/label/ArtistIntelligence.tsx` — new layout, weekly_pulse fetch added to metadata query, classic view preserved as toggle

### Kept as-is (for classic view):
- BriefingHero, SignalMap, OpportunityEngine, CompetitiveLens, Outlook — all preserved

## Why
The old layout was 5 heavy sections stacked vertically with no hierarchy. The AI Focus Pick (weekly_pulse.focused_sound) — the most actionable data on the page — wasn't surfaced at all on the intelligence page. The redesign puts the AI judgment first, uses a two-column layout to reduce scroll depth, and condenses each section to its essential information.

## What was tested
- `npx tsc --noEmit` — passes clean, zero errors
- Preview server starts successfully (auth-protected page can't render in headless)

## What to verify in browser
1. Navigate to any artist intelligence page (e.g., The Chainsmokers, Malcolm Todd, Addison Rae)
2. Verify the new layout renders: compact header → AI Focus card → two columns → bottom bar
3. Check AI Focus card shows the weekly_pulse.focused_sound content
4. For artists with old format pulse (Aden Foyer, Kilu, etc.), verify content opportunities and avoid list render
5. Toggle to "Classic" view — verify old layout still works
6. Switch to content role — verify ContentIntelligenceView unchanged
7. Check responsive: narrow the browser below 800px — columns should stack
8. Check an artist without entity data — should show "not yet available" state

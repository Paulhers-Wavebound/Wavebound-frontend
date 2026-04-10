# Session: The Pulse — Live Music Intelligence Globe

**Date:** 2026-04-07

## What changed

### New files

- `src/types/pulse.ts` — Raw backend types + view model types for globe data, country detail, flow arcs, alerts
- `src/components/pulse/PulseGlobe.tsx` — Core 3D globe using react-globe.gl with hex polygon country overlays (genre-colored), animated dashed flow arcs, atmosphere glow, auto-rotation. XSS-safe tooltips, error state for failed atlas fetch with retry.
- `src/components/pulse/LiveCounter.tsx` — Bottom bar with animated count-up numbers, pulsing LIVE dot, cycling alert ticker
- `src/components/pulse/CountrySidebar.tsx` — Slide-in panel on country click with song list (roster first), velocity badges, genre breakdown bars, platform split. Escape key closes, ARIA dialog role.
- `src/components/pulse/pulseConstants.ts` — Genre/velocity color maps, ISO3-to-ISO2 and numeric-to-ISO2 lookups for world-atlas matching
- `src/components/pulse/mockPulseData.ts` — 47 countries, 12 flow arcs, 8 alerts, full Nigeria country detail, stub generator for other countries
- `src/pages/label/ThePulse.tsx` — Full-viewport page with responsive ResizeObserver, error boundary around WebGL globe, loading/error states
- `src/hooks/use-pulse-data.ts` — React Query hooks for globe-data edge function. Transforms raw backend shapes to view models. Graceful fallback to mock data on failure.
- `docs/features/the-pulse.md` — Feature documentation

### Modified files

- `src/App.tsx` — Added lazy import for ThePulse, route at `/label/admin/pulse` (before LabelLayout route for specificity)
- `src/components/label/LabelSidebar.tsx` — Added Globe icon import, "The Pulse" nav item (admin-only)
- `src/pages/label/LabelLayout.tsx` — Added Globe icon import, "The Pulse" to command palette NAV_COMMANDS

### Dependencies added

- `react-globe.gl` — WebGL globe rendering (wraps three.js internally, no react-three-fiber needed)

## Why

Columbia Records US demo on Thursday in NYC (meeting with Manos, EVP Digital Marketing). This is the hero feature — a cinematic "war room" visualization showing global music intelligence.

## What was tested

- `npx tsc --noEmit` — clean pass, zero errors (2 passes: after initial build + after backend wiring)
- All TypeScript interfaces properly typed, raw → view model transform verified against SQL RPC output columns
- Mock data provides realistic coverage for demo flow
- Error boundary, XSS escaping, Escape key handler, world-atlas retry all implemented

## What to verify in browser

- Navigate to `/label/admin/pulse` — globe should render with night texture and hex overlays
- Countries should be colored by genre (Nigeria = teal/afrobeats, US = purple/hip hop, etc.)
- Hover countries for tooltip, click Nigeria for full sidebar detail
- Animated arcs should flow between countries with dashed animation
- Bottom counter bar should show animated numbers counting up
- Alert ticker should cycle through 8 alerts every 4 seconds
- Globe auto-rotates, stops on hover, drag to rotate manually
- Back button returns to dashboard
- "The Pulse" appears in sidebar nav (admin users only) and command palette (Ctrl+K)
- If globe-data edge function isn't deployed yet, should gracefully fall back to mock data
- Press Escape while sidebar is open — should close
- If world-atlas CDN fails, should show error with Retry button

## Backend integration status

- `globe-data` edge function verified at `/Users/palsundsbo/Projects/wavebound-backend/edge-functions/globe-data.ts`
- SQL RPCs in `/Users/palsundsbo/Projects/wavebound-backend/migrations/20260407_globe_data_rpcs.sql`
- Edge function needs deployment: `supabase functions deploy globe-data --project-ref kxvgbowrkmowuyezoeke`
- Hooks fall back to mock data on any fetch failure, so frontend works regardless

## Recommendations

1. **Deploy the edge function** — `globe-data` needs to be deployed before demo. Frontend gracefully falls back to mocks but real data is the wow factor.
2. **Country flag emojis** — The sidebar header could show flag emoji next to country name (2-char unicode trick from country codes).
3. **Genre wave toggle** — The spec includes an optional genre wave choropleth with time slider. Good stretch goal after core demo lands.
4. **Performance on mobile** — WebGL globe is CPU-intensive. Consider adding a `prefers-reduced-motion` check to disable auto-rotation and simplify hex resolution on mobile.
5. **Pre-cache the world-atlas GeoJSON** — Currently fetched from unpkg CDN on every mount. Could bundle it or serve from our own CDN for reliability during demo.

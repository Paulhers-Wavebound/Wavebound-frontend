# The Pulse — Live Music Intelligence Globe

## What it does

Cinematic 3D globe visualization showing real-time music intelligence across countries with genre-colored hex polygons, animated flow arcs, and a live activity counter.

## Who uses it and why

- **Label executives** (Columbia Records demo) — see global music intelligence at a glance, understand how songs spread between countries, identify breakout markets before competitors
- **Admin users only** — available via sidebar nav and command palette (Ctrl+K)

## Route

`/label/admin/pulse` — full-viewport page, no sidebar (renders outside LabelLayout)

## Correct behavior

- Globe loads with night-sky texture, atmosphere glow, and hex polygon overlays per country
- Countries colored by dominant genre (hip hop = purple, pop = pink, latin = orange, etc.)
- Country brightness/altitude scales with activity_score
- Animated dashed arcs show song travel paths between countries (color = genre)
- Globe auto-rotates at 0.3 deg/s, pauses on hover
- Hover country → tooltip with song count, platforms, dominant genre, new entries
- Click country → sidebar slides in from right with song list, genre breakdown, platform split
- Bottom bar shows live counters (animated count-up on mount) and cycling alert ticker
- Back button returns to `/label`

## Data sources (backend)

- `get_globe_data(p_label_id, p_date)` → countries, flows, counters, alerts
- `get_country_detail(p_country_code, p_label_id)` → song list for a country
- Currently using mock data (`mockPulseData.ts`) until RPCs are deployed

## Edge cases

- **Loading state**: "Loading globe data..." shown while world-atlas GeoJSON fetches
- **Empty country detail**: generated stub with "Sample Track" placeholder
- **WebGL not available**: globe.gl handles fallback internally
- **Small viewport**: sidebar maxWidth 90vw, counters wrap on narrow screens

## Files

- `src/pages/label/ThePulse.tsx` — page component
- `src/components/pulse/PulseGlobe.tsx` — globe with hex polygons and arcs
- `src/components/pulse/LiveCounter.tsx` — bottom bar with counters and alerts
- `src/components/pulse/CountrySidebar.tsx` — country detail slide-in panel
- `src/components/pulse/pulseConstants.ts` — genre colors, velocity colors, ISO code mappings
- `src/components/pulse/mockPulseData.ts` — mock data matching RPC schema
- `src/types/pulse.ts` — TypeScript interfaces

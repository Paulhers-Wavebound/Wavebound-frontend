# Expansion Radar — Mock Data Page

**Date:** 2026-04-01
**Task:** Build Expansion Radar page with hardcoded mock data for Columbia Records demo

## What Changed

### New Files

- `src/pages/label/LabelExpansionRadar.tsx` — Main page component with 8 sections
- `src/components/label/expansion/mockData.ts` — All mock data (artist, cities, opportunities, languages, niche proof, revenue)
- `src/components/label/expansion/ExpansionStats.tsx` — 4-card stats row with staggered fade-in
- `src/components/label/expansion/GeoMap.tsx` — World map with positioned city dots + rankings sidebar
- `src/components/label/expansion/OpportunityCard.tsx` — FOMO-style market expansion cards with evidence + strategy
- `src/components/label/expansion/LanguageSignal.tsx` — Comment language bars + content/audience mismatch alert
- `src/components/label/expansion/NicheProof.tsx` — Evidence cards from comparable artists
- `src/components/label/expansion/RevenueEstimate.tsx` — Revenue left on table with total rollup

### Modified Files

- `src/components/label/LabelSidebar.tsx` — Added "Expansion Radar" nav entry with Radar icon and orange "NEW" badge
- `src/App.tsx` — Added route `/label/expansion-radar`

## Why

Demo feature for Friday meeting with Head of Digital Marketing at Columbia Records. Shows WHERE an artist's audience is, WHERE it's NOT but SHOULD be, and WHAT TO DO about it — with projected revenue.

## Phase 2: Three.js 3D Globe (Palantir-grade)

Replaced the basic SVG map with a full 3D interactive globe using Three.js + @react-three/fiber + @react-three/drei.

### New Dependencies

- `three` + `@types/three` — 3D rendering engine
- `@react-three/fiber` — React bindings for Three.js
- `@react-three/drei` — Helper components (OrbitControls, Html overlays)

### Skills Installed

- `threejs-geometry` — Sphere, BufferGeometry, instancing patterns
- `threejs-interaction` — Raycasting, OrbitControls, hover/click handling
- `frontend-ui-animator` — Animation patterns and performance rules

### Globe Features

- Dark earth sphere with custom Phong material (#0a0f1a)
- Atmospheric glow via custom vertex/fragment shader (orange Wavebound tint)
- Latitude/longitude grid lines (subtle white, 4% opacity)
- City dots placed at real lat/lng coordinates (18 cities total)
- Color-coded dots: green (strong), yellow (growing), orange (untapped)
- Pulse animation on untapped city dots
- Glow halos around each dot (intensity responds to hover)
- Animated arcs from Oslo to untapped markets
- Click any dot to select it — shows tooltip with city name + listener count
- Hover changes cursor + enlarges dot
- OrbitControls: drag to rotate, scroll to zoom (clamped 2.5–6 distance)
- Slow auto-rotation (0.03 rad/s)
- Starfield background (2000 points)
- "Drag to rotate / Click dots" hint overlay
- HTML tooltips via drei `<Html>` component (tracks 3D position)

## Phase 3: Five Improvements

### 1. Post-processing bloom

- Installed `@react-three/postprocessing`
- Added `<EffectComposer>` + `<Bloom>` to the globe scene
- luminanceThreshold: 0.2, intensity: 0.8, mipmapBlur enabled
- Dots, arcs, and atmosphere glow now bloom naturally

### 2. Continent outlines

- Created `continentOutlines.ts` with 6 continent paths (~200 lat/lng points total)
- `<ContinentLines>` component renders them as line geometry on the sphere surface
- Subtle white at 8% opacity — recognizable shapes without overwhelming the grid
- Added inner blue atmosphere ring for depth

### 3. City click → scroll to opportunity card

- Clicking an untapped city dot on the globe resolves to a market name (e.g., "Brazil")
- Page auto-scrolls to the matching OpportunityCard with `scrollIntoView({ behavior: 'smooth' })`
- Card highlights with orange glow/border for 3 seconds then fades back
- Cards have `scrollMarginTop: 24` and `id` attributes for targeting

### 4. WebGL fallback

- `detectWebGL()` checks for webgl2/webgl/experimental-webgl support on mount
- If no WebGL, renders `GeoMapFlat` (the original SVG map) instead
- Shows "Switched to 2D map for performance" notice

### 5. FPS monitoring

- `<FPSMonitor>` component tracks frame times inside the Three.js render loop
- If FPS drops below 20 for 3 consecutive checks (~3 seconds), triggers fallback to flat map
- Graceful degradation — user sees the 3D globe if their machine handles it, flat map otherwise

### New files

- `src/components/label/expansion/continentOutlines.ts` — 6 continent lat/lng paths
- `src/components/label/expansion/GeoMapFlat.tsx` — flat SVG fallback map

### Modified files

- `src/components/label/expansion/GeoMap.tsx` — bloom, continents, FPS monitor, WebGL detection, onSelectMarket callback
- `src/components/label/expansion/OpportunityCard.tsx` — highlighted prop, id/data-market attrs, scrollMarginTop
- `src/pages/label/LabelExpansionRadar.tsx` — onSelectMarket handler with scroll + highlight + timeout

## Phase 4: Final Five Fixes

### 1. Code-split the route

- `React.lazy()` + `<Suspense>` in App.tsx for the Expansion Radar route
- **Result**: main bundle dropped from 4,977KB → 3,945KB (-1,032KB)
- Expansion Radar loads as separate chunk (1,005KB) only when navigated to

### 2. Functional artist selector

- Added second mock artist "Veira" (1.2M listeners, European-focused, Japan/Korea/India opportunities)
- `mockArtistRoster` array combines both artists' full data sets
- Dropdown selector in page header — click to switch artists
- All sections (stats, globe, opportunities, revenue, language, niche proof) swap data when switching
- Outside-click-to-close behavior on dropdown

### 3. Collapsible opportunity cards

- Cards have a click-to-toggle accordion — header always visible, body collapses
- Animated with `AnimatePresence` for smooth height transitions
- Collapsed header shows revenue preview (`+$4,200/mo`)
- `defaultExpanded` prop — first 2 cards open, rest collapsed
- ChevronDown rotates on toggle

### 4. CSS variable migration

- All 6 expansion components now use CSS variables with dark fallbacks
- Variables used: `--surface`, `--border-subtle`, `--ink`, `--ink-secondary`, `--ink-tertiary`, `--ink-faint`, `--accent`, `--green`, `--red`, `--overlay-hover`, `--card-edge`, `--surface-hover`, `--border-hover`, `--shadow-lg`
- Light mode will now work automatically when the label theme toggle is used

### 5. High-fidelity continent outlines

- Installed `topojson-client` + `world-atlas` npm packages
- `continentOutlines.ts` now imports Natural Earth 110m land data
- Extracts outer rings from MultiPolygon geometry, flips coords to [lat, lng]
- 125 polygon rings with ~5,000 points (vs previous 6 shapes / 200 points)
- Coastlines are now recognizable and accurate on the globe

### New dependencies

- `topojson-client` + `@types/topojson-client` — TopoJSON → GeoJSON conversion
- `world-atlas` — Natural Earth 110m land boundaries

### Files modified

- `src/App.tsx` — lazy import + Suspense wrapper
- `src/pages/label/LabelExpansionRadar.tsx` — artist roster selector, CSS variables
- `src/components/label/expansion/OpportunityCard.tsx` — collapsible accordion, CSS variables
- `src/components/label/expansion/ExpansionStats.tsx` — CSS variables
- `src/components/label/expansion/LanguageSignal.tsx` — dynamic mismatch text, CSS variables
- `src/components/label/expansion/NicheProof.tsx` — CSS variables
- `src/components/label/expansion/RevenueEstimate.tsx` — CSS variables
- `src/components/label/expansion/continentOutlines.ts` — Natural Earth 110m TopoJSON
- `src/components/label/expansion/mockData.ts` — Veira artist data + roster array

## What Was Tested

- `npx tsc --noEmit` — zero errors
- `npm run build` — production build succeeds (8.36s)
- Code-split verified: `LabelExpansionRadar-*.js` chunk is separate from main bundle

## What to Verify in Browser

1. Navigate to `/label/expansion-radar` — page loads inside LabelLayout
2. Sidebar shows "Expansion Radar" with active state + "NEW" badge
3. All 8 sections render with Kilu's data by default
4. **Click artist selector** — switch to Veira, all sections swap data (different cities, opportunities, languages)
5. **Switch back to Kilu** — data reverts correctly
6. Globe renders with **high-fidelity continent outlines** (real coastlines, not rough polygons)
7. **Bloom effect** — dots and arcs have soft cinematic glow
8. Click an untapped dot → scrolls to matching opportunity card with orange highlight
9. **Click opportunity card header** → body collapses/expands with animation
10. First 2 cards expanded by default, 3rd+ collapsed with revenue preview visible
11. Drag to rotate globe, scroll to zoom, auto-rotates slowly
12. **Toggle light mode** in sidebar — expansion page should now respect light theme
13. On a low-end machine — globe swaps to flat SVG map if FPS < 20

## While I Was in Here

1. **The 125 continent outline `<line>` elements could be batched** — merge into fewer Three.js objects with NaN breaks for better GPU performance
2. **Antarctica is included** in the TopoJSON data — filter rings below latitude -60 for cleaner globe appearance
3. **Artist selector should eventually pull from Supabase** — the mock roster pattern is ready for this swap
4. **Opportunity cards could link to content plan generation** — the "Generate Expansion Plan" CTA could pre-populate a plan for the selected markets
5. **Consider adding Three.js to rollup manualChunks** — would create a shared Three.js vendor chunk that's cached separately from the Expansion Radar page code

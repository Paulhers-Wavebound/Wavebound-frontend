# Wavebound Label Dashboard — Frontend

> Label intelligence portal for major music labels.
> React + TypeScript + Vite + Tailwind + shadcn/ui + Recharts

## Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui components + CSS variables
- **Charts:** Recharts
- **State:** React Query (@tanstack/react-query) + React Context
- **Routing:** React Router DOM v6
- **Auth:** Supabase Auth (@supabase/supabase-js)
- **Backend:** Supabase Edge Functions (separate repo: wavebound-backend)

## Dev Server
```bash
npm run dev
```
Runs on http://localhost:5173

## Project Structure
```
src/
├── pages/label/          # Page components (route-level)
│   ├── SoundIntelligenceOverview.tsx  # /label/sound-intelligence
│   └── SoundIntelligenceDetail.tsx    # /label/sound-intelligence/:jobId
├── components/
│   └── sound-intelligence/           # Sound Intelligence feature components
│       ├── SongTimestampHeatmap.tsx
│       ├── FormatBreakdownTable.tsx
│       ├── VelocityChart.tsx
│       ├── FormatTrendsChart.tsx
│       ├── WinnerCard.tsx
│       ├── HeroStatsRow.tsx
│       ├── TopPerformersGrid.tsx
│       ├── CreatorTiersSection.tsx
│       ├── GeoSpreadSection.tsx
│       ├── HookDurationSection.tsx
│       ├── LifecycleCard.tsx
│       └── SoundHeader.tsx
├── types/soundIntelligence.ts        # All TypeScript interfaces
├── utils/soundIntelligenceApi.ts     # API client (trigger, get, list)
├── hooks/                            # Custom hooks
├── contexts/                         # React contexts
├── integrations/supabase/            # Supabase client setup
└── lib/utils.ts                      # shadcn utility (cn function)
```

## API Endpoints (Supabase Edge Functions)

Base: `https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1`

- **POST /trigger-sound-analysis** — `{ sound_url, label_id }` → `{ success, job_id, cached }`
- **GET /get-sound-analysis** — `?job_id=X` or `?sound_id=X&label_id=Y` → full SoundAnalysis JSON
- **GET /list-sound-analyses** — `?label_id=X` → array of all analyses for a label

Auth: Bearer JWT from Supabase session for trigger, apikey header only for get/list.

## Design System

Dark theme with burn orange accent. Match the HTML mockup at `../wavebound-backend/label-portal/sound-intelligence.html`.

```css
--L0: #000000;        /* Page bg */
--L1: #1C1C1E;        /* Card bg */
--L2: #2C2C2E;        /* Elevated */
--L3: #3A3A3C;        /* Tertiary */
--accent: #e8430a;    /* Burn orange */
--text: rgba(255,255,255,0.87);
--text-secondary: rgba(255,255,255,0.55);
--text-tertiary: rgba(255,255,255,0.30);
--border: rgba(255,255,255,0.06);
```

## Key Data Types

All interfaces in `src/types/soundIntelligence.ts`. Key ones:
- `SoundAnalysis` — the full analysis object from the API
- `FormatBreakdown` — per-format data with drilldown (daily, songBars, hooks, topVideos)
- `CreatorTier` — per-tier data with drilldown
- `GeoBreakdown` — per-country data with drilldown
- `FORMAT_COLORS` — color mapping for format chart lines/dots

## Format Colors
```typescript
const FORMAT_COLORS = {
  'Lyric Overlay': '#e8430a',
  'POV / Storytelling': '#0A84FF',
  'Reaction / Duet': '#BF5AF2',
  'Aesthetic / Mood Edit': '#64D2FF',
  'Transition Edit': '#30D158',
  'Concert Fancam': '#FFD60A',
  'Dance / Challenge': '#FF453A',
  'Skit / Comedy': '#FF6482',
  'Tutorial / GRWM': '#FF9F0A',
  'Audio Edit': '#8E8E93',
};
```

## Known Issues To Fix
- Song timestamp heatmap: tooltip percentage calculation is wrong (treats normalized 0-100 as actual %)
- Top video links in format drilldown: should use `video_url` field, not construct from handle
- Double @@ on creator handles: API includes @ prefix, display code adds another
- "Share Rate" labels: should say "Engagement Rate" (backend uses like_count/play_count)
- Verdict algorithm: everything shows "SCALE" — needs engagement × recency logic
- Song duration hardcoded to 120s: should come from API data

## Testing
- Use Aperture analysis: paste `https://www.tiktok.com/music/Aperture-7598271658722576401` in search
- Use As It Was (seeded): `https://www.tiktok.com/music/As-It-Was-7086491292068498437`
- Label ID for Columbia: `8cd63eb7-7837-4530-9291-482ea25ef365`

## Supabase
- Project ref: `kxvgbowrkmowuyezoeke`
- Anon key: in `src/utils/soundIntelligenceApi.ts`

# 2026-04-07 — Arbitrage Intelligence Layer for Expansion Radar

## What changed

### Backend (Supabase)

- Created `market_intelligence` table with columns: country_code, country_name, avg_cpm_blended, fan_value_index, arbitrage_score, avg_ticket_price_usd, merch_enthusiasm_index, live_attendance_index, yoy_streaming_growth, population_millions, internet_penetration, music_revenue_per_capita, top_platform
- Seeded 30 countries with realistic data (Nigeria 3.2×, Kenya 3.4×, etc.)
- RLS enabled: authenticated + anon read access

### Frontend — New files

- `src/components/expansion-radar/useMarketIntelligence.ts` — Hook to fetch market_intelligence, compute roi_vs_us, derive action labels
- `src/components/expansion-radar/TopExpansionBanner.tsx` — Hero banner showing best signal × arbitrage market with CTA to The Pulse

### Frontend — Modified files

- `src/components/expansion-radar/types.ts` — Added `MarketIntelligence` and `ArbitrageAction` types
- `src/components/expansion-radar/MarketHeatGrid.tsx` — Full rewrite: added ROI + Action columns, sort pills (Opportunity/Signal/ROI), shows all markets (active + non-present), "Why This Market" expandable with signal context, opportunity metrics, templated recommendation, and Pulse link
- `src/pages/label/LabelExpansionRadar.tsx` — Wired `useMarketIntelligence` hook, added `TopExpansionBanner`, passed `activeMarkets` + `marketIntel` to `MarketHeatGrid`
- `docs/features/expansion-radar-v2.md` — Updated with arbitrage features

## Why

Makes the Expansion Radar the "actually plan your campaign" tool. Instead of just "you're trending in Nigeria," it now says "you're trending in Nigeria AND it's 3.2× cheaper to run ads there AND fans spend more on merch."

## What was tested

- `npx tsc --noEmit` — clean, no errors
- Verified `market_intelligence` table accessible via REST API (30 rows, Kenya 3.4× top ROI)

## What to verify in browser

- Load Expansion Radar for Harry Styles or any artist
- **Top Expansion Banner** should appear above Market Heat Grid showing best market
- **Market Heat Grid** should show 7 columns: Country, Status, Velocity, Signal, Health, ROI vs US, Action
- Sort pills (Opportunity/Signal/ROI) should re-sort the table
- Clicking a row should expand "Why This Market" with signal + opportunity + recommendation
- "Open in The Pulse" links should navigate (route may 404 if Pulse doesn't have arbitrage mode param handling yet)
- Action badges: GO NOW (green), TEST (yellow), OPTIMIZE (purple), BASELINE (gray), MONITOR (dim)

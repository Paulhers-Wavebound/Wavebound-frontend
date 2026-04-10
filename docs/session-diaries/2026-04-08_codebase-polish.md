# Session: Codebase Polish — Deduplication, React Query, Extraction

**Date:** 2026-04-08 (session 3)

## What changed

### 1. labelSpin keyframe → index.css

- Added `@keyframes labelSpin` once to `src/index.css`
- Removed 7 duplicate inline `<style>` tags from 5 files:
  - `ArtistIntelligence.tsx` (2), `LabelArtistProfile.tsx` (1), `LabelArtistDetail.tsx` (2), `ContentIntelligenceView.tsx` (1), `IntelligenceTab.tsx` (1)

### 2. Eliminated duplicate entity_id resolution

- `ArtistIntelligence.tsx`: now uses `entityId` from `useArtistBriefing` for `ContentIntelligenceView` instead of URL param `id` (which is `artist_intelligence.id`, not the entity_id)
- `LabelArtistProfile.tsx`: already correctly wired in previous session

### 3. Migrated useContentIntelligence to React Query

- Replaced raw `useEffect`/`useState` with `useQuery` from `@tanstack/react-query`
- queryKey: `['content-intelligence', entityId, artistHandle]`
- staleTime: 5 minutes, retry: 1
- Same data fetching logic (2-phase parallel queries), now with caching and deduplication across pages
- Return interface unchanged: `{ data, loading }`

### 4. Loading skeleton for ContentIntelligenceView

- Replaced bare spinner with shimmer skeleton matching the 6-section layout
- Two-column skeleton for Content Health + Format DNA, single-column for Evolution, two-column for Anomalies + Sentiment, single-column for Sound Performance
- Uses shadcn `<Skeleton>` component

### 5. Extracted LabelArtistProfile sub-components

- **`src/components/label/profile/ProfileHeader.tsx`** — artist header card + invite code card
  - Props: artistName, handle, avatar, tier, daysSinceLastPost, platform followers, inviteCode
  - Moved: `tierConfig`, `fmtNum`, `postAgeColor` helpers
- **`src/components/label/profile/PerformanceChart.tsx`** — RMM performance trend chart + stats pills
  - Props: chartData, organicOnly toggle, PR stats, medianBaseline
  - Moved: `RmmDot`, `PremiumChartTooltip`, `fmtNum` helpers
  - Chart handles its own `tickSeenMonths` state internally
- **`src/components/label/profile/ProfileSidebar.tsx`** — Impact Delta + Release Readiness
  - Props: delta metrics, baseline date, readiness score, factors, release info
  - Moved: `DeltaCard`, `ReadinessGauge`, `readinessRingColor`, `fmtPct`, `factorLabels`
- **LabelArtistProfile.tsx**: 1353 → 670 lines (50% reduction)
- Cleaned up unused imports: removed `useCallback`, `useIsMobile`, `Avatar*`, `Popover*`, `ArrowUp/Down`, `CheckCircle2/XCircle`, `HelpCircle`, `Copy`, `FileText`, `X`, Recharts imports

## Files created

- `src/components/label/profile/ProfileHeader.tsx`
- `src/components/label/profile/PerformanceChart.tsx`
- `src/components/label/profile/ProfileSidebar.tsx`

## Files modified

- `src/index.css` — added `@keyframes labelSpin`
- `src/pages/label/ArtistIntelligence.tsx` — removed 2 inline keyframes, use briefing entityId
- `src/pages/label/LabelArtistProfile.tsx` — extracted 3 sub-components, removed inline keyframe, cleaned imports
- `src/pages/label/LabelArtistDetail.tsx` — removed 2 inline keyframes
- `src/components/label/intelligence/ContentIntelligenceView.tsx` — removed inline keyframe, added skeleton
- `src/components/label/intelligence/IntelligenceTab.tsx` — removed inline keyframe
- `src/hooks/useContentIntelligence.ts` — migrated to React Query

## What was tested

- `npx tsc --noEmit` — clean pass after every change

## What to verify in browser

- All spinner animations still work (now driven by global CSS instead of inline)
- Artist intelligence page (content role): loading should show shimmer skeleton, not bare spinner
- LabelArtistProfile → Profile tab: header, chart, sidebar should render identically
- Navigate between artist pages: React Query cache should make revisits instant (5min stale)

# Session Diary: Content & Social Bible Features

**Date:** 2026-04-10
**Task:** Implement 6 features derived from the Content & Social Bible research

## What Changed

### Files Modified

1. **`src/data/contentDashboardHelpers.ts`**
   - Extended `ContentArtist` interface with: `avg_saves_30d`, `save_to_reach_pct`, `weekly_pulse`, `weekly_pulse_generated_at`
   - Added `saveToReachColor()` and `saveToReachLabel()` — color-coded Save-to-Reach ratio per Bible benchmarks (<0.8% red, 0.8-1.5% yellow, 1.5-3% green, >5% purple)
   - Added `TierGroup` type and `getTierGroup()` — maps momentum_tier to breakout/momentum/catalog groups
   - Added `generatePDBBriefing()` — Presidential Daily Brief format briefing as single compressed paragraph

2. **`src/hooks/useContentDashboardData.ts`**
   - Added `weeklyPulseRaw` state and fetch from `artist_intelligence` (artist_handle, weekly_pulse, weekly_pulse_generated_at)
   - Added `pulseByHandle` lookup map
   - Mapped `avg_saves_30d` from roster query
   - Calculated `save_to_reach_pct` in merge phase: `(avg_saves_30d / avg_views_30d) * 100`
   - Mapped `weekly_pulse` and `weekly_pulse_generated_at` from pulse query

3. **`src/components/label/content-social/ContentRosterTable.tsx`** (full rewrite, 680→750+ lines)
   - **Phase 2 — Spotted Pattern visual audit:**
     - `MomentumBadge` component: colored pill next to artist name (viral=purple, breakout=green, momentum=blue, stalled=red, stable=hidden)
     - `RiskIndicator` component: AlertTriangle icon when critical/warning risk_flags
     - `PerformanceCell` flipped: trend % is now the HERO element (16px bold colored), view count is subtitle
     - Save-to-Reach ratio shown as third line in PerformanceCell
     - Row hover bumped to `hover:bg-white/[0.04]`
     - ContentHealthPill bumped to `text-[12px]`
   - **Phase 3 — Card view:**
     - `ArtistCard` component: full card with avatar, momentum badge, risk strip, hero trend %, save rate, top sound/focus sound
     - View toggle (List/LayoutGrid icons) added next to filter tabs
     - `viewMode` state toggles between "rows" and "cards"
     - Card grid: responsive 1/2/3 columns
   - **Phase 4 — Tier-adaptive tiles:**
     - `buildTierAdaptiveTiles()` function returns different MetricTile sets based on tier:
       - breakout: Velocity, Engagement, Format Alpha, Follower Delta
       - momentum: Save Rate, Hook Score, Viral Score, Format Alpha
       - catalog: Top Sound (with "Catalog Spike" label when gaining), Velocity, Save Rate
     - Common tiles always included: Cadence, Last Post
   - **Phase 6 — Focused Sound display:**
     - `TopSoundCell` checks `weekly_pulse?.focused_sound` first — shows orange "FOCUS" badge + title + reason
     - Catalog-tier TopSoundCell shows "Gaining traction" language for velocity=up
     - `ExpandedRow` shows catalogue_alert banner (purple) when weekly_pulse has one
     - `derivePriorityAction` uses AI-generated action from weekly_pulse when available

4. **`src/components/label/content-social/ContentSocialDashboard.tsx`**
   - Added `generatePDBBriefing` import
   - Added `pdbBriefing` useMemo — generates PDB format when artists available
   - Fallback chain: AI president brief > PDB format brief > legacy ContentBriefingCard

5. **NEW: `edge-functions/generate-artist-focus.ts`**
   - Deno edge function for Layer 3 AI focused sound
   - Gathers context: sound velocity RPC, catalog_tiktok_performance, artist_intelligence (latest_release), SI sound performance
   - Calls Anthropic API (claude-sonnet-4) with structured prompt
   - Returns JSON: `{ focused_sound, catalogue_alert }`
   - Stores in `artist_intelligence.weekly_pulse` + `weekly_pulse_generated_at`
   - Supports single artist and batch mode

6. **NEW: `docs/content-social-bible.md`**
   - Canonical reference: 400+ line document covering role, workflows, decisions, metrics
   - Referenced in CLAUDE.md as mandatory read before feature work

7. **`CLAUDE.md`** — Added mandatory Bible read rule

## Why
The Content & Social Bible research (4 Gemini Deep Research reports) identified 5 gaps between what the role needs and what the dashboard provides. This session implements all of them plus adds the Bible document as the canonical reference.

## What Was Tested
- `npx tsc --noEmit` — clean compile, zero errors

## What to Verify in Browser
1. **Roster table (rows):** Momentum badges next to artist names, risk triangle icons, trend % as hero metric, save rate third line
2. **View toggle:** List/Grid icons in top-right of filter bar. Click Grid to see card view.
3. **Card view:** Each card shows avatar, name, momentum badge, hero trend %, save rate with color, top sound
4. **Expanded row tiles:** Should differ by tier — expand a "viral" artist vs a "stable" artist and compare tile sets
5. **PDB briefing:** If no AI president brief is stored, should show "The Wavebound Brief (date):" format at top
6. **Focused Sound:** Will show "FOCUS" badge in Top Sound column only after edge function is deployed and generates data for `weekly_pulse`

## Edge Function Deploy Needed
```bash
mkdir -p supabase/functions/generate-artist-focus
cp edge-functions/generate-artist-focus.ts supabase/functions/generate-artist-focus/index.ts
supabase functions deploy generate-artist-focus --project-ref kxvgbowrkmowuyezoeke --use-api
rm -rf supabase/functions
```
Also needs `ANTHROPIC_API_KEY` set as a secret on the Supabase project.

## Backtracking Guide
Each phase touches specific areas:
- **Phase 1 (Save-to-Reach):** Revert `avg_saves_30d` + `save_to_reach_pct` fields from ContentArtist, remove calc from hook, remove display from PerformanceCell
- **Phase 2 (Visual audit):** Revert MomentumBadge, RiskIndicator, PerformanceCell hero flip, hover changes
- **Phase 3 (Card view):** Remove ArtistCard component + viewMode state + view toggle buttons
- **Phase 4 (Adaptive tiles):** Replace `buildTierAdaptiveTiles()` with the old flat tile list in ExpandedRow
- **Phase 5 (PDB briefing):** Remove `generatePDBBriefing` import and `pdbBriefing` memo, revert fallback chain
- **Phase 6 (Focused Sound):** Remove weekly_pulse check in TopSoundCell, remove catalogue_alert banner, remove edge function

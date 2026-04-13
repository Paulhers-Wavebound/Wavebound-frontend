# Session Diary — 2026-04-12 — A&R Command Center

## What changed

**20 new files created:**

- `src/types/arTypes.ts` — All A&R type definitions (pipeline stages, metrics, signability scores, deal structures, simulation types)
- `src/data/mockARData.ts` — 15 mock prospects across all 5 pipeline stages + 5 decision points + council briefing generator + simulation results + helper functions
- `src/components/label/ar/ARCommandCenter.tsx` — Main dashboard compositor (header + signal report + pipeline table + tabs)
- `src/components/label/ar/ARSignalReportCard.tsx` — "Good morning, Council" briefing card with collapsible decision points
- `src/components/label/ar/ARPipelineTable.tsx` — Sortable/filterable prospect table with stage filters
- `src/components/label/ar/ARPipelineRow.tsx` — CSS grid row with sparkline, Rise Probability, Ghost Curve match
- `src/components/label/ar/ARPipelineTabs.tsx` — Scout Radar / Shortlist / Development Roster / Simulation Lab tabs
- `src/components/label/ar/RosterSelector.tsx` — Columbia US / RCA / Epic / Latin / Global dropdown
- `src/components/label/ar/ScoutDossierPanel.tsx` — Slide-in AI dossier panel (narrative, thresholds, trigger markets, comment intent, cross-platform funnel, risk flags)
- `src/components/label/ar/ProspectBanner.tsx` — Prospect header with Ghost Curve overlay sparkline
- `src/components/label/ar/SignabilityScorecard.tsx` — 4-pill expandable scorecard (Creative / Commercial / Legal Pulse / 360 Upside)
- `src/components/label/ar/ProspectDeepDiveTabs.tsx` — 7 deep dive tabs (Threshold Check, Geography, Format Trends, Comment Intent, Cross-Platform, Ghost Curve, Development Roadmap)
- `src/components/label/ar/AgentActionsBar.tsx` — Floating bottom bar (Run Studio Bot / Generate Greenlight Proposal / Nurture Manager)
- `src/components/label/ar/SimulationControls.tsx` — Deal scenario builder with Bible-aligned tiers, advance slider, 360 clause sliders, risk factor toggles
- `src/components/label/ar/SimulationResults.tsx` — Monte Carlo distribution, recoupment timeline, IRR/ROI, risk breakdown, sign-off chain visualization
- `src/components/label/ar/SimulationLab.tsx` — Two-column compositor with export buttons
- `src/pages/label/ARProspect.tsx` — Prospect drill-down page with useSetPageTitle for breadcrumbs
- `src/pages/label/ARSimulationLab.tsx` — Simulation Lab page wrapper

**7 files modified:**

- `src/contexts/DashboardRoleContext.tsx` — Added `"ar"` to DashboardRole union + roleLabel
- `src/components/label/RoleSelector.tsx` — Added A&R option to dropdown
- `src/pages/label/LabelDashboard.tsx` — Added `role === "ar"` render branch + 9 A&R-specific mock notifications
- `src/App.tsx` — Added 2 lazy routes (`ar/prospect/:id`, `ar/simulation`)
- `src/pages/label/LabelLayout.tsx` — Added breadcrumb entries + dynamic `/label/ar/prospect/:id` handler + Simulation Lab command palette entry
- `docs/handoffs/backend-todo.md` — Added A&R pipeline backend schema + edge function specs

## Why

Paul wants a new A&R role in the frontend that mirrors the existing Marketing and Content dashboards but is purpose-built for A&R executives. Full Bible_A&R.md alignment — 5-stage discovery pipeline, scouting thresholds, deal structures, sign-off chains. All mock data for now, backend stitched later.

## What was tested

- `npx tsc --noEmit` — passes clean after every phase (6 phases total)
- All type definitions compile correctly
- Mock data structures match Bible_A&R.md thresholds and terminology
- Role switching in DashboardRoleContext extends cleanly (no breaking changes to existing marketing/content roles)

## What to verify in browser

1. Switch to "A&R" in the role selector dropdown on the dashboard — Command Center should render
2. "Good morning, Council" briefing card with 5 decision points (expand the collapsible section)
3. Pipeline table: 15 rows, filter by stage, sort by Rise Probability
4. Notification bell: 9 A&R-specific notifications (bot flags, sign-off progressions, trigger market alerts)
5. Scout Radar tab: click any row to open the dossier slide-in panel
6. Click any pipeline row to navigate to `/label/ar/prospect/:id` — verify banner, signability scorecard, all 7 deep dive tabs
7. Simulation Lab tab links to `/label/ar/simulation` — configure a deal scenario, hit Run, verify charts render
8. Agent Actions bar at bottom of prospect page — all 3 buttons show "Coming soon" toasts
9. Breadcrumbs: prospect page shows "A&R Pipeline > Artist Name"
10. Command palette (Cmd+K): "A&R Simulation Lab" appears in navigate section
11. Avatar images load from DiceBear API on all prospect rows

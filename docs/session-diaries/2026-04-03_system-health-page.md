# System Health Monitor Page

**Date:** 2026-04-03

## What changed

- **New file:** `src/pages/label/SystemHealth.tsx` — full system health page calling `admin-health` edge function
- **Modified:** `src/App.tsx` — added route `/label/admin/health` → `<SystemHealth />`
- **Modified:** `src/components/label/LabelSidebar.tsx` — added HeartPulse icon, "System health" link in admin section (both collapsed and expanded sidebar views)

## Why

Paul requested a frontend page to monitor scraper pipeline health. The backend `admin-health` edge function returns scraper run data, overdue scrapers, and data totals.

## Features built

- Status banner (green/yellow/red) based on overdue + errored scrapers
- Scraper group cards (4x daily, Daily, Free APIs, dbt) with schedule labels
- Each scraper row: status dot, human-readable name, relative time, rows inserted, duration
- Click-to-expand: last 10 runs as dot timeline, error messages, metadata
- Overdue scrapers: gray pulsing dot + "Overdue" label
- Data totals section (Entities, Observations, Geo, Platform IDs, Relationships)
- Auto-refresh every 60 seconds with "Last checked: Xs ago" counter
- Admin-only sidebar link (HeartPulse icon)

## What was tested

- `npx tsc --noEmit` — clean, zero errors

## What to verify in browser

- Navigate to `/label/admin/health` — page renders with live data from edge function
- Status banner shows correct color based on system state
- Click a scraper row to expand and see run history dots
- Sidebar link appears in admin section (both collapsed and expanded)
- Auto-refresh ticks every 60s

## While I was in here

1. The `SystemHealth` route is not behind `PreviewGate` — it's open to all authenticated users. Consider adding an admin-only guard if needed.
2. The edge function is called with the anon key hardcoded in the component (same pattern as `client.ts`). If you centralize the key export, this should be updated.
3. The scraper name mapping is static — if new scrapers are added to the backend, `SCRAPER_LABELS` in SystemHealth.tsx needs updating. Consider returning display names from the edge function.
4. No error retry logic — if the edge function is down, the page just shows the error. Could add a retry button or exponential backoff.
5. The run timeline assumes the edge function returns runs sorted newest-first per scraper. If it doesn't, the timeline dots may be out of order.

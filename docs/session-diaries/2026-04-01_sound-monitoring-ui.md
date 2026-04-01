# Sound Intelligence Monitoring UI

**Date**: 2026-04-01
**Task**: Build frontend for real-time sound monitoring system

## What changed

### New files

- `src/components/sound-intelligence/MonitoringBadge.tsx` — Status pill showing "Monitoring" (green) or "Spiking — Format Name" (red pulsing)
- `src/components/sound-intelligence/NextCheckCountdown.tsx` — Live countdown to next monitoring check, updates every 60s
- `src/components/sound-intelligence/SoundAlertBell.tsx` — Bell icon with unread count badge, polls every 60s
- `src/components/sound-intelligence/SoundAlertPanel.tsx` — Dropdown panel listing alerts with severity borders, click-to-navigate, mark read
- `src/components/sound-intelligence/MonitoringTrendChart.tsx` — Recharts line chart showing per-format view growth from monitoring snapshots

### Modified files

- `src/types/soundIntelligence.ts` — Added SoundMonitoring, SoundAlert, MonitoringSnapshot, FormatGrowth, MonitoringHistorySummary interfaces
- `src/utils/soundIntelligenceApi.ts` — Added getSoundAlerts, markAlertRead, getSoundMonitoringHistory API functions. Updated ListAnalysisEntry and GetSoundAnalysisResponse with monitoring field.
- `src/pages/label/SoundIntelligenceOverview.tsx` — Added monitoring badge + next check countdown on grid cards, monitoring column in list view, alert bell in page header
- `src/pages/label/SoundIntelligenceDetail.tsx` — Stores monitoring state from API, passes to SoundHeader and FormatBreakdownTable. Added MonitoringTrendChart between hero stats and velocity. Added alert bell in nav bar.
- `src/components/sound-intelligence/SoundHeader.tsx` — Now accepts monitoring prop, shows monitoring badge in header + monitoring info row (last checked, next check, spike since)
- `src/components/sound-intelligence/FormatBreakdownTable.tsx` — New spikeFormat prop, highlights spiking format row with red left border + TrendingUp icon

## Why

Backend deployed real-time monitoring (standard/intensive modes, spike detection, alerts). Frontend needed to surface all of this: monitoring status, spike highlights, alert notifications, and real-time trend charts.

## What was tested

- `npx tsc --noEmit` — clean compile, zero errors

## What to verify in browser

1. Overview page: monitoring badges on sound cards (grid + list views), alert bell in header
2. Detail page for El Papi sound (intensive monitoring): monitoring row in header with spike info, red highlight on "Dance / Challenge" in format table, MonitoringTrendChart showing format view growth, alert bell
3. Alert panel: click bell, see alerts, click one to navigate, mark all read
4. Countdown timers update live without page reload

## While I was in here, I also noticed/recommend

1. **Alert sound/browser notification** — when a spike alert arrives, a browser notification or subtle sound would make it impossible to miss (high urgency for label teams)
2. **Monitoring history on overview cards** — a sparkline showing last 24h view growth per sound would make the overview page much more scannable
3. **Alert filtering by type/severity** — as alert volume grows, being able to filter by format_spike vs info alerts will be essential
4. **Monitoring controls** — allow label users to pause/resume monitoring on specific sounds, or force an immediate check
5. **Stale monitoring detection** — if next_check_at is far in the past and no new data arrives, surface a "monitoring may be down" warning

# Session Diary — 2026-04-06 Ops Dashboard Redesign

## What changed

**New files:**

- `src/components/admin/health/MorningBriefing.tsx` — severity-ranked alert cards replacing the old green/yellow/red banner
- `src/components/admin/health/ConcurrentScrapers.tsx` — running-now indicator
- `src/components/admin/health/ApiQuotaGauges.tsx` — SC credits + YouTube quota bars (renders when backend provides data)
- `src/components/admin/health/PlatformCoverageTrend.tsx` — SVG sparklines per platform with 7d delta
- `src/components/admin/health/UnresolvedEntitiesCard.tsx` — artists with 0 platform_ids
- `src/components/admin/health/CronGapDetection.tsx` — expected vs actual cron intervals
- `docs/features/system-health.md` — feature documentation

**Modified files:**

- `src/components/admin/health/types.ts` — 7 new interfaces (BriefingItem, ApiQuotaData, PlatformIdTrend, PlatformIdDaily, UnresolvedEntities, ScraperRunHistoryEntry, ScCreditSnapshot, YtQuotaSnapshot), extended HealthData with 5 new fields
- `src/components/admin/health/constants.ts` — added CRON_SCHEDULES, QUOTA_THRESHOLDS, SC_SCRAPERS
- `src/pages/label/SystemHealth.tsx` — complete section reorder, wired in all 6 new components
- `edge-functions/admin-health.ts` — extracts new RPC fields, computes SC burn rate + projected exhaustion
- `docs/handoffs/backend-todo.md` — 6 new RPC sections + 1 index for backend session

## Why

The health page showed data-centric metrics but didn't answer ops questions: "What's broken? Am I about to run out of credits? Did a cron fail?" Redesigned as a morning-check dashboard for a solo engineer running 25+ scrapers across 6 machines.

## What was tested

- `npx tsc --noEmit` — clean pass, zero errors

## What to verify in browser

- Open `/label/admin/health` — MorningBriefing should render (green "All systems operational" or alert cards if issues exist)
- ConcurrentScrapers card should show count of running scrapers
- Data freshness promoted to position 4 (higher than before)
- Scraper groups still render and expand correctly
- ApiQuotaGauges, PlatformCoverageTrend, UnresolvedEntitiesCard, CronGapDetection — these will be empty/hidden until the backend RPC migration is deployed (documented in backend-todo.md)
- VelocityCountdown moved to bottom of page
- Page should still load in <3s with auto-refresh at 60s

## Recommendations

1. **Deploy the backend RPC migration** — the 6 new query sections in `docs/handoffs/backend-todo.md` will light up the API quota gauges, coverage sparklines, unresolved entity count, and cron gap detection. This is the highest-impact next step.
2. **Add Ticketmaster key status** — keys 2-5 are returning 401. The scraper could write `key_status` to metadata, and we could surface broken keys in the morning briefing.
3. **Machine-level heartbeat** — the current system can't detect if an entire machine is down (only if individual scrapers are overdue). A simple heartbeat cron on each machine writing to a `machine_heartbeats` table would enable a "6/6 machines alive" indicator.
4. **Push notifications** — once the morning briefing logic is proven, wire it to `send-notification.ts` (Expo push) so critical alerts wake you up instead of waiting for a page visit.
5. **Historical trend for data totals** — the daily pace bars show today vs yesterday, but a 7-day sparkline for observation ingestion would surface gradual degradation earlier.

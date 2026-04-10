# Backend Handoff: Sound Tracking Cron Setup

**Date:** 2026-04-10
**Priority:** HIGH — without this, auto-discovery won't run daily

## What was done

1. Applied missing migration `20260409_auto_sound_intelligence.sql`:
   - Added `source`, `artist_handle`, `tracking_expires_at` columns to `sound_intelligence_jobs`
   - Added `si_job_id` column to `artist_sounds` (the reverse link)
   - Created indexes on all new columns
   - Backfilled existing links

2. Ran `auto-trigger-si-analysis.ts` manually — triggered all 182 pending sounds (0 failures), covering all 10 roster artists. N8N webhooks all returned 200.

## What still needs to happen on the server

The `cron-sound-tracking.sh` script exists but was never added to the server's crontab.

**Add this crontab entry on the pipeline server:**

```bash
# Sound tracking: discover new sounds + auto-trigger SI + UGC tracking + anomaly detection + dbt refresh
0 7 * * * /opt/wavebound-pipeline/scripts/cron-sound-tracking.sh >> /opt/wavebound-pipeline/logs/cron-sound-tracking.log 2>&1
```

This runs daily at 07:00 UTC (09:00 CET) and executes the full 7-step pipeline:

1. `discover-sounds.ts` — scrape new sounds from roster artist profiles
2. `auto-trigger-si-analysis.ts` — create SI jobs + fire N8N webhooks (max 5/run)
3. `track-ugc-daily.ts` — update daily UGC counts
4. `detect-catalog-moments.ts` — stream milestones, velocity spikes
5. `scan-ugc-highlights.ts` — Gemini-analyze top fan videos
6. `detect-content-anomalies.ts` — performance outliers
7. `dbt run` — refresh Layer 2 materialized models

**To verify after adding:**

```bash
# Check crontab
crontab -l | grep sound-tracking

# Manual test run
/opt/wavebound-pipeline/scripts/cron-sound-tracking.sh

# Verify in DB
psql -c "SELECT scraper_name, status, started_at FROM scraper_runs WHERE scraper_group = 'sound-tracking' ORDER BY started_at DESC LIMIT 5;"
```

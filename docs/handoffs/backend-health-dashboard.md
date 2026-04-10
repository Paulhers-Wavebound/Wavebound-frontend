# Backend Handoff: Ops Dashboard — Health Panel Transparency

**Date:** 2026-04-08  
**From:** Frontend session  
**Priority:** HIGH — Frontend pages are deployed and waiting for backend data

---

## 1. URGENT: Investigate stuck `kworb_artist_charts` scraper

The `kworb_artist_charts` scraper started at `2026-04-08T02:21:51Z` and has been in `"running"` status for 14+ hours. It never completed.

**Action:**

```bash
# SSH to Hetzner main (46.225.104.247)
ps aux | grep artist-charts
# Kill if hung
kill <PID>

# Check logs
tail -100 ~/logs/kworb_artist_charts.log

# Update the stuck row in scraper_runs
psql -c "UPDATE scraper_runs SET status = 'error', error_message = 'Manual kill — stuck 14h', completed_at = NOW() WHERE scraper_name = 'kworb_artist_charts' AND status = 'running' AND started_at = '2026-04-08T02:21:51.372604+00:00'"
```

**Root cause to investigate:** Is kworb.net rate-limiting or blocking? Is there a pagination loop that doesn't terminate? Check if `scrape-artist-charts.ts` has a timeout.

---

## 2. Create `get_latest_scraper_runs()` RPC

The admin-health edge function calls this RPC but it doesn't exist. Current fallback fetches 5000 rows and deduplicates in JS — wasteful.

**Migration file:** `migrations/YYYYMMDD_get_latest_scraper_runs.sql`

```sql
CREATE OR REPLACE FUNCTION get_latest_scraper_runs()
RETURNS SETOF scraper_runs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (scraper_name) *
  FROM scraper_runs
  ORDER BY scraper_name, started_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_latest_scraper_runs() TO service_role;
```

**Context:** High-frequency scrapers (carl_reels, carl_tiktok, oscar_reels, oscar_tiktok) run every 1-2 minutes, generating ~720 rows/day each. The `DISTINCT ON` query returns one row per scraper regardless of volume.

---

## 3. Create `get_table_sizes()` RPC

A new edge function `db-sizes` is deployed and tries to call this RPC. If it doesn't exist, it falls back to `pg_stat_user_tables` (row counts only, no byte sizes). The RPC gives the full picture.

**Migration file:** `migrations/YYYYMMDD_get_table_sizes.sql`

```sql
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_jsonb(t)), '[]'::jsonb)
    FROM (
      SELECT
        c.relname AS table_name,
        c.reltuples::bigint AS estimated_rows,
        pg_total_relation_size(c.oid) AS total_bytes,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS size_pretty,
        pg_relation_size(c.oid) AS table_bytes,
        pg_indexes_size(c.oid) AS index_bytes,
        COALESCE(pg_total_relation_size(c.reltoastrelid), 0) AS toast_bytes
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
      ORDER BY pg_total_relation_size(c.oid) DESC
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_table_sizes() TO service_role;
COMMENT ON FUNCTION get_table_sizes IS 'Returns all public tables with row estimates and byte sizes for ops dashboard';
```

**Frontend ready at:** `/label/admin/health/database` — shows table names, row counts, byte sizes, category grouping, and sort options.

---

## 4. Set `N8N_API_KEY` as Supabase secret (DONE)

Already set via CLI:

```bash
supabase secrets set N8N_API_KEY="eyJ..." N8N_HOST="http://46.225.104.247:5678" --project-ref kxvgbowrkmowuyezoeke
```

The `n8n-status` edge function is deployed and calls `GET /api/v1/workflows` and `GET /api/v1/executions` from the n8n REST API. It uses `X-N8N-API-KEY` header for auth.

**Frontend ready at:** `/label/admin/health/n8n` — shows workflow list (active/inactive), recent executions with status/duration, 24h stats.

**Verify n8n API is accessible from Supabase edge function:**

```bash
curl -s "http://46.225.104.247:5678/api/v1/workflows?limit=1" \
  -H "X-N8N-API-KEY: $(grep 'n8n' -A2 docs/WAVEBOUND_KEYS.md | grep 'API Key' | grep -o 'eyJ[^`]*')" | head -100
```

If the Hetzner firewall blocks port 5678 from external IPs (Supabase edge functions run on AWS), you may need to whitelist Supabase's IP range or expose n8n via a reverse proxy/tunnel.

---

## 5. Scraper run history cleanup (recommended)

With carl/oscar scrapers running every 1-2 minutes, `scraper_runs` grows by ~1500 rows/day. Consider a retention policy:

```sql
-- Delete runs older than 30 days (except errors, keep 90 days)
DELETE FROM scraper_runs
WHERE started_at < NOW() - INTERVAL '30 days'
  AND status != 'error';

DELETE FROM scraper_runs
WHERE started_at < NOW() - INTERVAL '90 days';
```

Could be a weekly cron job or a Postgres trigger.

---

## 6. Consider batching high-frequency scraper logs

`carl_reels`, `carl_tiktok`, `oscar_reels`, `oscar_tiktok` each log every ~2 minutes. That's ~2,880 rows/day for these 4 scrapers alone. Options:

1. **Batch logging:** Log one row per 15-min window with aggregated counts
2. **Separate heartbeat table:** Move high-frequency pings to a `scraper_heartbeats` table that auto-cleans
3. **Reduce frequency:** If 2-min polls aren't needed, reduce to 5-10 min

This isn't blocking anything but will save DB space and make the activity feed more useful (currently dominated by carl/oscar noise).

---

## Frontend pages deployed and waiting

| Page          | Route                   | Edge Function               | Backend Dependency                            |
| ------------- | ----------------------- | --------------------------- | --------------------------------------------- |
| Live Activity | `/activity`             | Direct `scraper_runs` query | None (works now)                              |
| Error Trends  | `/errors`               | Direct `scraper_runs` query | None (works now)                              |
| Performance   | `/performance`          | Direct `scraper_runs` query | None (works now)                              |
| Handle Health | `/handles`              | `admin-health`              | `get_handle_health_stats()` RPC (exists)      |
| n8n Workflows | `/n8n`                  | `n8n-status` (deployed)     | N8N_API_KEY secret (set), firewall access TBD |
| Database      | `/database`             | `db-sizes` (deployed)       | `get_table_sizes()` RPC (create above)        |
| Pipeline Cost | embedded in `/pipeline` | `pipeline_health_stats` RPC | None (works now)                              |

All routes are wired. Sidebar is reorganized into 4 groups: top-level, Monitoring, Infrastructure, Data Quality.

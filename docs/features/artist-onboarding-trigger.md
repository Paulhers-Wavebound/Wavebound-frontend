# Artist Onboarding Intelligence Trigger

## What it does

After a new artist is added via the "Add Artist" modal, fires `trigger-artist-onboarding` to queue comment scraping, catalog import, and video scraping for the new entity.

## Who uses it and why

Label managers adding artists to their roster. Ensures intelligence data (comments, catalog, videos) starts collecting immediately instead of waiting for the next scheduled pipeline run.

## Correct behavior

- User fills out Add Artist modal and clicks "Add & Start Analysis"
- `start-onboarding` edge function is called (existing flow, fires n8n)
- If `start-onboarding` returns an `entity_id`, `trigger-artist-onboarding` is called with tasks `["comments", "catalog", "videos"]`
- Toast shows: "Setting up intelligence for [Artist Name]" with description about data appearing within minutes
- The `trigger-artist-onboarding` call is fire-and-forget (no blocking, no error shown to user)
- Data appears in the dashboard within ~3 minutes (Hetzner cron picks up queue in ≤2 min)

## Two convergent paths

1. **Path 1 (immediate, frontend-driven):** Frontend calls `start-onboarding` → gets `entity_id` → calls `trigger-artist-onboarding` → Hetzner picks up in ≤2 min. Data within ~3 minutes.
2. **Path 2 (automatic, DB trigger safety net):** n8n pipeline creates `artist_intelligence` row (10-15 min in) → Postgres trigger fires → queues same tasks → Hetzner picks up. Safety net if frontend call fails.

Both paths converge on the same `artist_onboarding_queue` table with upsert, so duplicate tasks are deduplicated.

## Edge cases

- **Entity exists but no platform IDs**: `trigger-artist-onboarding` skips tasks that require missing platform data (e.g., "videos" skipped if no TikTok handle).
- **Queue table doesn't exist**: Edge function handles gracefully, reports skipped tasks.
- **User not authorized**: Edge function returns 403 if user has no admin role or label_id.
- **Frontend call fails silently**: Path 2 (DB trigger) picks up as safety net ~10-15 min later.

## Status

**LIVE** as of 2026-04-07. Both frontend paths and backend infrastructure deployed.

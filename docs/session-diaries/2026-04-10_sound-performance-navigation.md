# Session Diary — Sound Performance Navigation + Auto-Discovery Pipeline Fix

**Date:** 2026-04-10

## What changed

### Frontend (3 files)

- **`src/data/contentDashboardHelpers.ts`** — Added `tiktok_music_id: string | null` to `SongUGC` interface
- **`src/hooks/useContentDashboardData.ts`** — Added `tiktok_music_id` to `catalog_tiktok_performance` select + mapped output
- **`src/components/label/content-social/SoundPerformanceSection.tsx`** — Made table rows clickable:
  - On click, looks up `sound_intelligence_jobs` by `sound_id` matching the song's `tiktok_music_id`
  - If completed analysis found → navigates to `/label/sound-intelligence/:jobId`
  - If no analysis → navigates to `/label/sound-intelligence` overview
  - Hover UX: song name turns accent orange, external link icon fades in, cursor pointer
  - Loading spinner while job lookup is in flight

### Database — Full migration `20260409_auto_sound_intelligence.sql` applied

- **`sound_intelligence_jobs`** — Added 3 missing columns + indexes:
  - `source text NOT NULL DEFAULT 'manual'` + index
  - `artist_handle text` + partial index
  - `tracking_expires_at timestamptz` + partial index
- **`artist_sounds`** — Added `si_job_id uuid` FK to `sound_intelligence_jobs(id)` + partial index
- **Backfill** — Linked 1 existing completed job to its artist_sounds row

### Auto-discovery pipeline — First real execution

- Ran `auto-trigger-si-analysis.ts` in 4 batches (20 + 30 + 50 + 82)
- **182 SI jobs created, 0 failures, all N8N webhooks returned 200**
- Artists covered: hshq (Harry Styles), malcolmtodddd, megmoroney, presleylynhaile, thekidlaroi, addisonre, adenfoyer, kilusmind, _milescaton_, thechainsmokers
- All 182 artist_sounds rows now linked via si_job_id

## Why

1. Paul wanted clicking a song in "Sound Performance on TikTok" to navigate to sound intelligence detail
2. Sound Intelligence overview was completely broken (500 from `list-sound-analyses`) — missing DB columns
3. Auto-discovery pipeline had never run — migration `20260409_auto_sound_intelligence.sql` was never applied, so `auto-trigger-si-analysis.ts` couldn't query `artist_sounds.si_job_id`

## Root cause chain

1. Migration not applied → `si_job_id` column missing from `artist_sounds`
2. `auto-trigger-si-analysis.ts` queries `.is("si_job_id", null)` → would crash
3. Cron (`cron-sound-tracking.sh`) never added to server crontab → steps 1-2 never ran
4. Same migration added `source`/`artist_handle`/`tracking_expires_at` to `sound_intelligence_jobs` → those missing columns broke `list-sound-analyses` edge function query → 500

## What was tested

- `npx tsc --noEmit` — clean
- `curl` to `list-sound-analyses` — returns 200 (was 500 before)
- `auto-trigger-si-analysis.ts --dry-run` — verified candidate selection logic
- Full run: 182 jobs created, 0 failures, all N8N 200s
- DB verified: 182 auto_discovery jobs, 10 artists, 0 remaining unlinked sounds

## What to verify in browser

- Sound Intelligence page should load with 183 entries (1 manual + 182 auto-discovery)
- Cards should show "Auto @handle" source badges and processing states
- Content dashboard → click song row → should navigate to SI detail (once jobs complete)

## Outstanding: cron not on server

`cron-sound-tracking.sh` needs to be added to the pipeline server's crontab. Without this, auto-discovery won't run daily. See `docs/handoffs/sound-tracking-cron-setup.md`.

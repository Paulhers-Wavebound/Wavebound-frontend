# 2026-04-16 — `delete-artist` orphan-data audit + partial-failure UI

## What changed

- Created `docs/handoffs/2026-04-16_delete-artist-rewrite.md` — rewrite
  spec for the `delete-artist` edge function (20 missing tables,
  non-existent `artist_alerts`, fan_briefs FK, deletion ordering, error
  response contract).
- Created `docs/handoffs/2026-04-16_delete-artist-audit-log.md` — new
  `artist_deletion_log` table + edge-function logging, to be PR'd
  alongside the rewrite.
- Created `docs/handoffs/2026-04-16_artist-handle-fk-cascade-audit.md` —
  roadmap item to add proper FKs + `ON DELETE CASCADE` on the 20+
  untracked `artist_handle` columns, which would reduce
  `delete-artist` from 160 lines to ~30.
- Edited `src/components/label/RemoveArtistDialog.tsx` to surface
  partial-failure responses from the edge function. Previously, any
  success HTTP code triggered the "Artist removed" toast even when the
  `deletions[]` array contained errors. Now the dialog reads
  `data.errors` / `data.deletions[].error` and shows a destructive
  "Partial failure — data may remain" toast listing up to 3 affected
  tables.

## Why

Paul asked whether the Danger Zone "Remove from Roster" button on the
artist profile actually removes an artist from the database. Audit
revealed it leaves ~480 rows across 19 tables for a test artist
(`chancepena_`), silently reports success, and would fail with an FK
violation on any artist that has `fan_briefs` rows.

## What was tested

- `npx tsc --noEmit` — clean.
- Queried Supabase production DB to enumerate all 36 real tables with
  `artist_handle` columns and compared against the edge function's
  hard-coded delete list — 20 tables uncovered.
- Ran row counts for `chancepena_` across all uncovered tables to prove
  the orphan problem is real, not theoretical.
- Inspected the full FK graph for `artist_intelligence`,
  `content_catalog`, and `sound_intelligence_jobs` to identify deletion
  ordering requirements and NO-ACTION constraints that would block the
  final `artist_intelligence` delete.

## What to verify in browser

- Nothing to verify yet — the frontend partial-failure handling is
  defensive code that only fires when the backend returns
  `data.deletions[].error` entries. Once the backend rewrite ships,
  intentionally break one delete in a test run and confirm the new toast
  appears with the failed table name.

## Orphan cleanup script

Added `migrations/20260416_orphan_cleanup.sql` — removes the 1,482
orphan rows (21 tables) attributable to 10 ghost artist_handles from
past broken deletes:

dagnymusic (582), belize.kazi (398), kilusmind (239),
harrystyles (189), itsgonnabemayyyyy (15), alexsucks (13),
rachelchinouriri (6), annemarie (6), wiffygriffy (5), chancepena (4).

The script is dry-run-by-default (BEGIN with no COMMIT at EOF, so
`psql -f` rolls back on disconnect). Validated against prod: runs to
completion, all 21 tables clear, no FK violations. To actually persist,
see the HOW TO RUN header in the file.

Note: the weird-named `"0.1. Table 7 - H-I-T-L - TikTok"` (47k rows) is
left alone — not dead, separate cleanup.

## Follow-ups

- **Backend session:** pick up
  `docs/handoffs/2026-04-16_delete-artist-rewrite.md` and
  `docs/handoffs/2026-04-16_delete-artist-audit-log.md` together (same
  file, same PR).
- The FK-cascade audit handoff is a larger refactor — lower priority,
  ship the rewrite first.
- Orphan cleanup script is ready to run when Paul wants. Safe to run
  independently of the delete-artist rewrite.

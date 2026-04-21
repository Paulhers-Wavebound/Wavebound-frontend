# Audit `artist_handle` Columns for FK Cascade Coverage

**Priority: Low (roadmap item)** — the correct long-term fix for the
orphan-data problem that `delete-artist` papers over.

**Found:** 2026-04-16 during delete-artist rewrite audit.

## Context

Currently, 36 real tables in `public` have an `artist_handle text` column,
but only `fan_briefs.artist_id` and `content_catalog.artist_id` actually
reference `artist_intelligence` via a foreign key. Everything else is a
loose text column — which means:

1. There's nothing at the DB level preventing inconsistent state (rows
   pointing at an artist_handle that doesn't exist in
   `artist_intelligence`).
2. `delete-artist` has to enumerate every single table by hand, and any
   new table added in the future silently re-opens the orphan problem.
3. Cascades don't work, so renames / merges / deletes are all manual.

## What to do

Systematically add a proper FK relationship with `ON DELETE CASCADE` on
every table whose `artist_handle` column semantically means "this row
belongs to an artist."

Two shapes to consider:

- **Option A — FK on `artist_handle`:** cheap, matches existing code, but
  assumes `artist_intelligence.artist_handle` is unique (it is) and stable
  forever (it mostly is — TikTok handles can change, but we've been
  treating them as the primary key in practice).
- **Option B — add `artist_id uuid` column, FK to
  `artist_intelligence.id`:** normalized, matches `fan_briefs` /
  `content_catalog`, resilient to handle changes. Requires a backfill
  migration and dual-writes during rollout. Much more work.

Recommend Option A unless Paul has a handle-rename scenario in mind.

## Scope of the migration

Per 2026-04-16 audit, these 20 tables need FKs added (see
`2026-04-16_delete-artist-rewrite.md` for the full list with row counts):

`artist_audience_footprint`, `artist_catalog_pulse`,
`artist_comment_intelligence`, `artist_comment_pulse`,
`artist_content_dna`, `artist_content_evolution`,
`artist_format_performance`, `artist_playlist_intelligence`,
`artist_sound_daily`, `artist_sound_pulse`, `artist_sound_video_stats`,
`artist_sounds`, `artist_streaming_pulse`, `artist_touring_signal`,
`content_anomalies`, `deliverable_versions`, `sound_intelligence_jobs`,
`ugc_highlight_videos`, `deep_research_jobs`, `fan_briefs` (change NO
ACTION → CASCADE).

Plus the 14 tables already deleted explicitly, which would also benefit
from a proper FK rather than the hand-rolled `del()` loop.

## Pre-req: clean existing orphans

Before adding FK constraints, audit and clean any existing rows where
`artist_handle NOT IN (SELECT artist_handle FROM artist_intelligence)`.
There will be some — Paul has deleted artists in the past via the broken
function, so at least `chancepena_` style orphans already exist if he
ever runs the current delete flow on a test artist.

## Once done

`delete-artist` can be reduced to:

1. Verify caller authorization.
2. `DELETE FROM artist_intelligence WHERE artist_handle = $1` — let the
   cascades do everything else.
3. Storage cleanup (GIFs + avatar) — those aren't in postgres, still
   need explicit removal.
4. Audit-log insert.

Then the function becomes ~30 lines instead of 160, and can't drift out
of date when new tables are added.

## Risk

- `ON DELETE CASCADE` makes accidental deletes much more damaging. Pair
  with the audit log (see `2026-04-16_delete-artist-audit-log.md`) so
  deletes are at least recoverable via backup + audit trail.
- Dev/staging Supabase projects need the same migration or they'll
  diverge.

# Rewrite `delete-artist` Edge Function — Leaves 480+ Orphan Rows

**Priority: High** — the current function reports success while leaving
the majority of an artist's data behind. Audited on 2026-04-16 against
`chancepena_` as the test case.

**File:** `edge-functions/delete-artist.ts`

## What's broken

1. **Only hits 16 of ~36 real tables that store data by `artist_handle`.** For
   `chancepena_`, a "successful" delete would leave **481 orphan rows across
   19 tables**.
2. **Deletes from `artist_alerts`, which does not exist** in the current
   schema. The `del('artist_alerts')` call at line 105 silently records an
   error into `deletions[]` that nothing checks.
3. **`fan_briefs.artist_id` has `ON DELETE NO ACTION` FK to
   `artist_intelligence.id`.** For any artist that has fan_briefs rows, the
   final `del('artist_intelligence')` will throw a FK violation and the
   artist_intelligence row will remain — leaving the artist half-deleted
   with the peripheral data gone but the main record intact.
4. **Returns `success: true` even when deletions erroredout.** Errors are
   pushed into `deletions[].error` but the response body still has
   `success: true`. Callers (including `RemoveArtistDialog.tsx`) see the
   success toast while the DB is in a corrupt state.
5. **Redundant auth check.** The `has_role` RPC is called for every request
   but its result is only read inside the `if (!isAdmin)` branch — harmless
   but noisy. Fine to keep; just flagging.

## Tables currently deleted ✅

`artist_videos_tiktok`, `artist_videos_instagram`, `artist_profiles_tiktok`,
`artist_profiles_instagram`, `artist_rag_content`, `niche_scrape_results`,
`idea_feedback`, `onboarding_snapshots`, `roster_dashboard_metrics`,
`plan_reviews`, `user_artist_links`, `hitl_tiktok`, `deep_research_jobs`,
`artist_intelligence`. Plus: `user_profiles.artist_handle` is nulled, and
GIF/avatar storage is purged.

## Tables NOT deleted (must be added) ❌

Add these to the `del()` list. Row counts are for `chancepena_` on
2026-04-16 as a sanity check that the table is actually used.

| Table                               | chancepena\_ rows                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `artist_sound_daily`                | 170                                                                                                                                              |
| `artist_sound_video_stats`          | 161                                                                                                                                              |
| `artist_sounds`                     | 46                                                                                                                                               |
| `content_anomalies`                 | 23                                                                                                                                               |
| `artist_format_performance`         | 17                                                                                                                                               |
| `deliverable_versions`              | 8                                                                                                                                                |
| `artist_playlist_intelligence`      | 1                                                                                                                                                |
| `artist_touring_signal`             | 1                                                                                                                                                |
| `artist_content_dna`                | 1                                                                                                                                                |
| `sound_intelligence_jobs`           | 1                                                                                                                                                |
| `artist_sound_pulse`                | 1                                                                                                                                                |
| `artist_streaming_pulse`            | 1                                                                                                                                                |
| `artist_catalog_pulse`              | 1                                                                                                                                                |
| `artist_comment_pulse`              | 1                                                                                                                                                |
| `artist_audience_footprint`         | 1                                                                                                                                                |
| `artist_content_evolution`          | 1                                                                                                                                                |
| `artist_comment_intelligence`       | 0                                                                                                                                                |
| `ugc_highlight_videos`              | 0                                                                                                                                                |
| `fan_briefs`                        | 0                                                                                                                                                |
| `"0.1. Table 7 - H-I-T-L - TikTok"` | unknown (weird-named legacy table — still has the column, please confirm whether it's still written to before deleting; if dead, drop the table) |

`content_catalog` and `content_segments` are already handled via
`ON DELETE CASCADE` from `artist_intelligence.id` → they don't need
explicit deletes, but adding them as a belt-and-suspenders safety net is
cheap insurance against bad data with null `artist_id`.

## Deletion ordering (FK-aware)

`sound_intelligence_jobs` has seven tables FK-referencing it. Four cascade,
three don't. The non-cascading ones (`artist_sounds`, `shazam_daily_snapshots`,
`sound_scan_reels`, `sound_subscriptions`, `spotify_daily_snapshots`,
`spotify_playlist_tracking`) must be cleared by `job_id` _before_ deleting
`sound_intelligence_jobs` rows — otherwise the delete errors out.

Correct order:

1. Look up the job IDs first:
   `SELECT id FROM sound_intelligence_jobs WHERE artist_handle = $1`
2. Delete from the 6 NO-ACTION children by `job_id IN (...)`.
3. Delete all the `artist_*` + `artist_handle`-carrying tables listed above.
4. Delete `fan_briefs` by `artist_handle` (also clears the NO-ACTION FK to
   `artist_intelligence`).
5. Delete `sound_intelligence_jobs` by `artist_handle` — its remaining
   cascade children (`sound_alerts`, `sound_intelligence_results`,
   `sound_intelligence_videos`, `sound_monitoring_snapshots`) go with it.
6. `deep_research_jobs`.
7. `artist_intelligence` last.
8. Storage cleanup (GIFs + avatar).

## Return-code contract

Change the response to:

- `{ success: true, deletions }` with **HTTP 200** only if every entry in
  `deletions` has no `error` field.
- `{ success: false, deletions, errors }` with **HTTP 500** if any deletion
  failed. Include the full `deletions` array so the frontend can show
  which tables failed.

The frontend (`src/components/label/RemoveArtistDialog.tsx`) has been
updated (commit on 2026-04-16) to read `data.deletions[].error` and surface
a partial-failure toast instead of the success toast.

## Bonus cleanup

Remove `artist_alerts` from the `del()` list (the table does not exist).

## Test plan

1. Create a throwaway artist row in `artist_intelligence` (test label).
2. Seed one row in each of the 20 newly-covered tables.
3. Call `delete-artist` and verify all rows are gone across all 36 tables,
   plus storage objects.
4. Test the fan_briefs FK path: seed a `fan_briefs` row with matching
   `artist_id`, confirm delete still succeeds end-to-end.
5. Test the error path: temporarily break one of the deletes (e.g. revoke
   service-role write on one table) and confirm the function returns 500
   with the error payload.

# Sound ID Merge

## What it does

Groups multiple TikTok `sound_id` analyses under one canonical monitored sound so Sound Intelligence matches TikTok mobile's consolidated song view.

## Who uses it and why

Label Content & Social managers use this when the same song is scattered across several TikTok music URLs in browser scrape data, but the campaign decision needs one combined read for velocity, formats, creator spread, and executive reporting.

## Correct behavior

- Users can paste multiple TikTok `/music/` links into Sound Intelligence's Track Sound panel.
- Two or more distinct links create a merged sound instead of separate top-level cards.
- Each raw `sound_id` remains stored as a group member and stays filterable in the group detail view.
- The group detail defaults to **All IDs**, aggregating videos, views, velocity, formats, top creators, geography, and classification breakdowns across completed member analyses.
- Selecting an individual sound ID filters the same detail modules down to that exact TikTok ID.
- Users can add more sound IDs to an existing merged sound from the group detail page.
- Users can attach the current raw Sound Intelligence analysis to an existing merged sound from the raw detail page.
- Users can create a new merged sound from the raw detail page by combining the current sound ID with pasted TikTok `/music/` links.
- Sound Intelligence suggests likely merges when unmerged jobs share ISRC, Spotify IDs, or normalized title/artist metadata.
- Users can snooze suggested merges for 7 days or dismiss them permanently for the label.
- High-confidence roster-only ISRC/Spotify suggestions can be auto-merged from an explicit overview action.
- Raw Sound Intelligence detail pages show a merged-sound badge and turn the Merge action into **View Merge** when the job already belongs to a canonical group.
- The group detail loads member entries, analyses, and monitoring state through a group-aware RPC instead of fetching each member analysis one by one.
- The **All IDs** monitoring chart uses real grouped monitoring snapshots aggregated across member jobs.
- Raw underlying analysis pages still exist and are reachable from the member table.

## Edge cases

- Empty group members: the group shell can exist, but the detail page shows an analysis-pending state until at least one member completes.
- Processing member IDs: completed IDs contribute to the aggregate immediately; queued/running IDs appear in the member table and fill in after the pipeline completes.
- Duplicate IDs in pasted input: duplicate `sound_id`s are collapsed client-side before creation.
- Stored TikTok URLs can be either `/music/Track-123`, `/music/123`, or `/music/-123`; all three parse to the same numeric sound ID.
- Stored `sound_url` values are backfilled to the canonical `/music/<sound_id>` shape for jobs and group members.
- ID already in a group: the database unique index blocks attaching the same job to another merged sound for the same label.
- Mixed roster/competitor groups: source filters include the group when any member matches that source.
- Monitoring charts: the aggregate view uses grouped snapshot history when at least two group-level buckets exist; selecting one ID still shows that ID's own monitoring history.
- Suggested duplicates: suggestions ignore jobs already attached to a merged sound; low-confidence title/artist matches are marked separately from stronger ISRC/Spotify matches.
- Suggested duplicates with fewer than two distinct `sound_id`s are filtered in the database because they do not represent a true cross-ID merge.
- Snoozed suggestions: snoozed candidates stay hidden until `snoozed_until`; if the sound IDs are still unmerged after that date, the suggestion can return.
- Dismissed suggestions: dismissed candidates stay hidden for the label until a future admin reset is added.
- Auto-merge: auto-merge only handles roster-only candidates matched by ISRC, Spotify track ID, or Spotify ID. Mixed roster/competitor and title/artist-only suggestions require manual review.
- Existing raw detail merge: adding a sound ID that already belongs to another merged sound is blocked by the database unique index and returns a clear error.

## Key files

- `supabase/migrations/20260429183722_sound_canonical_groups.sql` — canonical group/member tables, indexes, and RLS.
- `supabase/migrations/20260429185209_sound_group_rpc.sql` — group list/detail RPCs, grouped monitoring history, and duplicate suggestion RPC.
- `supabase/migrations/20260429193212_sound_duplicate_decisions_auto_merge.sql` — suggested-merge decision table, filtered suggestion RPC, and roster auto-merge RPC.
- `supabase/migrations/20260429213000_sound_duplicate_distinct_ids_and_url_backfill.sql` — canonical URL backfill and database-level distinct sound ID filtering for suggestions.
- `src/utils/soundIdParser.ts` and `scripts/run-sound-id-parser-regression.mjs` — dependency-free parser and regression coverage for TikTok `/music/` URL shapes.
- `src/utils/soundGroupApi.ts` — creates groups, adds IDs, lists groups, resolves links into jobs, records suggestion decisions, and runs controlled roster auto-merge.
- `src/utils/soundGroupAggregation.ts` — builds overview summaries and aggregate `SoundAnalysis` objects from member analyses.
- `src/pages/label/SoundIntelligenceOverview.tsx` — multi-link submit flow, suggested merge cards, snooze/dismiss actions, auto-merge action, and merged sound cards.
- `src/pages/label/SoundGroupDetail.tsx` — aggregate detail page with per-ID filters, group monitoring, and add-ID dialog.
- `src/pages/label/SoundIntelligenceDetail.tsx` — raw analysis merge dialog, already-merged badge, and canonical group navigation.
- `src/components/sound-intelligence/MonitoringTrendChart.tsx` — supports both single-job and canonical-group monitoring histories.
- `src/App.tsx` and `src/pages/label/LabelLayout.tsx` — route and breadcrumb support.

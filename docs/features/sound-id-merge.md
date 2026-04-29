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
- Raw underlying analysis pages still exist and are reachable from the member table.

## Edge cases

- Empty group members: the group shell can exist, but the detail page shows an analysis-pending state until at least one member completes.
- Processing member IDs: completed IDs contribute to the aggregate immediately; queued/running IDs appear in the member table and fill in after the pipeline completes.
- Duplicate IDs in pasted input: duplicate `sound_id`s are collapsed client-side before creation.
- ID already in a group: the database unique index blocks attaching the same job to another merged sound for the same label.
- Mixed roster/competitor groups: source filters include the group when any member matches that source.
- Monitoring charts: the aggregate view does not fake a multi-ID monitoring chart; selecting one ID shows that ID's real monitoring history.

## Key files

- `supabase/migrations/20260429183722_sound_canonical_groups.sql` — canonical group/member tables, indexes, and RLS.
- `src/utils/soundGroupApi.ts` — creates groups, adds IDs, lists groups, and resolves links into existing or newly triggered jobs.
- `src/utils/soundGroupAggregation.ts` — builds overview summaries and aggregate `SoundAnalysis` objects from member analyses.
- `src/pages/label/SoundIntelligenceOverview.tsx` — multi-link submit flow and merged sound cards.
- `src/pages/label/SoundGroupDetail.tsx` — aggregate detail page with per-ID filters and add-ID dialog.
- `src/App.tsx` and `src/pages/label/LabelLayout.tsx` — route and breadcrumb support.

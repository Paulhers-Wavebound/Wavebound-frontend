# Task: run the live-performance fan-briefs pipeline end-to-end for Harry Styles (Columbia)

**For the next Claude Code session inside `~/Projects/wavebound-backend`.**

## Skills to Invoke (before starting work)

**Core (invoke before running any script):**

- `/verification-before-completion` — every step writes to prod. Claiming success without SQL-verifying row counts is dishonesty, not efficiency.
- `/systematic-debugging` — if a script returns 0 rows, diagnose the upstream cause before re-running blindly (spam filter, allowlist mismatch, RLS).

**On-demand (invoke when the situation arises):**

- `/supabase` — if you end up querying `information_schema` or tweaking RLS.
- `/claude-api` — only if you modify `generate-briefs.ts`'s Opus prompt (don't unless necessary).
- `/typescript-expert` — only if you need to edit any of the Deno scripts.

## What You Need To Do

Run the four-script fan-briefs live-performance pipeline for Harry Styles, in order, and verify that live briefs appear under Columbia's `label_id` when you're done. This unlocks browser-testing the new Live card UX that was shipped in the frontend today (2026-04-23).

End state to achieve: at least 3 rows in `fan_briefs` with `artist_handle='harrystyles'`, `label_id='8cd63eb7-7837-4530-9291-482ea25ef365'`, `content_type='live_performance'`, `status='pending'`, and populated `segment_id` pointing at a `content_segments` row whose `peak_evidence` has ≥2 `top_comments`.

## Context — What Just Happened

The frontend session (parallel conversation, just closed) shipped the `content_type='live_performance'` UI on `/label/fan-briefs`:

- Live card variant with venue badge (muted palette per venue), "Why this moment" expandable with top 3 fan comments, click-to-swap-hook, karaoke deferral banner for `render_style='karaoke'`, ⓘ audit modal showing full `peak_evidence`, confidence-chip tooltip.
- URL-backed filter pills: `?type=live` + `&venue=<key>`.
- Query uses the nested PostgREST join `fan_briefs → content_segments → content_catalog(live_venue, ...)` because `peak_evidence` lives on `content_segments`, not on `fan_briefs.generation_context` (the original frontend prompt was wrong about that).
- No regressions to interview-brief rendering — all live-only UI is gated on `isLiveBrief(brief)`.

Frontend verified with `npx tsc --noEmit` (clean). Session diary: `docs/session-diaries/2026-04-23_fan-briefs-live-performance.md` in the frontend repo. Plan file: `~/.claude/plans/good-questions-all-spicy-stream.md`.

The frontend can't be demoed until live briefs exist in the DB for a label the user can log in as. **Columbia has zero** right now.

## Current State (verified via REST API earlier today)

### fan_briefs — live_performance rows system-wide

- 0 rows with `content_type='live_performance'` exist anywhere.
- The pipeline has only ever produced interview briefs so far.

### content_segments — peak_evidence coverage

- Only `bensonboone` has mined live peaks (e.g. the Brian May / Coachella Bohemian Rhapsody segment with `sum_likes=668`, `cluster_size=2`). Those segments exist but `generate-briefs.ts` has never been run against them with `--content-type live_performance`.
- Zero mined peaks for any Columbia artist.

### content_catalog — live discovery coverage

- 11 `content_type='live_performance'` rows, all Warner US / Boone (venues: `Fallon`, `Live Lounge`, `SNL`, `official_channel` — the last covers Coachella, Grammys, AMAs via title regex).
- Harry Styles has 13+ catalog rows but **all `content_type='interview'`** including an NPR Tiny Desk Concert that was ingested as interview (see Gotcha #1 below).

### Key label / artist IDs

```
Columbia label_id   : 8cd63eb7-7837-4530-9291-482ea25ef365
Warner US label_id  : 1e84e01a-eaea-46cb-97fc-ad5653ca667f
Harry Styles handle : harrystyles   (normalize @-stripping — scripts do this via .replace(/^@/, ""))
Benson Boone handle : bensonboone
```

## Key IDs & Paths

### Repo / CLI

```
Backend repo : ~/Projects/wavebound-backend
Scripts dir  : scripts/fan-briefs/
Supabase ref : kxvgbowrkmowuyezoeke
REST base    : https://kxvgbowrkmowuyezoeke.supabase.co/rest/v1/
```

### The four scripts (run in this exact order)

```bash
cd ~/Projects/wavebound-backend

# 1. Discover — scrapes Harry's YouTube channel + venue-matrix search, filters
#    titles matching /live|performance|acoustic|tiny desk|colors|grammy|...|
#    concert|awards|vevo live/i, upserts content_catalog with content_type='live_performance'
deno run --allow-net --allow-env scripts/fan-briefs/discover-live.ts "Harry Styles" "@harrystyles"

# 2. Fetch comments — ScrapeCreators top-order comments (≤5 pages, ~500),
#    parses MM:SS and HH:MM:SS, filters in-range, one row per (comment × timestamp).
#    Spam filter: drop if likes<2 AND len<10 AND no timestamp.
deno run --allow-net --allow-env scripts/fan-briefs/fetch-comments.ts --artist harrystyles

# 3. Mine peak signals — 10s buckets weighted by log(1+likes), peaks at cluster_size≥3
#    (check MIN_CLUSTER_SIZE in the script — it may be 2 for dev),
#    45s min spacing, chapter-snap when present, asymmetric window (t-8..t+45) otherwise.
#    Gemini Flash synthesizes ≤60-char hooks per peak. Inserts content_segments with peak_evidence.
deno run --allow-net --allow-env scripts/fan-briefs/mine-live-signals.ts --artist harrystyles

# 4. Synthesize briefs — Claude Opus 4.7, joins content_catalog to filter by content_type,
#    injects peak_evidence.top_comments + suggested_hook_from_comments into the prompt,
#    dedups (same source_url + |timestamp_start| delta < 30 + 7 days), inserts 5 briefs.
deno run --allow-net --allow-env scripts/fan-briefs/generate-briefs.ts --artist harrystyles --content-type live_performance
```

### Required env vars (set in the session shell, NOT the frontend shell)

```
SUPABASE_SERVICE_KEY      — required by all 4 scripts (RLS bypass on writes)
GEMINI_API_KEY            — required by mine-live-signals.ts (hook synthesis)
ANTHROPIC_API_KEY         — required by generate-briefs.ts (Opus)
SCRAPECREATORS_API_KEY    — optional; scripts fall back to a hardcoded key if absent
```

**If any are missing**, add to `~/.zshrc` and `source` it. Do not hardcode into scripts. Do not commit keys.

## Constraints & Rules

1. **Prod DB writes** — every script writes to the shared Supabase. No staging. If you break it you'll see it in the UI immediately.
2. **Cost ceiling ≈ $2–5** total across ScrapeCreators (≈35 credits), Gemini Flash (~$0.005/hook × ~20 hooks), Gemini 2.5 Pro visual confirmation (~$0.30–0.50), Claude Opus (~$0.10 for the final synthesis). Don't loop the scripts — single pass each.
3. **Scripts are sequential** — each depends on rows the previous one wrote. Run them in order. Do not parallelize.
4. **`fan_briefs.label_id` is FK-derived** — generate-briefs.ts joins `artists.label_id` when inserting, so confirm the `artists` row for `@harrystyles` has `label_id = 8cd63eb7-7837-4530-9291-482ea25ef365`. If not, fix before running step 4 (see Gotcha #2).
5. **No --no-verify, no force pushes, no amending commits** on this branch — stick to standard backend commit hygiene.
6. **Do not run this pipeline for other labels** in this session — scope it to Harry Styles only. If you want to extend later, open a new task.

## Verification Steps

Run each check AFTER the corresponding script completes. Do not proceed if a check fails.

### After script 1 (discover-live)

```bash
curl -sS "https://kxvgbowrkmowuyezoeke.supabase.co/rest/v1/content_catalog?artist_handle=eq.harrystyles&content_type=eq.live_performance&select=id,title,live_venue,source_url&limit=50" \
  -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" | jq length
```

Expect ≥ 3 rows. Spot-check at least one venue is recognisable (Grammys, Live Lounge, Tiny Desk, Fallon, Corden, etc.). If 0, see Gotcha #3.

### After script 2 (fetch-comments)

```bash
curl -sS "https://kxvgbowrkmowuyezoeke.supabase.co/rest/v1/content_comments?catalog_id=in.(<ids-from-step-1>)&select=count" \
  -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Prefer: count=exact"
```

Expect ≥ 100 comments across the live catalog rows. Also verify `content_catalog.comments_fetched_at` is populated on every row from step 1.

### After script 3 (mine-live-signals)

```bash
curl -sS "https://kxvgbowrkmowuyezoeke.supabase.co/rest/v1/content_segments?artist_handle=eq.harrystyles&hook_source=eq.comment&select=id,moment_summary,fan_potential_score,peak_evidence" \
  -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" | jq '.[0].peak_evidence | {cluster_size, sum_likes, top_comments: .top_comments | length}'
```

Expect ≥ 3 segments, each with `peak_evidence.cluster_size ≥ 2` and ≥ 2 `top_comments`. If all segments are `render_style='karaoke'` (i.e. song performances), that's still fine — frontend handles the karaoke-deferred banner — but it means no v1-renderable briefs will exist (flag it to Paul).

### After script 4 (generate-briefs)

```sql
-- Run via psql or the Supabase SQL editor:
SELECT id, hook_text, source_title, content_type, render_style, status,
       generation_context->'peak_evidence'->>'cluster_size' AS gc_cluster,
       segment_id
  FROM fan_briefs
 WHERE artist_handle = 'harrystyles'
   AND content_type  = 'live_performance'
 ORDER BY created_at DESC;
```

Expect ≥ 3 rows. Then:

```sql
SELECT label_id FROM fan_briefs WHERE artist_handle = 'harrystyles' AND content_type = 'live_performance' LIMIT 1;
-- Must return: 8cd63eb7-7837-4530-9291-482ea25ef365  (Columbia)
```

### Final smoke test (frontend can now verify)

Post back to Paul once the above is green. He'll log in as a Columbia user at `/label/fan-briefs?type=live` and expect cards to render with venue badges, "Why this moment" panels, click-to-swap hook, and the ⓘ audit modal.

## What Could Go Wrong

### Gotcha #1 — NPR Tiny Desk was ingested as interview

Harry Styles already has an `NPR Music Tiny Desk Concert` catalog row with `content_type='interview'` and `live_venue=null`. `discover-live.ts` dedups by `source_url` before making API calls, so it will skip this row and never re-classify it. Result: the richest potential live source is excluded.

**Fix if you care:** after step 1, SQL-UPDATE the row manually before running step 2 so fetch-comments sees it as live:

```sql
UPDATE content_catalog
   SET content_type = 'live_performance',
       live_venue   = 'Tiny Desk'
 WHERE artist_handle = 'harrystyles'
   AND title ILIKE '%tiny desk%';
```

Same rule may apply to any Corden "Late Late Show" clips already in catalog.

### Gotcha #2 — artists.label_id may be wrong

`generate-briefs.ts` derives `fan_briefs.label_id` from the `artists` table. If the `artists` row for `harrystyles` has NULL label_id or a stale one, briefs will land under the wrong label and NOT appear in Columbia's `/label/fan-briefs`. Check before step 4:

```sql
SELECT handle, name, label_id FROM artists WHERE handle = 'harrystyles';
```

If `label_id` isn't `8cd63eb7-7837-4530-9291-482ea25ef365`, fix it:

```sql
UPDATE artists SET label_id = '8cd63eb7-7837-4530-9291-482ea25ef365' WHERE handle = 'harrystyles';
```

### Gotcha #3 — discover-live returns 0

If 0 live videos are found, the entity-validation guard (PM-001 in the feature doc) is likely rejecting results because the channel title doesn't match a known-venue regex AND the video title doesn't contain "Harry Styles" as a substring. Harry's own channel is `Harry Styles` — should pass. Venue-matrix search is more brittle — channel must be on the allowlist. Check `scripts/fan-briefs/discover-live.ts` for the allowlist and confirm Harry's YouTube handle is correctly passed.

### Gotcha #4 — Gemini rate-limit / hook synthesis fails

`mine-live-signals.ts` falls back to "everyone reacted to this moment" as a generic hook when Gemini Flash fails. That's survivable for the pipeline to complete, but the synthesized hooks will be low quality. If you see many generic hooks in the output, Gemini is throttling — pause 60s and re-run just that script with `--catalog-id <single-id>` to retry one video at a time.

### Gotcha #5 — all segments classified as karaoke

If Harry has a bunch of Grammys / Coachella performances but no acceptance speeches / banter moments, every segment will get `render_style='karaoke'` (long song chapter) and `fan_briefs.render_style='karaoke'` — which the frontend renders with a "v2 deferred" banner instead of a video embed. That's NOT a bug — the feature ships with this behaviour — but it means you can't verify the talking-head render path end-to-end. Flag to Paul if that's the outcome so he can pick a different artist (Boone already has Fallon banter segments mined).

## When Complete

1. Post the four verification query results back as a Slack / chat message to Paul.
2. Add a one-line update to `docs/session-diaries/YYYY-MM-DD_harry-styles-live-pipeline.md` in the backend repo (per the backend's session-diary convention) noting: rows created, cost incurred, any Gotchas hit.
3. Do NOT run this pipeline for other Columbia artists in the same session without explicit go-ahead — we don't yet know whether the Harry Styles output is usable.

---

Questions before running? Ask Paul. Otherwise proceed with step 1, verify, step 2, verify, etc.

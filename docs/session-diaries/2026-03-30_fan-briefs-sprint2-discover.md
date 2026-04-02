# Fan Account Briefs — Sprint 2: YouTube Discovery + Transcripts

**Date:** 2026-03-30

## What changed
- Created `scripts/fan-briefs/discover.ts` — Deno TypeScript script for Stage 1 (Discover) + Stage 2 (Transcribe)
- Created `scripts/fan-briefs/deno.json` — Deno config with supabase-js import map
- Installed Deno runtime at `~/.deno/bin/deno`
- Added `scripts/fan-briefs/node_modules/` to `.gitignore`

## What the script does
1. Takes `artist_name` and `artist_handle` as CLI args
2. ScrapeCreators `/v1/youtube/search` — searches `"{artist_name} interview"`, paginates 2 pages (~40 results)
3. Filters `lengthSeconds > 600` (10+ minutes only)
4. Checks DB before API calls (skips already-cataloged URLs)
5. ScrapeCreators `/v1/youtube/video` — full metadata (description, chapters, keywords, view count)
6. ScrapeCreators `/v1/youtube/video/transcript` — timestamped transcript (`transcript_only_text` + raw `[{text, startMs, endMs}]` array)
7. Upserts into `content_catalog` (idempotent on `source_url` UNIQUE constraint)
8. Rate limits 1 req/sec to ScrapeCreators
9. Optionally links to `artist_intelligence` via `artist_handle` column

## Why
Sprint 2 of Fan Account Briefs per spec. Populates `content_catalog` with YouTube interview source material + transcripts for downstream Claude moment extraction (Sprint 3).

## What was tested
- Ran for "Harry Styles" — 21 interviews inserted (16 with transcripts, 5 flagged for Gemini fallback)
- Idempotency verified: second run skipped all 16 existing, only inserted 1 new result from search variation
- DB verified: transcripts range 6K–58K chars, view counts from 30K to 80M, durations 11–96 min
- ScrapeCreators rate limit respected (1 req/sec)
- Videos without English transcripts (en-GB only, etc.) gracefully handled — flagged for Gemini fallback

## What to verify in browser
- Nothing — CLI-only pipeline script.

## While I was in here
1. **`SCRAPECREATORS_API_KEY` not in env** — the key is hardcoded as fallback from the n8n workflow. Should add to `~/.zshrc` for cleanliness: `export SCRAPECREATORS_API_KEY="zIaWhZ3XUsR3BB0CcR9XL16UE3r2"`
2. **`artist_intelligence.artist_handle` is the join column** — NOT `tiktok_handle` (that column doesn't exist). Spec references were ambiguous.
3. **ScrapeCreators `channel_name` returns a JSON object**, not a string — `{id, url, handle, title}`. Works fine in JSONB `metadata` but the `channel_name` TEXT column is storing stringified JSON. Future: extract `.title` field for clean display.
4. **5 videos have no transcript** — Howard Stern, Harry's House Zane Lowe, Tiny Desk, one en-GB only, one Hits Radio. These need Gemini video analysis fallback (Sprint 4).
5. **Sprint 3 is unblocked** — 16 interviews with full transcripts are ready for Claude moment extraction.

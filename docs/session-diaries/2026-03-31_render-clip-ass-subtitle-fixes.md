# 2026-03-31 — Fix 4 ASS subtitle + hook rendering issues in render-clip.ts

## What changed

- `scripts/fan-briefs/render-clip.ts` (backend repo) — rewrote `generateASS()` function

### Issue 1: Hook placement and styling

- Font size 42 → 54px, MarginV 50 → 220 (16% down the 1350px frame, just above video content)
- Added `wrapHookLines()` to word-wrap hook text at ~25 chars per line with `\N` breaks
- Added `escapeASS()` helper for clean special character escaping

### Issue 2: Too many words visible at once

- Changed from one dialogue event per transcript phrase → chunked to max 5 words per event
- Font size 48 → 58px for captions
- Orphan absorption: if last chunk would be 1-2 words, merge into previous chunk

### Issue 3: Two caption lines highlighting simultaneously

- Root cause: transcript API returns overlapping phrase segments (2-3 active at any time)
- Fix: de-overlap step clips each phrase's end time to the next phrase's start time
- Minimum duration filter (500ms) drops noise phrases at boundaries
- Result: strictly non-overlapping dialogue events — only one caption line ever visible

### Issue 4: Yellow highlight out of sync with speech

- Changed from character-proportional word timing to equal duration per word (`D/N`)
- Each word in a chunk gets `phraseDuration / wordCount` milliseconds

## Why

User reported all 4 issues after watching the first render. The overlapping timestamps from the transcript API were the root cause of issues 2, 3, and partially 4.

## What was tested

- Rendered brief `486cc118` ("acoustic toothbrush", 15s clip) 4 times during iteration
- Final output: 1080x1350 H.264, 30fps, 4.6MB, 6 non-overlapping caption chunks
- Verified chunk structure: 5-6 words each, equal timing, sequential, no orphans
- Video uploaded and accessible at Supabase Storage public URL

## What to verify in browser

- Watch the rendered video at the Storage URL
- Confirm hook text is large, centered, wrapped across 3 lines, positioned above video
- Confirm captions show one chunk at a time (not two), with yellow highlighting one word at a time
- Confirm highlighting roughly tracks the speech (won't be perfect with estimated timing)

## While I was in here

- The de-overlap approach (clip end to next start) works well for this transcript format but could lose tail words if phrases have significant content overlap
- For pixel-perfect word timing, a Whisper ASR pass on each clip would give true word-level timestamps
- The 500ms minimum duration filter drops very short boundary phrases — watch for clipped content at segment edges

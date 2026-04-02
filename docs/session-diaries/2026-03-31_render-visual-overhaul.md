# 2026-03-31 — Visual styling overhaul for render-clip.ts

## What changed

### Font: TikTok Sans Bold (replacing Montserrat)

- Downloaded from https://github.com/tiktok/TikTokSans/releases (v4.000)
- Using 36pt optical size variant for large display text
- Saved as `scripts/fan-briefs/fonts/TikTokSans-Bold.ttf`
- Internal font family name = "TikTok Sans" (confirmed with fc-scan)
- Used for BOTH hook text (drawtext) and ASS captions

### Hook text: double-drawtext for crisp outlines

- Moved from ASS to ffmpeg double-drawtext trick:
  - Pass 1: black text with borderw=8 (creates thick outline)
  - Pass 2: white text on top (clean fill)
- Font size: 72px
- Position: y=h\*0.18 (18% from top, above/overlapping video)
- Pre-wrapped at ~20 chars/line to a temp text file
- Result: 4 lines for the acoustic toothbrush hook

### Captions: repositioned, resized

- ASS font: TikTok Sans Bold 62px (up from 58px)
- Position: Alignment 2 (bottom-center), MarginV 490 (~36% from bottom)
- Above TikTok UI overlay zone (like/comment/share sit in bottom ~15%)
- Chunk size: 4 words (down from 5), with orphan absorption

### Gap-aware karaoke chunking (issue #6 fix)

- Added SPEECH_GAP_S = 0.5 threshold: chunks break at pauses > 500ms
- Prevents pre-pause word from getting an absurdly long highlight
- Example: "acoustic." followed by 2.3s silence no longer gets a 2.3s highlight
- Snap timing: each word's \kf = time until next word starts speaking
- MAX_WORD_CS = 80 (800ms cap) on any single word highlight
- Chunk dialogue event ends when highlighting completes, not at word.end

### Aspect ratio: confirmed 1080×1350 (4:5)

- ffprobe verified: 1080×1350, 0.8000 ratio = exactly 4:5
- Scale + pad filter unchanged (was already correct)

## What was tested

- Rendered brief `486cc118` ("acoustic toothbrush") 3 times during iteration
- ffprobe confirms: 1080×1350 H.264, 30fps, 15s, 4.4MB
- Extracted 4 frames at t=0,3,7,12 and visually inspected:
  - Hook: large, white with black outline, 4 lines, positioned above video ✅
  - Captions: 3-4 words per chunk, yellow highlight, lower frame area ✅
  - No two caption lines visible simultaneously ✅
  - Gaps during speech pauses show no lingering captions ✅
- Font internal name "TikTok Sans" matches ASS Fontname

## What to verify in browser

- Watch the rendered video for smooth karaoke word highlighting
- Check that yellow highlight snaps to each word at speech start (not drifting)
- Verify hook text is readable and well-positioned

## While I was in here

- The TikTok Sans release zip has 12pt, 16pt, and 36pt optical variants. Using 36pt for large display text.
- Font is not auto-downloaded — must be manually placed (the release zip requires extraction). Added instructions to error message if missing.
- The gap-aware chunking created 11 chunks (up from 9) for this clip because it breaks at speech pauses, producing shorter, tighter chunks

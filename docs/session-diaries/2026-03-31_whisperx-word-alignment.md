# 2026-03-31 — Add WhisperX word-level alignment to render-clip.ts

## What changed

### New file: `scripts/fan-briefs/whisperx-align.py`

Python helper that runs WhisperX forced alignment. Two modes:

- `--text "transcript"` → forced alignment (preferred, uses original correct words)
- No text → transcribe + align (WhisperX may mishear words)

### New: `.venv/` in `scripts/fan-briefs/`

Python 3.13 venv with whisperx, torch, torchaudio, etc. (~360MB wav2vec2 model cached at `~/.cache/torch/hub/`).

### Modified: `scripts/fan-briefs/render-clip.ts`

- Added `getWhisperXTimestamps()` — extracts WAV from clip, runs whisperx-align.py via `Deno.Command`, parses JSON output
- Added `buildWhisperXCaptions()` — groups WhisperX word timestamps into 5-word chunks with true per-word `\kf` durations
- Refactored `buildPhraseCaptions()` — extracted old phrase-level logic as fallback
- `generateASS()` now accepts optional `WhisperXWord[]` — uses WhisperX path when available, phrase-level fallback when not
- `renderBrief()` now has 5 steps: download → WhisperX align → ASS gen → ffmpeg render → upload
- Preflight check reports WhisperX venv status (non-fatal if missing)

## Why

Phrase-level transcript timestamps from ScrapeCreators give ~0.3-0.7s accuracy per word. WhisperX forced alignment gives ~0.02s accuracy. The karaoke highlight now matches the exact moment each word is spoken.

## What was tested

- Rendered brief `486cc118` ("acoustic toothbrush") with WhisperX alignment
- 38 word timestamps extracted, grouped into 8 karaoke events
- Output: 1080x1350 H.264, 15s, 4.7MB
- Video uploaded and accessible

## What to verify in browser

- Watch the rendered video and check that the yellow word highlight tracks speech closely
- Compare mentally against the old render — word timing should be noticeably tighter

## While I was in here

- WhisperX transcription mode misheard "acoustic" as "a coup stick" — forced alignment with original text correctly aligns "acoustic"
- The wav2vec2 alignment model downloads on first run (~360MB). Subsequent runs use the cached model and are much faster (~5-10s for a 15s clip)
- The `.venv/` should NOT be committed. Add to .gitignore if not already there
- WhisperX requires Python <3.14. The venv uses python@3.13 from Homebrew

# 2026-03-31 — Add rendered clip preview to BriefCard

## What changed

### `src/types/fanBriefs.ts`

- Added `rendered_clip_url: string | null` to the `FanBrief` interface

### `src/components/fan-briefs/BriefCard.tsx`

- When `rendered_clip_url` exists:
  - Shows a `<video>` player as the PRIMARY preview (autoPlay, muted, loop, playsInline, controls)
  - 4:5 aspect ratio container (paddingBottom: 125%) matching the 1080x1350 rendered clips
  - Green "Download Rendered" button (`<a href={url} download>`) as prominent primary action
  - "Source Clip" collapsible toggle to show/hide the original YouTube embed below
- When `rendered_clip_url` is null:
  - Shows the existing YouTube embed + raw clip download — no change in behavior
- All existing functionality preserved: approve/skip/modify buttons, editable hook, tags, confidence badge

### `src/pages/label/LabelFanBriefs.tsx`

- No changes needed — already uses `.select("*")` which picks up the new column

## Why

The render pipeline now produces finished 1080x1350 MP4 clips with hook text and karaoke captions. The BriefCard needed to preview these rendered clips instead of (or in addition to) the raw YouTube source.

## What was tested

- `npx tsc --noEmit` passes clean
- Brief `486cc118` has `rendered_clip_url` set, other 4 briefs don't
- The conditional rendering handles both cases correctly

## What to verify in browser

- Navigate to Fan Briefs page
- The "acoustic toothbrush" brief should show a video player with the rendered clip
- Video should autoplay muted with controls visible
- "Download Rendered" green button should trigger a file download
- "Source Clip" toggle should expand/collapse the YouTube embed below
- Other briefs (without rendered clips) should show YouTube embeds as before

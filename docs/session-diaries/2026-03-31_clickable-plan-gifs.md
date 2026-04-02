# 2026-03-31 — Make content plan GIFs clickable to source videos

## What changed

### `src/components/admin/AdminEditTab.tsx`

**New function: `buildVideoUrlMap(rawVideos, ragInspiration)`**

- Maps video indices to TikTok URLs from two data sources:
  - Ref videos (own content): `tiktok_data.raw_videos[i].video_url` → index `i`
  - Niche videos (RAG inspiration): `rag_inspiration[i].video_url` → index `1000 + i + 1`

**Updated `getIdeaGifs()`**

- Now returns `GifWithUrl[]` (gif URL + video URL) instead of plain `string[]`
- Video URLs come from the videoUrlMap built from DB data

**Data fetching updates**

- `deep_research_jobs` query now also selects `tiktok_data` (for Ref video URLs)
- `artist_intelligence` query now also selects `rag_inspiration` (for Niche video URLs)
- Both populate a shared `videoUrlMap` state

**GIF rendering — now clickable**

- SwapCard GIFs: wrapped in `<a href={videoUrl} target="_blank">` when video URL exists
- Schedule table GIFs: same treatment for the inline thumbnails
- Hover shows opacity change as visual affordance

## Why

GIFs in the Edit tab showed video previews but weren't linked to the source videos. Paul wanted to click them to watch the full referenced TikTok.

## What was tested

- `npx tsc --noEmit` passes clean
- The Plan Review tab uses an iframe with rendered HTML that already has clickable links — no change needed there

## What to verify in browser

- Go to Admin > Edit tab, select an artist with a content plan
- GIFs in the schedule table and swap pool cards should be clickable
- Clicking opens the source TikTok video in a new tab
- Ref GIFs link to the artist's own TikToks
- Niche GIFs link to inspiration TikToks from other creators

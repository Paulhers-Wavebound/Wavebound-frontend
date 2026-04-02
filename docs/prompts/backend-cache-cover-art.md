# Task: Cache Sound Cover Art to Supabase Storage

Date: 2026-03-29

## What You Need To Do

The scraper now extracts `cover_url` from TikTok's CDN during sound analysis. However, TikTok CDN URLs expire within hours. For any cached analysis older than a few hours, the `cover_url` will 404 and the frontend will show a placeholder icon instead of the album art.

**Fix**: During the scrape phase (WF-SI-1), download the cover image and upload it to Supabase Storage. Store the permanent Supabase Storage URL as `cover_url` instead of the raw TikTok CDN URL.

## Implementation

1. In WF-SI-1 (Scrape) — after extracting the TikTok CDN cover URL:
   - Fetch the image bytes
   - Upload to Supabase Storage bucket (e.g., `sound-covers/{sound_id}.jpg`)
   - Use the public Supabase Storage URL as `cover_url` going forward

2. The Supabase Storage URL format would be:
   `https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/sound-covers/{sound_id}.jpg`

3. Create the `sound-covers` storage bucket if it doesn't exist (public read access).

## Constraints

- Keep the image small — the TikTok `cover_medium` is fine, no need for high-res
- Don't re-upload if the file already exists (skip on cache hit)
- If the upload fails, fall back to the raw CDN URL (better than nothing for fresh analyses)

## Supabase

- Project ref: `kxvgbowrkmowuyezoeke`
- WF-SI-1 workflow ID: `FpKCtspCdCPoASbF`

## Verification

```bash
# Check the storage bucket exists
supabase storage ls --project-ref kxvgbowrkmowuyezoeke

# Trigger a fresh analysis and verify the cover_url points to Supabase Storage, not TikTok CDN
curl "$BASE_URL/get-sound-analysis?job_id=$JOB_ID" -H "apikey: $ANON_KEY" | jq '.cover_url'
# Should return: https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/sound-covers/...

Also:  - TikTok CDN URLs for cover art expire within hours (same as video
   CDN). For cached analyses older than a few hours, the cover_url
  may 404. If the frontend needs persistent cover art, consider     
  proxying/caching the image to Supabase Storage during scrape time.

```

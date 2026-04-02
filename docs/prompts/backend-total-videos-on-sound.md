# Task: Add Total Videos Count to Sound Analysis

Date: 2026-03-30

## What You Need To Do

The Sound Intelligence detail page shows "VIDEOS ANALYZED: 1,000" but there's no stat for the **total number of videos** using this sound on TikTok. The TikTok music page shows this count (e.g., "54.2K videos"). This is important context — "1,000 analyzed out of 54,200 total" tells a very different story than just "1,000".

## What to add

1. During scraping (WF-SI-1), extract the total video count from the TikTok music page metadata (the "X videos" number shown on the sound page)
2. Store it as `total_videos_on_sound` in the `sound_intelligence_jobs` table (add column if needed)
3. Include it in the analysis JSON as `total_videos_on_sound: number` so `get-sound-analysis` returns it

## Frontend will display

Once the field exists, the frontend will show:
- "VIDEOS ANALYZED: 1,000" with subtitle "of 54.2K on this sound"

## Constraint

Only scrape this during the initial metadata fetch — don't make additional API calls for it.

## Supabase

- Project ref: `kxvgbowrkmowuyezoeke`
- WF-SI-1 workflow ID: `FpKCtspCdCPoASbF`

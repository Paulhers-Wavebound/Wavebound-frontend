# Task: Fix Sound Analysis API Response Issues

Date: 2026-03-29

## What You Need To Do

The frontend Sound Intelligence dashboard has been rebuilt locally from the Lovable export. During bug fixing we found several issues that originate in the **backend Edge Functions** (the `get-sound-analysis` response). These need to be fixed in the backend so the frontend displays accurate data.

There are **5 issues** to fix, ranked by user impact:

### 1. Sound Cover Art Missing From Response

The `SoundAnalysis` response has no cover image field. The Sound Intelligence detail page header (`SoundHeader.tsx`) shows the track name, artist, album, and status badge — but no artwork. It looks bare and unfinished.

**What to add**: A `cover_url: string` field to the `SoundAnalysis` response. TikTok music pages expose a cover/thumbnail image for the sound (the album art or sound avatar). This should be scraped during the initial sound metadata fetch and stored alongside `track_name`, `artist_name`, etc.

**Fallback**: If cover art isn't available (e.g., original sounds without album art), return `null` and the frontend will show a placeholder with a music note icon.

**Where it's used**: The frontend `SoundHeader` component will display it as a ~56px rounded square thumbnail to the left of the track name + artist.

### 2. Verdict Algorithm — Everything Returns "SCALE"

Every `FormatBreakdown.verdict` in the API response is `"SCALE"` regardless of the format's actual performance. The frontend now computes its own verdict client-side as a workaround, but the backend should return correct values.

**Expected logic** (engagement × recency):
- **SCALE**: High engagement rate AND recent daily velocity is trending up
- **EMERGING**: Low video count (<10) but velocity trending up
- **SATURATED**: High video count but engagement declining or low (<2%)
- **DECLINING**: Recent velocity dropping significantly (>30% drop vs early period)

**Where to look**: The Edge Function that synthesizes the `FormatBreakdown[]` array. Each format has `daily: number[]` (daily video counts), `share_rate: number` (engagement), and `video_count: number` — all the inputs needed.

### 3. Song Duration Missing From Response

The `SoundAnalysis` response includes `avg_duration_seconds` at the top level, but the frontend needs the **actual song/sound duration** (not average video duration) to render the Song Timestamp Heatmap correctly. The heatmap was hardcoded to 120s and we now pass `avg_duration_seconds` as a workaround, but this is the average TikTok video length, not the song length.

**What to add**: A `song_duration_seconds: number` field to the `SoundAnalysis` response. This should be the duration of the original TikTok sound (available from the TikTok music page metadata during scraping).

### 4. Suspicious Snippet Window "0:01–0:02"

For the Aperture sound, Dance/Challenge format, the `hooks.snippet` returns `"0:01-0:02"` — a 1-second window on a ~14-second sound. This seems too narrow to be meaningful.

**Investigate**: Is the snippet detection logic finding the right peak window? With a 14s sound and ~20 songBars, each bar covers <1s. The snippet should probably identify a broader "hot zone" (e.g., 3-5 second window) rather than the single peak bar.

**Where to look**: The hook analysis / snippet detection in the classification or synthesis Edge Function. The `snippet` field format is `"M:SS-M:SS"` and `snippet_pct` is the percentage of top performers using that window.

### 5. Creator Handles — Double @ Prefix

The API returns creator handles with an `@` prefix (e.g., `@username`). The frontend was prepending another `@`, showing `@@username`. We've fixed the frontend to handle both formats, but **the API should be consistent**: either always include `@` or never include it.

**Recommendation**: Always return handles **without** the `@` prefix in the API response. The frontend is responsible for display formatting. This affects:
- `FormatBreakdown.topVideos[].handle`
- `CreatorTier.topCreators[].handle`
- `TopVideo.creator`

## Context — What the Frontend Session Changed

Files modified in the frontend (for reference, not action):
- `src/components/sound-intelligence/SongTimestampHeatmap.tsx` — Complete redesign: continuous color gradient heatmap, honest intensity tooltips (Peak/High/Moderate/Low/Minimal), removed fake "% of videos" stats derived from normalized data, dynamic time axis, tooltip edge clamping
- `src/components/sound-intelligence/FormatBreakdownTable.tsx` — Client-side `computeVerdict()` function as workaround for always-SCALE backend, "Share Rate" → "Engagement Rate" labels, passes `songDuration` to heatmap
- `src/components/sound-intelligence/CreatorTiersSection.tsx` — Fixed double @@ on handles, "Share" → "Engagement" labels
- `src/components/sound-intelligence/GeoSpreadSection.tsx` — "Avg Share" → "Avg Engagement" label
- `src/pages/label/SoundIntelligenceDetail.tsx` — Passes `analysis.avg_duration_seconds` to FormatBreakdownTable

## Current API Response Shape (relevant fields)

```typescript
interface SoundAnalysis {
  // ...
  cover_url: string | null;      // MISSING — sound cover art / album artwork
  avg_duration_seconds: number;   // Average VIDEO duration, NOT song duration
  // MISSING: song_duration_seconds — needed for heatmap

  formats: FormatBreakdown[];
}

interface FormatBreakdown {
  name: string;
  video_count: number;
  share_rate: number;           // This is actually engagement rate (likes/plays)
  verdict: 'SCALE' | 'SATURATED' | 'EMERGING' | 'DECLINING';  // Always "SCALE" currently
  daily: number[];              // Daily video counts
  songBars: number[];           // Normalized 0-100 per song segment
  hooks: {
    snippet: string;            // e.g., "0:01-0:02" — suspiciously narrow
    snippet_pct: number;
    face_pct: number;
    top_hooks: string[];
  };
  topVideos: {
    handle: string;             // Comes with @ prefix — should be without
    video_url?: string;
    why: string;
    views: string;
    share: string;
  }[];
}
```

## API Endpoints

- Base: `https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1`
- `POST /trigger-sound-analysis` — triggers scraping + analysis
- `GET /get-sound-analysis?job_id=X` — returns full SoundAnalysis JSON
- Project ref: `kxvgbowrkmowuyezoeke`

## Test Data

- **Aperture**: `https://www.tiktok.com/music/Aperture-7598271658722576401`
- **As It Was (seeded)**: `https://www.tiktok.com/music/As-It-Was-7086491292068498437`
- **Label ID (Columbia)**: `8cd63eb7-7837-4530-9291-482ea25ef365`

## Verification Steps

After fixing, verify with:

```bash
# Trigger a fresh analysis (or use cached)
curl -X POST "$BASE_URL/trigger-sound-analysis" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sound_url":"https://www.tiktok.com/music/Aperture-7598271658722576401","label_id":"8cd63eb7-7837-4530-9291-482ea25ef365"}'

# Get the analysis and check:
curl "$BASE_URL/get-sound-analysis?job_id=$JOB_ID" -H "apikey: $ANON_KEY" | jq '{
  cover_url: .cover_url,
  song_duration: .song_duration_seconds,
  verdicts: [.formats[] | {name, verdict, video_count, share_rate}],
  snippet_check: [.formats[] | {name, snippet: .hooks.snippet}],
  handle_check: [.formats[0].topVideos[0].handle]
}'
```

**Expected results:**
1. `cover_url` is a valid image URL (or `null` for original sounds without art)
2. `song_duration_seconds` field exists and is reasonable (e.g., 14 for Aperture)
3. `verdicts` show a MIX of SCALE/EMERGING/SATURATED/DECLINING, not all SCALE
4. `snippet` values are reasonable time windows (3-5s wide, not 1s)
5. `handle` values have NO `@` prefix

## What Could Go Wrong

- **Verdict logic tuning**: The thresholds may need adjustment based on real data distribution. Start with the logic above, test on both Aperture (short sound, few videos) and As It Was (long song, many videos), and adjust.
- **Song duration scraping**: TikTok may not always expose sound duration in the music page metadata. Fall back to inferring from `songBars.length × segment_size` if scraping fails.
- **Snippet window**: If widening the window breaks the `snippet_pct` accuracy, consider returning both a "peak second" and a "recommended clip range" as separate fields.

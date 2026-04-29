# Auto Sound Intelligence Pipeline

## What it does

Automatically tracks and analyzes TikTok sounds for roster artists, alongside manually tracked competitor sounds, with clear source differentiation throughout the UI.

## Who uses it and why

Label managers use this to monitor how their roster artists' sounds perform on TikTok without manually pasting URLs. They can also manually track competitor sounds for comparison.

## Correct behavior

### Auto-discovery

- When a roster artist posts a new TikTok sound, the pipeline automatically triggers a sound analysis
- Auto-discovered sounds are tagged with `source: "auto_discovery"` and the artist's handle
- Auto-discovered sounds expire after 30 days (configurable via `tracking_expires_at`)
- Expiry countdown badge appears when nearing expiration

### Sound Intelligence Overview (`/label/sound-intelligence`)

- Filter tabs: All / Roster / Competitor — filter by `source` field
- "Track Sound" button opens collapsible input for manually adding competitor sounds
- Pasting multiple TikTok `/music/` links creates a merged canonical sound, documented in `docs/features/sound-id-merge.md`
- Source badges on all cards: "Auto @handle" (orange) or "Manual" (subtle)
- Grid and list views both show source information
- PDF export and view toggle in top action bar

### Artist Detail — Sounds tab (`/label/artist/:id?tab=sounds`)

- Shows all tracked sounds for the specific artist, filtered by `artist_handle`
- Sound cards with cover art, velocity status, stats (videos, views, engagement, winner format)
- Click-through to full Sound Intelligence Detail page
- Processing state shown for in-progress analyses
- Empty state explains auto-tracking behavior

### Sound Intelligence Detail (`/label/sound-intelligence/:jobId`)

- Source badge next to back button: "Roster Sound @handle" or "Competitor"
- All existing functionality (verdict, monitoring, export, subscribe) unchanged

## Edge cases

- **Empty state (overview)**: Shows message about auto-tracking + manual competitor option
- **Empty state (artist sounds)**: Explains sounds are auto-tracked when artist posts
- **No artist_handle**: Source badge shows without handle
- **Expired sounds**: Tracked by `tracking_expires_at`, countdown shown when < 30 days remain
- **Failed analyses**: Show in processing section with retry option
- **Loading**: Spinner states for both overview polling and artist sounds fetch

## Key files

- `src/pages/label/SoundIntelligenceOverview.tsx` — Overview with filters and source badges
- `src/pages/label/SoundIntelligenceDetail.tsx` — Detail with source context
- `src/pages/label/LabelArtistDetail.tsx` — Artist detail with Sounds tab
- `src/utils/soundIntelligenceApi.ts` — API functions including `listSoundAnalyses` with source filter
- `src/types/soundIntelligence.ts` — `ListAnalysisEntry` with source/handle/expiry fields

## Database columns (sound_intelligence_jobs)

- `source`: `"manual"` | `"auto_discovery"`
- `artist_handle`: TikTok handle for auto-discovered sounds
- `tracking_expires_at`: Timestamp for auto-expiry (30 days default)

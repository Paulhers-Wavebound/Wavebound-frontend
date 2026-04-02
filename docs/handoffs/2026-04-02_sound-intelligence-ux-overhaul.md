# Sound Intelligence Dashboard — UX Overhaul

**Date:** 2026-04-02
**From:** Backend (Claude)
**To:** Frontend
**Priority:** High — current layout confuses label customers

---

## Problem Statement

The Sound Intelligence page has three UX failures:

1. **Real-Time Monitoring is confusing** — no context for what it is, how often it scans, or what the spike badges mean. Label execs open the page and are immediately overwhelmed.
2. **The 6-axis classification system is invisible** — we built 6 independent axes (Format, Niche, Vibe, Intent, Creator Profile, Song Role) but only Format is prominently displayed. The other 5 are buried in format drill-downs.
3. **Format drill-down is flat** — expanding a format shows disconnected data cards instead of a clear hierarchy: Format → Niches within it → Vibes within it → who's making it.

---

## Section 1: Real-Time Monitoring Redesign

### Current Problem
- Chart shows ALL formats including ones with <1% share — too noisy
- Spike badges fire for formats going 0→anything (FIXED in backend — `prevViews === 0` now skips spike detection)
- No explanation of what monitoring does or how often it checks
- The "+87K views" delta has no context (is that good?)

### Backend Data Available
The monitoring snapshots store per-format stats every 3 hours (or 15 min in intensive mode):
```typescript
interface MonitoringSnapshot {
  captured_at: string;
  total_views: number;
  total_videos: number;
  user_count: number;
  new_videos_count: number;
  format_stats: Record<string, {
    count: number;
    views: number;
    likes: number;
    shares: number;
    comments: number;
  }>;
  niche_stats: Record<string, { count: number; views: number; likes: number }>;
  intent_stats: Record<string, { count: number; views: number; likes: number }>;
}
```

Spike alerts are in `sound_alerts` table:
```typescript
interface SpikeAlert {
  alert_type: 'format_spike';
  severity: 'info' | 'warning';
  title: string;       // e.g. "Lip Sync / Dance spiking on original sound - elpapi_music"
  message: string;     // e.g. "Lip Sync / Dance gained 15,000 views (45% growth)"
  data: {
    format: string;
    growth_pct: number;
    view_delta: number;
    window: '15min' | '3h';
  };
}
```

### Recommended UX

**Header area:**
```
LIVE MONITORING · Scanning every 3h · Last checked 2m ago
```
One line. No info popover needed — the text IS the explanation.

If in intensive mode (spike detected):
```
⚡ INTENSIVE MONITORING · Scanning every 15min · Tracking Lip Sync / Dance spike
```

**Chart filtering:**
- Only show formats with ≥5% of total views in the chart lines
- Group the rest into an "Other" line
- This typically means 3-5 lines instead of 10+

**Spike badges:**
- After the backend fix, spike badges will only appear when an ESTABLISHED format accelerates
- Keep them but make them less visually dominant — small pill above the chart, not screaming color badges
- Show: `Format +45% ↑12K` (percentage + absolute delta)
- Cap at 3 badges max. If more, show "+2 more"

**Total delta context:**
Instead of just "+87K views", show:
```
+87K views · +12 new videos · 196 creators
```

---

## Section 2: 6-Axis Display Architecture

### The Core Insight

The page currently shows Format as the ONLY primary axis, with everything else hidden. But a label exec cares about ALL six axes:

| Axis | What it answers | Why labels care |
|------|----------------|-----------------|
| **Format** | How are people using my sound? | Which video types to push |
| **Niche** | What communities adopted it? | Where to seed next |
| **Vibe** | What energy does content carry? | Brand safety + positioning |
| **Intent** | Is it organic or paid? | ROI of promo spend |
| **Creator Profile** | Who's making content? | Target demographic validation |
| **Song Role** | Is the song the star or background? | Sound stickiness |

### Recommended Layout

Replace the current single "Format Breakdown" section with a **tabbed axis browser**:

```
┌─────────────────────────────────────────────────────────┐
│  [FORMAT]  [NICHE]  [VIBE]  [INTENT]  [CREATORS]       │
├─────────────────────────────────────────────────────────┤
│  (selected tab's breakdown table + chart)                │
│                                                          │
│  FORMAT tab: format breakdown table (current design)     │
│  NICHE tab: niche breakdown (same table layout)          │
│  VIBE tab: vibe breakdown (same table layout)            │
│  INTENT tab: intent bars (organic/paid/official/fan)     │
│  CREATORS tab: demographics grid (age × gender)          │
└─────────────────────────────────────────────────────────┘
```

**Song Role** doesn't need its own tab — show it as a small stat bar at the top of the page:
```
🎵 Primary 72%  ·  Background 25%  ·  Sound Bite 3%
```
This tells the label "72% of creators are using this song AS the content, not just as background music." That's a powerful signal.

### Data Available for Each Tab

**NICHE tab** — from `analysis.niche_distribution`:
```json
[
  {"niche": "Casual", "pct": 34, "video_count": 40, "avg_views": 13624, "engagement": 9.7},
  {"niche": "Music", "pct": 31, "video_count": 36, "avg_views": 5949, "engagement": 5.2},
  {"niche": "Cars", "pct": 14, "video_count": 16, "avg_views": 2050, "engagement": 17.7}
]
```

**VIBE tab** — from `analysis.vibe_distribution`:
```json
[
  {"vibe": "Playful", "pct": 42, "video_count": 50, "avg_views": 10035, "engagement": 8.4},
  {"vibe": "Confident", "pct": 20, "video_count": 24, "avg_views": 11015, "engagement": 8.7},
  {"vibe": "Chill", "pct": 18, "video_count": 21, "avg_views": 2011, "engagement": 14.1}
]
```

**INTENT tab** — from `analysis.intent_breakdown`:
```json
[
  {"intent": "organic", "pct": 79, "video_count": 93, "avg_views": 8500},
  {"intent": "artist_official", "pct": 12, "video_count": 14, "avg_views": 15000},
  {"intent": "paid", "pct": 5, "video_count": 6, "avg_views": 3200},
  {"intent": "fan_account", "pct": 4, "video_count": 5, "avg_views": 6800}
]
```

**CREATORS tab** — from `analysis.creator_demographics`:
```json
{
  "age_breakdown": [
    {"bracket": "Young Adult", "pct": 74, "count": 87},
    {"bracket": "Teen", "pct": 12, "count": 14},
    {"bracket": "Adult", "pct": 10, "count": 12}
  ],
  "gender_breakdown": [
    {"gender": "Female", "pct": 46, "count": 54},
    {"gender": "Male", "pct": 38, "count": 45},
    {"gender": "Mixed Group", "pct": 10, "count": 12}
  ]
}
```

---

## Section 3: Format Drill-Down Redesign

### Current Problem
Expanding a format (e.g., Montage) shows a jumble of cards: Song Timestamp Heatmap, Hook Patterns, Videos Per Day, Insight stats, Top Niches, Intent, Dominant Vibe, Top Videos. No hierarchy, no story.

### Recommended Drill-Down Layout

When a format row is expanded, show a **focused story** about that format:

```
┌────────────────────────────────────────────────────────────┐
│  ● Montage · 3 videos · 3% of total · 2,581 avg views     │
│    EMERGING                                                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  WHO'S MAKING THESE                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Music 2  │  │ Cars  1  │  │ Chill    │                  │
│  │ (niche)  │  │ (niche)  │  │ (vibe)   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│  100% Organic · 0% Face-in-2s · 100% use 0:00-0:08 clip   │
│                                                             │
│  TOP VIDEOS                                                 │
│  simenfredrikson  #volvo #carlife       6K  27.3%           │
│  username74...    #britneyspears        909  3.5%           │
│  heiabror         @El Papi versjon      560  6.3%           │
│                                                             │
│  TIMING                                                     │
│  ▓▓▓▓▓▓▓░░  Most used clip: 0:00-0:08                      │
│  ███░░░░░░  3 videos over 9 days                            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Key changes:**
1. **Niches and Vibe as pill badges** — not separate sections, just inline context
2. **Intent as a one-liner** — "100% Organic" or "60% Organic · 30% Paid · 10% Fan"
3. **Hook stats as a one-liner** — "0% Face · 100% Snippet" not two big stat cards
4. **Heatmap smaller** — thin bar chart, not a full card
5. **Videos per day smaller** — thin bar, not a full card
6. **Top Videos stay prominent** — this is what the exec clicks through to

### Data Available Per Format

Each format in `analysis.formats[]` already has:
```typescript
interface FormatBreakdown {
  name: string;
  video_count: number;
  avg_views: number;
  share_rate: number;
  engagement: number;
  verdict: 'SCALE' | 'SATURATED' | 'EMERGING' | 'DECLINING';
  daily: number[];          // videos per day for sparkline
  hooks: {
    face_pct: number;       // % with face in first 2s
    snippet_pct: number;    // % using the identified clip window
    snippet: string;        // e.g. "0:00-0:08"
    top_hooks: string[];
  };
  songBars: number[];       // 24 segment heatmap
  topVideos: Array<{
    handle: string;
    views: string;
    share: string;
    why: string;            // caption excerpt
    video_url: string;
    niche?: string;         // v3: single word
    intent?: string;
    vibe?: string;
  }>;
  insight: string;
  // v3 enrichment:
  top_niches?: Array<{ niche: string; count: number }>;
  top_intents?: Array<{ intent: string; count: number }>;
  dominant_vibe?: string;
}
```

---

## Section 4: Page-Level Summary Stats

### Add a "sound health" header strip at the top

Right below the song title/cover art, show 5-6 key stats:

```
118 videos · 196 creators · 896K views · 72% Primary · 79% Organic · Accelerating ↗
```

These are the stats a label exec scans first. Currently they're scattered or hidden.

Data sources:
- `analysis.total_videos`
- `analysis.unique_creators` (or from `user_count`)
- Sum of views from snapshots
- `analysis.song_role_distribution[0].pct` for Primary %
- `analysis.intent_breakdown[0].pct` for Organic %
- `analysis.status` for lifecycle phase

---

## Section 5: v3 Taxonomy Reference

All axis values are now single words (April 2026 cleanup):

### Formats (22 total)
Lip Sync / Dance, Dance Choreography, Comedy, POV, Talking Head, Tutorial, Reaction, Cover, Review, Lyric Overlay, Aesthetic Edit, Transition Edit, Montage, Slideshow, Text Story, Concert, BTS, ASMR, Pet, Food, Art, Fitness

### Niches (26 canonical + open-ended)
General, Casual, Cars, Fashion, Beauty, Fitness, Food, Travel, Gaming, Sports, Family, Dating, School, Career, Politics, Mental Health, Pets, Music, Cinematic, Nightlife, Nature, Home, Tech, Humor, Art, ASMR
*(Gemini may generate custom single-word niches like "Equestrian", "Jewelry", "Magic")*

### Vibes (7 total)
Playful, Confident, Chill, Hype, Edgy, Emotional, Wholesome

### Intents (4 total)
organic, paid, artist_official, fan_account

### Song Roles (3 total)
primary, background, sound_bite

### Creator Profile
Format: `"{Age} {Gender}"` — e.g. "Young Adult Female", "Teen Male", "Not Visible"
Ages: Teen, Young Adult, Adult, Older Adult, Not Visible
Genders: Male, Female, Mixed Group, Not Visible

---

## Color Maps (updated in soundIntelligence.ts)

FORMAT_COLORS, VIBE_COLORS, and NICHE_COLOR_OVERRIDES have all been updated to v3 names with legacy backwards-compat mappings. See `src/types/soundIntelligence.ts` and `src/components/sound-intelligence/MonitoringTrendChart.tsx`.

---

## What NOT to Do

1. **Don't show all 22 formats in the monitoring chart** — filter to ≥5% of total views
2. **Don't hide the 6 axes** — they're the entire product differentiation. If a competitor can classify by format, we classify by 6 axes.
3. **Don't use legacy format names** — all slashed names (except "Lip Sync / Dance") are dead. The legacy COLOR mappings exist for backwards compat with cached data only.
4. **Don't put "Not Visible" demographics in pie charts** — filter them out, they add noise
5. **Don't show Song Role as a pie chart** — it's a 3-value stat, show as a text bar

---

*Generated 2026-04-02. Backend changes deployed: spike detection baseline guard, v3 format/niche/vibe taxonomy, monitoring snapshot cleanup.*

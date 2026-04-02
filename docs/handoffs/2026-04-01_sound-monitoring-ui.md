# Sound Intelligence Monitoring UI — Frontend Implementation

> Backend is fully deployed and live. All 4 edge functions are active and returning data.
> This document contains everything you need to build the monitoring UI.

## What Changed in Backend

Sound Intelligence now has **real-time monitoring**. Every completed sound is automatically monitored:
- **Standard mode**: stats scraped every 3 hours
- **Intensive mode**: stats scraped every 15 minutes (auto-triggered when a format spikes)
- **Spike detection**: when a format's views grow >30% in 3h (or >10% in 15min), that format is flagged as spiking
- Sounds auto-downgrade from intensive → standard after 4 consecutive non-rising checks or 24h

The existing `list-sound-analyses` and `get-sound-analysis` endpoints now include a `monitoring` object. Two new endpoints exist for alerts and trend history.

---

## API Changes — Exact Response Shapes

### 1. `list-sound-analyses` (GET) — updated

Each entry in the `analyses` array now has a `monitoring` field:

```json
{
  "job_id": "ded24f42-011e-4cb9-8f2b-105cb72fcdb0",
  "sound_id": "7609031607295822614",
  "track_name": "original sound - elpapi_music",
  "artist_name": "El Papi",
  "album_name": "",
  "cover_url": "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/sound-covers/7609031607295822614.jpg",
  "status": "completed",
  "videos_scraped": 115,
  "videos_analyzed": 115,
  "created_at": "2026-03-30T21:57:20.912523+00:00",
  "completed_at": "2026-03-30T22:03:25.527696+00:00",
  "last_refresh_at": "2026-04-01T20:17:57.617929+00:00",
  "refresh_count": 8,
  "monitoring": {
    "monitoring_interval": "intensive",
    "last_monitored_at": "2026-04-01T21:00:21.180885+00:00",
    "next_check_at": "2026-04-01T21:15:21.180Z",
    "spike_format": "Dance / Challenge",
    "intensive_since": "2026-04-01T20:18:23.548544+00:00"
  },
  "summary": { ... }
}
```

`monitoring` is **null** when `monitoring_interval` is `"paused"` or absent. Otherwise always present for completed sounds.

### 2. `get-sound-analysis` (GET) — updated

Same `monitoring` object added to the response:

```json
{
  "status": "completed",
  "job_id": "ded24f42-...",
  "sound_id": "7609031607295822614",
  "track_name": "original sound - elpapi_music",
  "artist_name": "El Papi",
  "user_count": 187,
  "completed_at": "2026-03-30T22:03:25.527696+00:00",
  "last_refresh_at": "2026-04-01T20:17:57.617929+00:00",
  "refresh_count": 8,
  "monitoring": {
    "monitoring_interval": "intensive",
    "last_monitored_at": "2026-04-01T21:00:21.180885+00:00",
    "next_check_at": "2026-04-01T21:15:21.180Z",
    "spike_format": "Dance / Challenge",
    "intensive_since": "2026-04-01T20:18:23.548544+00:00"
  },
  "analysis": { ... }
}
```

### 3. `get-sound-alerts` (GET) — NEW endpoint

**URL**: `GET /functions/v1/get-sound-alerts?label_id=X` or `?job_id=X`
Optional params: `&unread_only=true`, `&limit=50`

```json
{
  "alerts": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "label_id": "uuid",
      "sound_id": "7609031607295822614",
      "alert_type": "format_spike",
      "severity": "warning",
      "title": "Dance / Challenge is spiking on El Papi",
      "message": "Views grew 35% (+12,500) in the last 3 hours",
      "data": {
        "format": "Dance / Challenge",
        "growth_pct": 35,
        "view_delta": 12500,
        "window_hours": 3
      },
      "is_read": false,
      "created_at": "2026-04-01T20:18:23.548544+00:00",
      "track_name": "original sound - elpapi_music",
      "artist_name": "El Papi",
      "cover_url": "https://..."
    }
  ],
  "unread_count": 3
}
```

**PATCH** `?alert_id=X` — marks alert as read. Returns `{ success: true }`.

Alert types: `format_spike`, `format_peak`, `new_videos_detected`, `velocity_surge`, `format_emerging`, `spike_ended`, `user_count_milestone`
Severity levels: `info`, `warning`, `celebration`

### 4. `get-sound-monitoring-history` (GET) — NEW endpoint

**URL**: `GET /functions/v1/get-sound-monitoring-history?job_id=X`
Optional params: `&hours=24`, `&limit=500`

```json
{
  "snapshots": [
    {
      "id": 1,
      "job_id": "ded24f42-...",
      "sound_id": "7609031607295822614",
      "captured_at": "2026-04-01T20:14:53.778Z",
      "user_count": 188,
      "total_videos": 115,
      "total_views": 809830,
      "total_likes": 65717,
      "total_comments": 833,
      "total_shares": 3703,
      "new_videos_count": 17,
      "format_stats": {
        "Dance / Challenge": {
          "count": 17,
          "views": 190824,
          "likes": 16945,
          "shares": 732,
          "comments": 146,
          "engagement": 0.0888
        },
        "Vlog / Lifestyle": {
          "count": 37,
          "views": 269344,
          "likes": 19773,
          "shares": 1151,
          "comments": 329,
          "engagement": 0.0734
        }
      }
    }
  ],
  "summary": {
    "snapshot_count": 4,
    "hours_span": 0.8,
    "total_view_growth": 61260,
    "total_video_growth": 0,
    "format_growth": {
      "Dance / Challenge": {
        "views_start": 190824,
        "views_end": 226735,
        "views_delta": 35911,
        "growth_pct": 19,
        "count_start": 17,
        "count_end": 23
      }
    }
  }
}
```

---

## TypeScript Types to Add

Add to `src/types/soundIntelligence.ts`:

```typescript
// Monitoring state returned by list/get endpoints
interface SoundMonitoring {
  monitoring_interval: 'standard' | 'intensive' | 'paused';
  last_monitored_at: string | null;
  next_check_at: string | null;       // ISO string — pre-computed by backend
  spike_format: string | null;         // e.g. "Dance / Challenge" — null when not spiking
  intensive_since: string | null;      // when intensive mode started
}

// Alert from get-sound-alerts
interface SoundAlert {
  id: string;
  job_id: string;
  label_id: string;
  sound_id: string;
  alert_type: 'format_spike' | 'format_peak' | 'new_videos_detected' | 'velocity_surge' | 'format_emerging' | 'spike_ended' | 'user_count_milestone';
  severity: 'info' | 'warning' | 'celebration';
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  track_name: string;
  artist_name: string;
  cover_url: string | null;
}

// Monitoring snapshot from get-sound-monitoring-history
interface MonitoringSnapshot {
  id: number;
  job_id: string;
  sound_id: string;
  captured_at: string;
  user_count: number;
  total_videos: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  new_videos_count: number;
  format_stats: Record<string, {
    count: number;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagement: number;
  }>;
  niche_stats: Record<string, { count: number; views: number; likes: number }> | null;
  intent_stats: Record<string, { count: number; views: number; likes: number }> | null;
}

interface FormatGrowth {
  views_start: number;
  views_end: number;
  views_delta: number;
  growth_pct: number;
  count_start: number;
  count_end: number;
}

interface MonitoringHistorySummary {
  snapshot_count: number;
  hours_span: number;
  total_view_growth: number;
  total_video_growth: number;
  format_growth: Record<string, FormatGrowth>;
}
```

Update `ListAnalysisEntry` to include:
```typescript
monitoring: SoundMonitoring | null;
```

Update `GetSoundAnalysisResponse` to include:
```typescript
monitoring: SoundMonitoring | null;
```

---

## API Functions to Add

Add to `src/utils/soundIntelligenceApi.ts`:

```typescript
// Fetch alerts for a label
export async function getSoundAlerts(
  labelId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<{ alerts: SoundAlert[]; unread_count: number }> {
  const params = new URLSearchParams({ label_id: labelId });
  if (options?.unreadOnly) params.set('unread_only', 'true');
  if (options?.limit) params.set('limit', String(options.limit));
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-sound-alerts?${params}`);
  return res.json();
}

// Mark alert as read
export async function markAlertRead(alertId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/functions/v1/get-sound-alerts?alert_id=${alertId}`, {
    method: 'PATCH',
  });
}

// Fetch monitoring history for trend charts
export async function getSoundMonitoringHistory(
  jobId: string,
  hours?: number
): Promise<{ snapshots: MonitoringSnapshot[]; summary: MonitoringHistorySummary }> {
  const params = new URLSearchParams({ job_id: jobId });
  if (hours) params.set('hours', String(hours));
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-sound-monitoring-history?${params}`);
  return res.json();
}
```

---

## UI Components to Build

### 1. Monitoring Status Badge (on sound cards in overview list)

**Where**: `SoundIntelligenceOverview.tsx` — on each sound card/row

**Logic**:
```
if (!monitoring) → show nothing (sound is still processing or paused)
if (monitoring.monitoring_interval === 'intensive') →
  RED pulsing dot + "Spiking" + spike_format name
  e.g. "🔴 Spiking — Dance / Challenge"
if (monitoring.monitoring_interval === 'standard') →
  GREEN dot + "Monitoring"
```

**Design**: Small pill/badge, fits alongside existing status badges. Use the format's color from `FORMAT_COLORS` for the spike format text if you want extra visual punch.

### 2. Next Check Countdown (on sound cards + detail header)

**Where**: Overview cards + `SoundHeader.tsx`

**Logic**:
```typescript
const nextCheck = new Date(monitoring.next_check_at);
const now = new Date();
const diffMs = nextCheck.getTime() - now.getTime();
if (diffMs <= 0) return "Checking now...";
const mins = Math.floor(diffMs / 60000);
const hours = Math.floor(mins / 60);
if (hours > 0) return `Next check in ${hours}h ${mins % 60}m`;
return `Next check in ${mins}m`;
```

Update every 60 seconds with `setInterval`. Display as subtle secondary text below the monitoring badge.

When `monitoring_interval === 'intensive'`, the countdown will be short (≤15 min) — this naturally shows urgency.

### 3. Spike Format Highlight (on detail page format table)

**Where**: `FormatBreakdownTable.tsx`

**Logic**: When `monitoring.spike_format` matches a format row's name, add a visual indicator:
- Flame/trending icon (🔥 or a TrendingUp lucide icon) next to the format name
- Subtle animated glow border or left-border accent on that row
- Optional: tooltip showing "+35,911 views (+19%) in last hour" using monitoring history data

### 4. Real-Time Trend Chart (new component on detail page)

**Where**: New component `MonitoringTrendChart.tsx`, placed on `SoundIntelligenceDetail.tsx` — between the hero stats and the existing velocity chart (or as a new tab/section)

**Data source**: `getSoundMonitoringHistory(jobId, 24)` — last 24 hours of snapshots

**Chart type**: Recharts `<LineChart>` or `<AreaChart>` with:
- X-axis: `captured_at` timestamps
- Y-axis: views
- One line per format (from `format_stats` in each snapshot)
- Use `FORMAT_COLORS` for line colors
- Show total_views as a thicker summary line

**When to show**: Only when there are ≥2 snapshots. Hide section entirely if 0-1 snapshots (sound just started monitoring).

**Update frequency**: Fetch fresh data every 60 seconds when the detail page is open. This gives users real-time visibility.

### 5. Alert Bell / Notification Panel

**Where**: Top-right of the Sound Intelligence section header (both overview and detail)

**Components**:
- `SoundAlertBell.tsx` — bell icon with unread count badge
- `SoundAlertPanel.tsx` — dropdown/drawer showing alert list

**Data source**: `getSoundAlerts(labelId, { unreadOnly: false, limit: 20 })`

**Poll**: Every 60 seconds when sound intelligence pages are active. Use React Query with `refetchInterval: 60000`.

**Alert item design**:
- Cover art thumbnail (32x32) + track_name + alert title
- Severity-based left border: info=blue, warning=orange (#e8430a), celebration=green
- Relative time ("3 min ago", "2h ago")
- Click → mark as read (PATCH) + navigate to the sound's detail page
- "Mark all as read" button at bottom

**Unread badge**: Show on the bell icon. Red dot with count. Hide when 0.

### 6. Monitoring Summary in SoundHeader

**Where**: `SoundHeader.tsx` on the detail page

Add a row showing:
- Monitoring status pill (same as overview badge but larger)
- "Last checked 14 min ago" (from `last_monitored_at`)
- "Next check in 1m" countdown
- If spiking: "Dance / Challenge spiking since 42 min ago" (from `intensive_since`)

---

## Implementation Order (suggested)

1. **Types + API functions** — add types and API helpers first
2. **Monitoring badge on overview cards** — highest visual impact, simplest to build
3. **SoundHeader monitoring row** — detail page header update
4. **Spike format highlight in table** — visual pop on the format that's trending
5. **Alert bell + panel** — notification system
6. **Monitoring trend chart** — most complex, but shows the real power of real-time data

---

## Design Notes

- Follow existing dark theme: L0-L3 backgrounds, burn orange (#e8430a) for accent/spikes
- Monitoring badges should feel "alive" — pulsing animation for intensive mode, static for standard
- Keep the UI non-intrusive when nothing is spiking. Standard monitoring = subtle green indicator
- When a spike IS happening = it should be immediately obvious (color, animation, prominent placement)
- The monitoring trend chart should use the same FORMAT_COLORS palette already defined in the codebase
- Alert severities: `warning` (spike) = orange, `celebration` (milestone) = green, `info` = blue/white

---

## Classification v2 — New Analysis Fields (deployed 2026-04-02)

The `analysis` object from `get-sound-analysis` now includes 6 new data axes from v2 classification:

```typescript
// In the analysis object:
interface SoundAnalysis {
  // ... existing fields (formats, velocity, winner, etc.) ...

  // NEW — v2 classification axes
  niche_distribution: Array<{
    niche: string;       // e.g. "Casual / Social", "Car Culture", "Music / Song"
    video_count: number;
    pct: number;         // percentage of total videos
    avg_views: number;
    engagement: number;  // like_rate as percentage
  }>;

  intent_breakdown: Array<{
    intent: string;      // "organic" | "artist_official" | "paid" | "fan_account"
    video_count: number;
    pct: number;
    avg_views: number;
    engagement: number;
  }>;

  song_role_distribution: Array<{
    role: string;        // "primary" | "background" | "sound_bite"
    video_count: number;
    pct: number;
    avg_views: number;
    engagement: number;
  }>;

  vibe_distribution: Array<{
    vibe: string;        // "Funny / Playful", "Confident / Flex", "Chill / Aesthetic", etc.
    video_count: number;
    pct: number;
    avg_views: number;
    engagement: number;
  }>;

  creator_demographics: {
    profiles: Array<{ profile: string; video_count: number; pct: number; avg_views: number }>;
    age_breakdown: Array<{ age: string; count: number; pct: number }>;
    gender_breakdown: Array<{ gender: string; count: number; pct: number }>;
  };

  unclassified_count: number;  // videos that failed Gemini classification
}

// Per-format entries now also include:
interface FormatEntry {
  // ... existing fields (name, video_count, verdict, etc.) ...
  top_niches: Array<{ name: string; count: number }>;     // top 3 niches for this format
  top_intents: Array<{ name: string; count: number }>;    // all intents for this format
  dominant_vibe: string;                                    // most common vibe
}

// Top videos now include:
interface TopVideo {
  // ... existing fields (rank, creator, format, etc.) ...
  niche: string;
  intent: string;
  vibe: string;
}
```

### UI Ideas for v2 Data

- **Niche pie/donut chart** on detail page — shows content distribution by subject matter
- **Intent bar** — visual split showing organic vs paid vs artist_official (useful for campaign ROI)
- **Vibe energy meter** — fun visual showing the emotional energy distribution
- **Creator demographics** — age/gender breakdown (great for label deck presentations)
- **Per-format niche overlay** — on the format breakdown table, show which niches dominate each format

### Live El Papi v2 Data (sample)
- Niches: Casual/Social 35%, Music/Song 30%, Car Culture 12%, Comedy 7%
- Intent: 79% organic, 15% artist official, 6% paid
- Song Role: 78% primary, 21% background
- Vibe: Funny/Playful 43%, Confident/Flex 21%, Chill/Aesthetic 17%
- Demographics: 74% Young Adult, 46% Female, 31% Male

---

## Live Test Data

The sound "original sound - elpapi_music" by El Papi (job_id: `ded24f42-011e-4cb9-8f2b-105cb72fcdb0`) under Soulbound label is currently being monitored with v2 classification data. Monitoring snapshots now include `niche_stats` and `intent_stats` alongside `format_stats`.

Label ID for Soulbound: `e6ea53f3-1f11-4f08-9013-eb3786a18fd3`

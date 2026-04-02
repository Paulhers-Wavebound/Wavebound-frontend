# Frontend Handoff: v2 Classification UI — 6-Axis Sound Intelligence

> Created: 2026-04-02
> Author: Backend Claude (co-founder) for Frontend Claude
> Priority: High — data is live in production, UI is the bottleneck

---

## Context

We just shipped v2 of the Sound Intelligence classification system. Every video analyzed now gets classified across 6 axes instead of just "format." The backend synthesis (WF-SI-3) aggregates all 6 axes into the analysis JSON. The data is already flowing — El Papi has 115 videos fully classified with all 6 axes. The frontend currently only displays the `formats` array. **5 new data arrays are sitting in the API response, completely unused by the UI.**

The existing detail page lives at `src/pages/label/SoundIntelligenceDetail.tsx` and renders ~13 components in this order:

```
SoundHeader → HeroStatsRow → MonitoringTrendChart → VelocityChart → WinnerCard →
PostingHoursChart → FormatTrendsChart → FormatBreakdownTable → HookDurationSection →
TopPerformersGrid → CreatorTiersSection → GeoSpreadSection → LifecycleCard
```

---

## What Changed in the API Response

The `analysis` object from `get-sound-analysis` now includes these **NEW fields** (zero breaking changes to existing fields):

### 1. `niche_distribution` — Array
What subjects/communities are using this sound?

```json
[
  {"niche": "Casual / Social", "video_count": 40, "pct": 35, "avg_views": 13287, "engagement": 9.8},
  {"niche": "Music / Song", "video_count": 35, "pct": 30, "avg_views": 6052, "engagement": 5.1},
  {"niche": "Car Culture", "video_count": 14, "pct": 12, "avg_views": 2181, "engagement": 17.5},
  {"niche": "Comedy / Humor", "video_count": 8, "pct": 7, "avg_views": 1079, "engagement": 4.0},
  {"niche": "Fashion / Style", "video_count": 3, "pct": 3, "avg_views": 5694, "engagement": 7.7},
  {"niche": "Party / Nightlife", "video_count": 3, "pct": 3, "avg_views": 1926, "engagement": 12.1},
  {"niche": "Relationships / Dating", "video_count": 2, "pct": 2, "avg_views": 3315, "engagement": 7.8}
]
```

Sorted by video_count descending. Can have 1–20+ entries. Long tail of 1-video niches is common.

### 2. `intent_breakdown` — Array
Is adoption organic, label-seeded, or paid?

```json
[
  {"intent": "organic", "video_count": 91, "pct": 79, "avg_views": 6231, "engagement": 9.6},
  {"intent": "artist_official", "video_count": 17, "pct": 15, "avg_views": 13664, "engagement": 5.3},
  {"intent": "paid", "video_count": 7, "pct": 6, "avg_views": 11196, "engagement": 9.5}
]
```

Always 2–4 entries max: `organic`, `artist_official`, `paid`, `fan_account`.

### 3. `song_role_distribution` — Array
Is the song the main event or just background noise?

```json
[
  {"role": "primary", "video_count": 90, "pct": 78, "avg_views": 9155, "engagement": 8.2},
  {"role": "background", "video_count": 24, "pct": 21, "avg_views": 2193, "engagement": 12.1}
]
```

Always 2–3 entries: `primary`, `background`, `sound_bite`.

### 4. `vibe_distribution` — Array
What's the emotional energy of videos using this sound?

```json
[
  {"vibe": "Funny / Playful", "video_count": 50, "pct": 43, "avg_views": 9868, "engagement": 8.5},
  {"vibe": "Confident / Flex", "video_count": 24, "pct": 21, "avg_views": 10739, "engagement": 8.6},
  {"vibe": "Chill / Aesthetic", "video_count": 19, "pct": 17, "avg_views": 2100, "engagement": 13.8},
  {"vibe": "Hype / Party", "video_count": 14, "pct": 12, "avg_views": 3767, "engagement": 6.1},
  {"vibe": "Edgy / Raw", "video_count": 3, "pct": 3, "avg_views": 4715, "engagement": 4.5},
  {"vibe": "Emotional / Sentimental", "video_count": 2, "pct": 2, "avg_views": 8338, "engagement": 4.6},
  {"vibe": "Wholesome / Feel-Good", "video_count": 2, "pct": 2, "avg_views": 989, "engagement": 12.6}
]
```

7 possible vibes. Sorted by count.

### 5. `creator_demographics` — Object
Who's using this sound? Age and gender estimates from video analysis.

```json
{
  "profiles": [
    {"profile": "Young Adult Female", "video_count": 50, "pct": 43, "avg_views": 10557},
    {"profile": "Young Adult Male", "video_count": 35, "pct": 30, "avg_views": 7347},
    {"profile": "Not Visible", "video_count": 24, "pct": 21, "avg_views": 2145},
    {"profile": "Teen Female", "video_count": 2, "pct": 2, "avg_views": 18844},
    {"profile": "Adult Female", "video_count": 1, "pct": 1, "avg_views": 899}
  ],
  "age_breakdown": [
    {"age": "Young Adult", "count": 85, "pct": 74},
    {"age": "Not", "count": 24, "pct": 21},
    {"age": "Teen", "count": 2, "pct": 2},
    {"age": "Adult", "count": 2, "pct": 2}
  ],
  "gender_breakdown": [
    {"gender": "Female", "count": 53, "pct": 46},
    {"gender": "Male", "count": 36, "pct": 31},
    {"gender": "Visible", "count": 24, "pct": 21},
    {"gender": "Group", "count": 1, "pct": 1}
  ]
}
```

**Known quirk:** "Not Visible" (carousel/montage with no face) parses as age="Not" gender="Visible". Frontend should treat this as a special case and display as "Not Visible" or "N/A". Filter these out of the age/gender breakdowns and show as a separate "No face detected" category.

### 6. `unclassified_count` — Number
How many videos failed AI classification (usually 0-2 out of 100+). Display as a subtle note, not a warning — they'll be auto-retried.

```json
1
```

### 7. Per-Format Enrichment (on existing `formats[]` entries)
Each format entry now also has:

```json
{
  "name": "Lip Sync / Dance",
  "video_count": 58,
  "top_niches": [
    {"name": "Casual / Social", "count": 37},
    {"name": "Music / Song", "count": 9},
    {"name": "Fashion / Style", "count": 3}
  ],
  "top_intents": [
    {"name": "organic", "count": 43},
    {"name": "artist_official", "count": 8},
    {"name": "paid", "count": 7}
  ],
  "dominant_vibe": "Funny / Playful"
}
```

### 8. Per-Video Enrichment (on existing `top_videos[]` entries)
Each top video now also has:

```json
{
  "rank": 1,
  "creator": "bellawesterfelt",
  "format": "Lip Sync / Dance",
  "niche": "Casual / Social",
  "intent": "organic",
  "vibe": "Funny / Playful",
  "why": "Vi behövde en norsk variant av denna...",
  "views": "91K",
  "share_rate": "11.7%",
  "url": "https://www.tiktok.com/@bellawesterfelt/video/..."
}
```

### 9. Monitoring Snapshots Enrichment
`MonitoringSnapshot.niche_stats` and `MonitoringSnapshot.intent_stats` are now populated (same shape as `format_stats` but keyed by niche/intent name).

---

## TypeScript Type Changes

Update `src/types/soundIntelligence.ts`:

```typescript
// === NEW TYPES ===

export interface NicheEntry {
  niche: string;
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface IntentEntry {
  intent: "organic" | "artist_official" | "paid" | "fan_account";
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface SongRoleEntry {
  role: "primary" | "background" | "sound_bite";
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface VibeEntry {
  vibe: string;
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface CreatorProfileEntry {
  profile: string;
  video_count: number;
  pct: number;
  avg_views: number;
}

export interface AgeBreakdownEntry {
  age: string;
  count: number;
  pct: number;
}

export interface GenderBreakdownEntry {
  gender: string;
  count: number;
  pct: number;
}

export interface CreatorDemographics {
  profiles: CreatorProfileEntry[];
  age_breakdown: AgeBreakdownEntry[];
  gender_breakdown: GenderBreakdownEntry[];
}

// === EXTEND EXISTING TYPES ===

// Add to FormatBreakdown:
//   top_niches?: { name: string; count: number }[];
//   top_intents?: { name: string; count: number }[];
//   dominant_vibe?: string;

// Add to TopVideo:
//   niche?: string;
//   intent?: string;
//   vibe?: string;

// Add to SoundAnalysis:
//   niche_distribution?: NicheEntry[];
//   intent_breakdown?: IntentEntry[];
//   song_role_distribution?: SongRoleEntry[];
//   vibe_distribution?: VibeEntry[];
//   creator_demographics?: CreatorDemographics;
//   unclassified_count?: number;

// Add to MonitoringSnapshot:
//   niche_stats?: Record<string, { count: number; views: number; likes: number }>;
//   intent_stats?: Record<string, { count: number; views: number; likes: number }>;
```

Mark all new fields as optional (`?`) for backward compatibility — older analyses won't have them.

---

## New Components to Build

### Component 1: `AudienceInsightSection` (the crown jewel)

**Placement:** After `WinnerCard`, before `PostingHoursChart` — this is the most label-relevant insight.

**What it shows:** A combined view of WHO is using this sound — the intersection of niche, demographics, and intent.

**Layout suggestion:**
```
┌──────────────────────────────────────────────────────────┐
│ 🎯 Audience Profile                                      │
│                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐│
│ │  INTENT     │ │ SONG ROLE   │ │  DEMOGRAPHICS        ││
│ │             │ │             │ │                      ││
│ │ 🟢 79%     │ │ 🎵 78%     │ │  👩 46%  👨 31%     ││
│ │  Organic    │ │  Primary    │ │  Female    Male      ││
│ │ 🟡 15%     │ │ 🎶 21%     │ │                      ││
│ │  Official   │ │  Background │ │  74% Young Adult     ││
│ │ 🔴  6%     │ │             │ │   2% Teen            ││
│ │  Paid       │ │             │ │                      ││
│ └─────────────┘ └─────────────┘ └──────────────────────┘│
│                                                          │
│ ┌────────────────────────────────────────────────────────┐│
│ │ VIBE SPECTRUM                                         ││
│ │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ││
│ │ Funny/Playful 43%  Confident 21%  Chill 17%  Hype 12%││
│ └────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Intent is a **stacked horizontal bar** — shows organic vs paid at a glance. Labels love seeing high organic % (means real adoption).
- Song role is a **simple two-segment bar** — primary (song IS the content) vs background (just vibes).
- Demographics uses **icon + percentage** — clean, no chart needed. Filter out "Not Visible" / age="Not" and show as a footnote.
- Vibe spectrum is a **gradient bar** — each vibe gets a color, widths proportional to percentages. Should feel like a mood ring.

**Vibe colors (suggestion):**
```typescript
export const VIBE_COLORS: Record<string, string> = {
  "Funny / Playful": "#FFD60A",        // yellow
  "Confident / Flex": "#FF453A",        // red
  "Chill / Aesthetic": "#64D2FF",       // cyan
  "Hype / Party": "#FF9F0A",           // orange
  "Edgy / Raw": "#8E8E93",             // gray
  "Emotional / Sentimental": "#BF5AF2", // purple
  "Wholesome / Feel-Good": "#30D158",   // green
};
```

**Intent colors (suggestion):**
```typescript
export const INTENT_COLORS: Record<string, string> = {
  "organic": "#30D158",         // green — real adoption
  "artist_official": "#0A84FF", // blue — label's own content
  "paid": "#FFD60A",            // yellow — paid promotion
  "fan_account": "#BF5AF2",    // purple — fan pages
};
```

### Component 2: `NicheDistributionChart`

**Placement:** After `AudienceInsightSection`, before `FormatTrendsChart`.

**What it shows:** Which content communities are adopting this sound. This is different from format — a "Lip Sync" video could be in the "Car Culture" niche or the "Fashion" niche.

**Layout suggestion:** Horizontal bar chart (like the format breakdown but simpler). Top 8 niches shown, rest collapsed into "Other". Each bar shows:
- Niche name
- Video count and percentage
- Average views (text, right-aligned)
- Engagement rate (small badge)

**Important:** Niches with `pct >= 5` get full bars. Niches with `pct < 5` are grouped into a collapsible "Other niches" section. The long tail (Magic / Illusion at 1%) shouldn't clutter the main view.

### Component 3: Update `FormatBreakdownTable` expanded rows

**What changes:** When a format row is expanded, add a new sub-section showing:
- **Top niches** for this format (from `format.top_niches`) — small pill badges
- **Intent split** for this format (from `format.top_intents`) — mini horizontal bar
- **Dominant vibe** (from `format.dominant_vibe`) — colored badge

This tells labels "Lip Sync is your winner format, and within Lip Sync, the Casual/Social niche with organic intent is where the magic happens."

### Component 4: Update `TopPerformersGrid`

**What changes:** Each video card currently shows: creator, format, views, share_rate, caption excerpt. Add:
- **Niche** pill badge (e.g., "Car Culture" in a colored pill)
- **Vibe** pill badge (e.g., "Funny / Playful" with vibe color)
- **Intent** icon: 🟢 organic, 🏷️ official, 💰 paid, 💜 fan

Keep it subtle — pills below the existing info, don't make the cards taller.

### Component 5: Update `MonitoringSnapshot` type and `MonitoringTrendChart`

**What changes:** The monitoring snapshots now include `niche_stats` and `intent_stats`. If you're showing format breakdowns over time in the trend chart, consider adding a toggle to also show niche shifts or intent mix over time. This is lower priority — the format trend chart is already doing the heavy lifting.

### Component 6: `UnclassifiedNote`

**What it shows:** If `unclassified_count > 0`, show a tiny note at the bottom of the analysis:
```
ℹ️ 1 video couldn't be classified by AI and will be retried automatically.
```

No need for a component file — just a conditional `<p>` in the detail page.

---

## What NOT to Do

1. **Don't rebuild existing components.** The format breakdown, velocity chart, creator tiers, geography, hook analysis, lifecycle — they all work. Just extend them where noted.
2. **Don't show raw "Not Visible" / age="Not" / gender="Visible".** These are parsing artifacts of "Not Visible" creator profiles (carousel/montage with no face). Clean them up in the UI: treat as "N/A" or "No face detected" and show as a footnote under demographics.
3. **Don't make the page twice as long.** The Audience Insight section and Niche chart are the only new full-width sections. Everything else is enrichment of existing components.
4. **Don't show niche/intent/vibe if the arrays are missing or empty.** Older analyses won't have them. Guard with `analysis.niche_distribution?.length > 0`.

---

## Testing

**Live test data:**
- Job ID: `ded24f42-011e-4cb9-8f2b-105cb72fcdb0`
- Label ID: `e6ea53f3-1f11-4f08-9013-eb3786a18fd3` (Soulbound)
- Sound: "original sound - elpapi_music" by El Papi
- 115 videos, all 6 axes populated
- Only 1 UNCLASSIFIED video

API call:
```
GET https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/get-sound-analysis?job_id=ded24f42-011e-4cb9-8f2b-105cb72fcdb0
```

---

## Suggested Section Order (updated detail page)

```
SoundHeader
HeroStatsRow
MonitoringTrendChart (if monitoring active)
VelocityChart
WinnerCard
AudienceInsightSection ← NEW (intent + song role + demographics + vibe spectrum)
NicheDistributionChart ← NEW
PostingHoursChart
FormatTrendsChart
FormatBreakdownTable (enriched expanded rows with niches/intent/vibe)
HookDurationSection
TopPerformersGrid (enriched cards with niche/vibe/intent)
CreatorTiersSection
GeoSpreadSection
LifecycleCard
UnclassifiedNote ← NEW (tiny footer note if count > 0)
```

---

## FORMAT_COLORS Update

The v2 classification uses different format names. Add these to `FORMAT_COLORS`:

```typescript
export const FORMAT_COLORS: Record<string, string> = {
  // Existing
  "Lyric Overlay": "#e8430a",
  "POV / Storytelling": "#0A84FF",
  "Reaction / Duet": "#BF5AF2",
  "Aesthetic / Mood Edit": "#64D2FF",
  "Transition Edit": "#30D158",
  "Concert / Live Event": "#FFD60A",
  "Skit / Comedy": "#FF6482",
  "Tutorial / GRWM": "#FF9F0A",
  "Audio Edit": "#8E8E93",

  // v2 additions
  "Lip Sync / Dance": "#FF453A",
  "Carousel / Slideshow": "#AC8E68",
  "Compilation / Montage": "#7EC8E3",
  "Meme / Remix Edit": "#C9B1FF",
  "Fan Edit": "#FFB4A2",
  "Product Review": "#B5E48C",
  "Fitness / Workout": "#30D158",
  "Art / Creative": "#BF5AF2",
  "Cooking / Food": "#FF9F0A",
  "Travel / Adventure": "#64D2FF",
  "Vlog / Lifestyle": "#0A84FF",
  "Beauty / Skincare": "#FF6482",
  "Pet / Animal": "#FFD60A",
  "Satisfying / ASMR": "#8E8E93",
  "Gaming Clip": "#FF453A",
  "Educational / Informative": "#0A84FF",
  "Other": "#636366",
};
```

---

## Summary for the Label User

The story this data tells to a label executive:

> "Your sound is being used by **Young Adult Females (43%)** in **Casual/Social (35%)** and **Music (30%)** content. The adoption is **79% organic** — people are genuinely picking it up, not just your paid creators. The dominant vibe is **Funny/Playful (43%)** with **Confident/Flex (21%)** close behind. The song is used as the **primary audio (78%)**, meaning creators are building their content AROUND it, not just using it as wallpaper. Focus on **Lip Sync / Dance** format where **Casual/Social niche** creators are driving the most engagement."

That's the narrative the UI should tell.

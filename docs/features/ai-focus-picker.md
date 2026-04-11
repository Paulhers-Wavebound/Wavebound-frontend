# AI Focus Picker — Full Input & Prompt Documentation

> Edge function: `generate-artist-focus.ts`
> Model: `claude-opus-4-6` (Opus 4.6 with extended thinking, 10K budget)
> Architecture: **Agentic** — multi-turn with tools (web_search + query_database)
> Stored in: `artist_intelligence.weekly_pulse` + `weekly_pulse_generated_at`

## How It Works

**Phase 1 (Pre-fetch):** Gathers 8 data sources in parallel for a baseline context dump.

**Phase 2 (Agentic loop):** Opus 4.6 analyzes the baseline, then uses tools to fill gaps:
- **web_search** (Anthropic server tool) — verifies chart positions, checks for new releases, confirms public facts
- **query_database** (client tool) — runs Supabase queries for detailed sound catalogs, video history, performance metrics

Max 3 tool rounds. Each round: Opus thinks → calls tools → gets results → thinks again.

**Phase 3 (Store):** Result saved to `artist_intelligence.weekly_pulse` immediately (survives batch timeout).

The AI returns a JSON object with a `focused_sound` (the one sound to prioritize) and optionally a `catalogue_alert` (a catalog track showing unexpected movement).

## Tools Available

### web_search (Anthropic native, server-side)
- Executed by Anthropic's servers, results appear inline
- Used for: chart positions, release verification, public news
- Max 5 uses per artist
- Beta header: `anthropic-beta: web-search-2025-03-05`

### query_database (client-side, Supabase)
- Allowlisted tables: `catalog_tiktok_performance`, `artist_videos_tiktok`, `roster_dashboard_metrics`, `artist_content_dna`, `artist_intelligence`
- Read-only, max 50 rows per query
- Filters by artist handle or name

---

## System Prompt (Full)

```
You are the AI intelligence layer at a major record label (Columbia Records). You make the same
judgment calls a senior Head of Content & Social Media would make after 2 hours of morning
triage — but you do it in seconds.

Your job: look at ALL the data for this artist and pick the ONE sound the label should focus
their energy on RIGHT NOW. This is not about which sound has the most total plays. This is
about which sound represents the highest-value decision opportunity TODAY.

DECISION FRAMEWORK (weighted by urgency):

1. NEW RELEASE IN PUSH WINDOW (highest weight)
   If the artist has a recent release (< 30 days), this is almost always the focus.
   The label is spending money, the algorithm window is open, content needs to be optimized.
   Exception: if it's flopping badly AND a catalog track is organically surging.
   IMPORTANT: Check BOTH the "LATEST RELEASE" field AND the "RECENT TIKTOK POSTS" captions.
   Artists often tease new songs in TikTok captions BEFORE the official release date updates.
   Look for phrases like "new song", "out now", "dropping", "new single", song titles in captions.
   If captions reference a new song that's not in LATEST RELEASE, that IS the focus — the
   release data is stale.

2. ORGANIC UGC SURGE ON ANY SOUND (high weight)
   A high fan_to_artist_ratio (>= 3x) signals strong organic fan adoption.
   This is rare and precious. Organic momentum has a short window.
   Key signal: videos_last_7d growing + high unique_creators + fan_to_artist_ratio >= 2x.

3. CATALOG NOSTALGIA LOOP (medium-high weight)
   Old tracks trending because they fit current cultural context.
   Signal: catalog track with increasing videos_last_7d or high unique_creators relative to
   other sounds.

4. ACCELERATING SOUND with CONVERSION (medium weight)
   Sound that's gaining videos AND the artist has a decent save rate.
   This means the content is reaching people AND converting to streams.
   Signal: velocity "up" + save rate > 1.5%.

5. SOUND WITH HIGH VIEWS BUT LOW SAVES = "VIRAL MIRAGE" (flag it)
   If the focused sound has massive views but save rate < 0.8%, flag it.
   The content reaches people but doesn't convert. The hook needs to change.

CATALOG ALERT (separate from focused sound):
Only flag a catalog track if it shows genuinely unexpected growth — NOT the same track as the
focused sound. Look for:
- A legacy track (not the current single) with a spike in videos_last_7d
- High fan_to_artist_ratio suggesting organic fan adoption
If no catalog track is showing surprising movement, return catalogue_alert as null.

ANTI-HALLUCINATION RULES (CRITICAL — violating these gets you fired):
This brief goes directly to senior label executives who live in this data every day. They will
immediately spot bullshit. One wrong claim and this tool loses all credibility.

1. NEVER claim something you cannot see in the data. You have NO visibility into:
   - Whether the label is or isn't running a push/campaign on a track
   - Whether a sound is "organic" vs "paid" — you can see fan_to_artist_ratio but that doesn't
     tell you about ad spend
   - What the artist's management is planning
   - Industry chart positions (unless explicitly provided in the data)
   - What competitors are doing
   Phrases like "despite no label push", "without promotion", "organically trending" are BANNED
   unless fan_to_artist_ratio data explicitly supports "organic" (>= 3x) — and even then, say
   "high fan-to-artist ratio (Nx)" not "no label push."

2. NEVER prescribe a specific creative action unless the data supports it. Examples of what NOT
   to do:
   - "Release a sped-up version" — you don't know if that makes sense for this genre or artist
   - "Seed with nano-creators" — you have no data on creator strategy
   - "Double ad spend" — you have no visibility into budgets
   Instead, describe WHAT the data shows and let the human decide the action.

3. EVERY claim must cite a specific number from the data. Not "massive surge" but "+2,400 new
   videos in 7 days." Not "gaining traction" but "videos_last_7d up from 150 to 890."

4. When data is thin or ambiguous, SAY SO. "Limited sound data available — recommend manual
   review" is 100x better than a confident-sounding guess.

5. The "action" field should frame the DECISION the exec needs to make, not prescribe the
   solution.

IMPORTANT RULES:
- Be specific. Name the actual song title.
- "Reason" should be ONE sentence explaining what signal you detected, citing specific numbers.
- "Action" should be ONE sentence framing the decision the content team needs to evaluate.
- If the artist has NO sounds in any data source, pick their most recent release or say "No
  sound data available."
- Every decision should map to what a Columbia Records VP of Viral Marketing would present at a
  10am standup — and survive a "where did you get that number?" challenge.
```

---

## Data Sources (8 parallel queries)

### 1. Sound Velocity RPC — `get_artist_sound_velocity`
**Table:** RPC function over `catalog_tiktok_performance` + aggregations
**What it provides:** The current #1 performing sound and overall velocity

| Field | Example (Malcolm Todd) |
|---|---|
| `top_sound_title` | "Earrings" |
| `top_sound_new_ugc` | 20,037 |
| `top_sound_total_ugc` | 100,537 |
| `velocity` | "new" |
| `this_week_total_new_ugc` | 25,015 |
| `sounds_tracked` | 13 |

**Context string format:**
```
CURRENT TOP SOUND: "Earrings" — 20037 new UGC this week, 100537 total, velocity: new, 13 sounds tracked
```

### 2. Catalog TikTok Performance — `catalog_tiktok_performance`
**What it provides:** Full catalog of the artist's TikTok sounds with UGC breakdown

| Field | Example |
|---|---|
| `song_name` | "Earrings" by Malcolm Todd |
| `tiktok_video_count` | 6 |
| `total_tiktok_plays` | 19,047,582 |
| `fan_to_artist_ratio` | 6.0 |
| `tiktok_status` | "established" |
| `videos_last_7d` | 2 |
| `videos_last_30d` | 2 |
| `unique_creators` | 6 |
| `fan_videos` | 6 |

**Context string format:**
```
CATALOG TIKTOK SOUNDS:
"Earrings" by Malcolm Todd, 6 total videos, 2 new this week, 2 in 30d, 6 creators, fan ratio: 6.0x (organic!), status: established, 19.0M plays
```

**Note:** `fan_to_artist_ratio >= 2` triggers the "(organic!)" label. Limit 15 sounds per artist, sorted by total video count.

### 3. Artist Intelligence — `artist_intelligence`
**What it provides:** Latest release info, brand document, content plan status

| Field | Example |
|---|---|
| `latest_release` | `{"name": "Breathe", "date": "2026-03-13", "type": "single", "url": "..."}` |
| `artist_name` | "Malcolm Todd" |
| `brand_document` | *(full research doc — NOT sent to AI, only used for artist name)* |
| `content_plan_html` | *(not currently used in context)* |

**Context string format:**
```
LATEST RELEASE: "Breathe" (single) — released 2026-03-13 (29 days ago). WITHIN 30-DAY PUSH WINDOW.
```

The function calculates release age and explicitly marks whether it's within the 30-day push window. This prevents the AI from treating old releases as "new."

### 4. SI Sound Performance RPC — `get_si_sound_performance`
**What it provides:** Deeply tracked sounds from Sound Intelligence with video counts, views, creator counts

| Field | Example |
|---|---|
| `track_name` | "Earrings" |
| `total_views` | 414,094,377 |
| `videos_count` | 833 |
| `unique_creators` | 658 |
| `si_status` | "accelerating" |
| `weekly_new_videos` | 704 |

**Context string format:**
```
SOUND INTELLIGENCE TRACKED:
"Earrings", 833 videos, 414,094,377 views, 704 new/week, analysis status: accelerating
"Breathe", 916 videos, 30,968,375 views, 408 new/week, analysis status: accelerating
"earrings x see you again", 848 videos, 65,129,897 views, 487 new/week, analysis status: accelerating
```

### 5. Roster Dashboard Metrics — `roster_dashboard_metrics`
**What it provides:** Overall artist health: momentum tier, risk level, posting activity, engagement

| Field | Example |
|---|---|
| `momentum_tier` | "stable" |
| `risk_level` | "ok" |
| `days_since_last_post` | 6 |
| `avg_views_30d` | 2,344,624 |
| `avg_saves_30d` | 12,230 |
| `delta_avg_views_pct` | null |
| `avg_engagement_30d` | 33.6 |
| `posting_freq_30d` | 0.43 |

**Context string format:**
```
STATE: momentum: stable, risk: ok, last post: 6 days ago, avg views: 2,344,624, save rate: 0.5%, velocity: null
```

Save rate is calculated inline: `(avg_saves_30d / avg_views_30d) * 100`. Only included when both values exist and saves > 0.

### 6. Artist Content DNA — `artist_content_dna`
**What it provides:** What content formats work best/worst for this artist

| Field | Example |
|---|---|
| `best_format` | "Studio Lip-Sync" |
| `best_format_vs_median` | 5.86 |
| `worst_format` | "Fan Activation" |
| `avg_hook_score` | 7.8 |
| `avg_viral_score` | 14.7 |
| `primary_genre` | "Pop" |

**Context string format:**
```
CONTENT DNA: best format: Studio Lip-Sync (5.9x median), worst format: Fan Activation, hook score: 8/100, viral score: 15/100, genre: Pop
```

### 7. Comment Sentiment — `wb_comment_sentiment`
**What it provides:** Fan sentiment and energy level from comment analysis

| Field | Example |
|---|---|
| `sentiment_score` | 4.2 (out of 5) |
| `fan_energy` | "high" |

**Context string format:**
```
FAN SENTIMENT: sentiment: 4.2/5, fan energy: high
```

**Note:** Currently broken for non-UUID entity_ids (the query uses artist_handle as entity_id but the table expects UUIDs for some artists). Returns empty for those.

### 8. Recent TikTok Posts — `artist_videos_tiktok`
**What it provides:** The 10 most recent TikTok posts with captions, sound info, and engagement. This is the AI's "eyes" into what the artist is actually posting and saying.

| Field | Example |
|---|---|
| `date_posted` | "2026-03-31" |
| `sound_title` | "original sound - malcolmtodddd" |
| `music_id` | null |
| `is_original_sound` | true |
| `video_views` | 3,538,940 |
| `video_saves` | 41,566 |
| `caption` | "Just keeping it really real with you #malcolmtodd" |

**Context string format:**
```
RECENT TIKTOK POSTS (newest first — read captions carefully for new release teasers, announcements, and song titles):
2026-03-31, sound: "original sound - malcolmtodddd", (original sound), 3,538,940 views, 41566 saves, caption: "Just keeping it really real with you #malcolmtodd"
2026-03-26, sound: "original sound - malcolmsroommate", 848,892 views, 10313 saves, caption: "Love #malcolmtodd"
2026-03-23, sound: "Breathe", 1,613,968 views, 24316 saves, caption: "Also I love Tik Tok #malcolmtodd do that again"
...
```

**Why this matters:** This is how the AI detects new releases before `latest_release` updates. Sound titles and captions reveal teasers, announcements, and songs the structured data hasn't caught yet.

---

## Full Context Example (Malcolm Todd)

What the AI actually receives as the user message:

```
Here is the full context for Malcolm Todd. Pick the focused sound and check for catalog alerts.

TODAY: 2026-04-11

ARTIST: Malcolm Todd (@malcolmtodddd)

STATE: momentum: stable, risk: ok, last post: 6 days ago, avg views: 2,344,624, save rate: 0.5%

CONTENT DNA: best format: Studio Lip-Sync (5.9x median), worst format: Fan Activation,
hook score: 8/100, viral score: 15/100, genre: Pop

LATEST RELEASE: "Breathe" (single) — released 2026-03-13 (29 days ago). WITHIN 30-DAY PUSH WINDOW.

CURRENT TOP SOUND: "Earrings" — 20037 new UGC this week, 100537 total, velocity: new, 13 sounds tracked

CATALOG TIKTOK SOUNDS:
"Earrings" by Malcolm Todd, 6 total videos, 2 new this week, 2 in 30d, 6 creators,
fan ratio: 6.0x (organic!), status: established, 19.0M plays

SOUND INTELLIGENCE TRACKED:
"original sound - malcolmtodddd", 491 videos, 29,074,848 views, 109 new/week, status: accelerating
"earrings x see you again", 848 videos, 65,129,897 views, 487 new/week, status: accelerating
"Breathe", 916 videos, 30,968,375 views, 408 new/week, status: accelerating
"Breathe by Malcolm Todd", 886 videos, 44,276,772 views, 162 new/week, status: active
"Earrings", 833 videos, 414,094,377 views, 704 new/week, status: accelerating

RECENT TIKTOK POSTS (newest first):
2026-03-31, sound: "original sound - malcolmtodddd", (original sound), 3,538,940 views,
41566 saves, caption: "Just keeping it really real with you #malcolmtodd"
2026-03-26, 848,892 views, 10313 saves, caption: "Love #malcolmtodd"
2026-03-23, sound: "Breathe", 1,613,968 views, 24316 saves, caption: "Also I love Tik Tok..."
2026-03-21, sound: "Pyre (STEM synth)", 756,557 views, 10648 saves, caption: "Who want it"
2026-03-19, sound: "original sound - malcolmtodddd", 617,787 views, 8677 saves, caption: "I'm making you new music"
...

Respond in JSON ONLY, no markdown fences:
{"focused_sound":{"title":"...","reason":"...","action":"..."},"catalogue_alert":{"title":"...","delta":"...","reason":"...","action":"..."} or null}
```

---

## AI Output Example (Malcolm Todd)

```json
{
  "focused_sound": {
    "title": "Breathe",
    "reason": "Latest release within 30-day push window (29 days old) with recent artist post showing 1.6M views and 24K saves on March 23.",
    "action": "Continue content push for current single - track showing solid engagement in artist posts but needs evaluation against competing sound performance."
  },
  "catalogue_alert": {
    "delta": "+17,466 new UGC videos this week",
    "title": "Earrings",
    "reason": "Catalog track generating 17K new UGC videos weekly with 'new' velocity classification while current single is in push window.",
    "action": "Evaluate resource allocation between current single push and emerging catalog momentum - 97K total UGC suggests sustained fan adoption."
  }
}
```

---

## What the AI CANNOT See

These are blind spots — things the AI has zero data on:

| Blind Spot | Why It Matters |
|---|---|
| **Label push / ad spend** | Cannot say "despite no push" or "organic" — doesn't know what campaigns are running |
| **Chart positions** | No Billboard, TikTok Top 50, or Spotify chart data fed in |
| **Management plans** | No visibility into upcoming releases, tour dates, or strategic decisions |
| **Competitor activity** | Cannot reference what other artists or labels are doing |
| **Creator partnerships** | No data on paid creator deals or seeding strategies |
| **Budget information** | Cannot recommend spend levels |
| **Platform algorithm changes** | No visibility into TikTok/Spotify algorithm shifts |

---

## Where the Output Goes

1. **Stored:** `artist_intelligence.weekly_pulse` (JSON) + `weekly_pulse_generated_at` (timestamp)
2. **Read by frontend:** `useContentDashboardData.ts` fetches `weekly_pulse` and maps it into `ContentArtist`
3. **Displayed in:**
   - **Signal Report** (`SignalReportCard.tsx`) — `catalogue_alert` becomes a CATALOG_ACTIVATION decision point; `focused_sound` becomes a MOMENTUM_CAPTURE decision point
   - **Roster Table** (`ContentRosterTable.tsx`) — `focused_sound.title` shown in TopSoundCell with orange FOCUS badge
   - **Roster Cards** (`ContentRosterCards.tsx`) — same focused sound display in card view

---

## Trigger Methods

```bash
# Single artist
curl -X POST "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/generate-artist-focus" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"artist_handle": "malcolmtodddd", "label_id": "8cd63eb7-7837-4530-9291-482ea25ef365"}'

# Batch (all artists on label)
curl -X POST "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/generate-artist-focus" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"batch": true, "label_id": "8cd63eb7-7837-4530-9291-482ea25ef365"}'
```

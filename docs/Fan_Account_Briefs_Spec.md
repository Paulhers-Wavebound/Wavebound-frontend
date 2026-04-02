# Fan Account Briefs — Feature Specification & Build Plan

> **Status:** Pre-build. Ready for Sprint 1.
> **Owner:** Paul (technical), Jonas (business)
> **Last updated:** March 30, 2026
> **Purpose:** Single source of truth for Claude Chat, Claude Code, and any agent working on this feature.

---

## 1. WHAT WE'RE BUILDING

### One-sentence definition
A new page in the Wavebound label portal that displays daily AI-generated "fan account content briefs" — each one tells a label social media team exactly which existing clip to repurpose, with what hook, in what format, and why it will work right now.

### What a brief contains
- **Source clip**: Exact URL + timestamp range (e.g., "Zane Lowe interview, 34:12–34:27")
- **Hook text**: The on-screen text or opening line (e.g., "I still get nervous before every show")
- **Format recommendation**: 15s vertical clip + text overlay, carousel, duet prompt, reaction bait, etc.
- **Platform recommendation**: TikTok first, cross-post Reels, etc.
- **Why now**: Trend alignment (Sound Intelligence data), anniversary, cultural moment, content plan alignment
- **Sound pairing**: If applicable, which trending sound to overlay (from Sound Intelligence)
- **Confidence score**: 0–100, based on format performance data + trend alignment + emotional resonance

### What it is NOT
- NOT a video editor (labels have editors on staff)
- NOT a scheduler (integrates with their existing tools later)
- NOT a separate product (it's a new page in the existing label portal at wavebound.ai)
- NOT built from scratch (it synthesizes data from existing Wavebound tables)

---

## 2. WHY THIS MATTERS (MARKET EVIDENCE)

### The clipping economy (confirmed March 26, 2026)
- **Variety exposé** (March 26, 2026): "Clipping" is the dominant organic marketing strategy in music. Labels pay editors $1K–$5K/campaign to extract 15-second moments from interviews and flood them across fan accounts.
- **bbno$ case study**: ~60 fan accounts, 1-4 posts/day each, covering anime content, artist clips, and old podcast excerpts.
- **Named agencies**: Kursza, Chaotic Good, Floodify, Hundred Days, Flighthouse, Creed Media — all confirmed running paid clipping operations.
- **Quote**: Joseph Larkin (Kursza co-founder): "With fan pages, we do what we call 'shitposting'… all it takes is one clip to go mega-viral."
- **Goldman Sachs**: Projects superfan monetization market at $4.5 billion.

### Zero tools exist
Every source (Gemini × 4, Grok × 5, Claude web research) independently confirmed: no B2B tool automates the discovery → analysis → brief generation pipeline for music fan accounts. Opus Clip and Vizard handle generic podcast clipping but have no music context, no rights awareness, no trend integration, and no brief output format.

### Our unique advantage
Wavebound already has the intelligence layer that makes this possible:
- `artist_intelligence` → who the artist is, their story, what works for them
- `artist_videos_tiktok` → what content exists and how it performed
- `artist_rag_content` → deep research, interview quotes, cultural context (4634+ embedded chunks)
- Sound Intelligence → what formats and sounds are trending right now, and WHY
- Content Plans (WF10/WF13) → what the label planned to post this week

**No other tool has all five inputs.** The brief is a synthesis layer on top of existing data.

---

## 3. DATA FLOW ARCHITECTURE

### Inputs (all existing, no new scraping needed for MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXISTING WAVEBOUND DATA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  artist_intelligence (per artist)                                │
│  ├── brand_document (JSONB) → identity, archetype, what works   │
│  ├── content_analysis_raw (JSONB) → TikTok content DNA          │
│  ├── web_research_raw (text) → Gemini Deep Research output      │
│  └── label_id → scopes to label                                 │
│                                                                  │
│  artist_rag_content (per artist, embedded chunks)                │
│  ├── content (text) → chunk of research/analysis                │
│  ├── embedding (vector 768) → Gemini embedding-001              │
│  ├── category → 'brand_doc', 'deep_research', 'content_plan'   │
│  └── artist_hybrid_search() RPC → semantic + BM25 search        │
│                                                                  │
│  artist_videos_tiktok (per video per artist)                     │
│  ├── views, likes, comments, shares, saves                      │
│  ├── caption, hashtags, sound info                               │
│  ├── performance_multiplier, viral_score                         │
│  └── posted_at → temporal patterns                               │
│                                                                  │
│  sound_intelligence (NEW tables, in build)                       │
│  ├── sound_scans → per-sound analysis                           │
│  ├── sound_scan_videos → per-video UGC breakdown                │
│  └── Format taxonomy → WHY a sound trends (format-level data)   │
│                                                                  │
│  content_plans (per artist, weekly/monthly)                      │
│  ├── plan JSON → what to post each day                          │
│  └── Alignment check → brief shouldn't conflict with plan       │
│                                                                  │
│  rag_content (global niche videos, 4634+ rows)                   │
│  ├── Viral outlier videos from artist's niche                   │
│  ├── AI analysis (content style, hook, effort, mood)            │
│  └── hybrid_search() RPC → find similar winning content         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New components (what we build)

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEW — FAN ACCOUNT BRIEFS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. content_catalog table (NEW, NO vectors)                      │
│     Stores discovered YouTube interviews, podcast appearances,   │
│     and other long-form source material with transcripts.        │
│     Dedup via source_url UNIQUE constraint. Plain SQL queries.   │
│     Phase 1 = YouTube only. Phase 2+ = podcasts, fan cams.      │
│                                                                  │
│  2. content_segments table (NEW, WITH vectors — RAG table)       │
│     Key moments extracted via two-stage analysis:                │
│     Stage A: Claude reads full transcript → picks 10-15 moments  │
│     Stage B: Gemini analyzes ONLY those short video clips        │
│     Each row = one clipable moment with timestamps, scores,      │
│     visual description, and 768-dim embedding for hybrid search. │
│     This IS the new RAG collection ("interview moments").        │
│     Powers: brief generation, artist chat tool, cross-artist     │
│     similarity search.                                           │
│                                                                  │
│  3. fan_briefs table (NEW, NO vectors)                           │
│     The final output. One row per brief suggestion.              │
│     Generated by Claude Opus synthesis prompt.                   │
│     Status workflow: pending → approved → posted → tracked.      │
│     Dedup via simple SQL: video_id + timestamp overlap + 7 days. │
│     Includes clip_storage_url (extracted clip in Supabase        │
│     Storage) + youtube_timestamp_url (deep link to exact moment).│
│                                                                  │
│  4. Two-stage analysis pipeline (NEW)                            │
│     Claude Opus (cheap) reads full transcript → selects moments  │
│     Gemini 3.1 Pro (precise) analyzes only selected video clips  │
│     yt-dlp extracts only those 15-60s segments                   │
│     ffmpeg trims/formats if needed                               │
│     Upload clips to Supabase Storage                             │
│                                                                  │
│  5. Opus brief synthesis prompt (NEW)                            │
│     Pulls from all existing data + confirmed video segments.     │
│     Outputs structured JSON brief.                               │
│                                                                  │
│  6. Label portal page (NEW)                                      │
│     /label/fan-briefs route in existing React app.               │
│     Card-based list with embedded YouTube preview + clip download.│
│     Approve / Skip / Modify workflow.                            │
│                                                                  │
│  7. Pipeline runner (NEW)                                        │
│     Standalone TypeScript on Hetzner VPS (NOT n8n).              │
│     ScrapeCreators discovery → Claude transcript analysis        │
│     → Gemini video confirmation → yt-dlp clip extraction         │
│     → Claude brief synthesis → Supabase insert.                  │
│     Triggered by pg_cron or Edge Function webhook.               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE SCHEMA (NEW TABLES)

### content_catalog
Stores discovered long-form source material. **NO vectors** — queried by artist_handle, platform, date. Dedup via UNIQUE constraints.

```sql
CREATE TABLE content_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artist_intelligence(id) ON DELETE CASCADE,
  artist_handle TEXT NOT NULL,
  label_id UUID REFERENCES labels(id),
  source_platform TEXT NOT NULL CHECK (source_platform IN ('youtube', 'tiktok', 'instagram', 'podcast', 'other')),
  source_url TEXT UNIQUE NOT NULL,
  video_id TEXT,                    -- YouTube video ID, TikTok video ID, etc.
  title TEXT,
  description TEXT,
  channel_name TEXT,                -- Who published it (talk show, podcast, fan, etc.)
  upload_date TIMESTAMPTZ,
  duration_seconds INT,
  view_count BIGINT,
  transcript TEXT,                  -- Full transcript from ScrapeCreators
  transcript_timestamps JSONB,     -- Raw [{text, startMs, endMs}] array from ScrapeCreators
  transcript_source TEXT,           -- 'scrapecreators', 'gemini_fallback'
  metadata JSONB DEFAULT '{}',      -- Raw API payload, thumbnails, tags, keywords, chapters
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cc_artist ON content_catalog(artist_handle);
CREATE INDEX idx_cc_label ON content_catalog(label_id);
CREATE INDEX idx_cc_platform ON content_catalog(source_platform);
CREATE INDEX idx_cc_processed ON content_catalog(is_processed) WHERE is_processed = FALSE;
CREATE UNIQUE INDEX idx_cc_video ON content_catalog(source_platform, video_id) WHERE video_id IS NOT NULL;
```

### content_segments
The core RAG table for this feature. **WITH vectors + full-text search** for hybrid retrieval.
Each row is a key moment identified by two-stage analysis (Claude transcript → Gemini video confirmation).
This table powers: brief generation, artist chat tool queries ("find me a clip where Harry talks about X"),
and cross-artist similarity search ("find vulnerable moments like this one for Billie Eilish").

```sql
CREATE TABLE content_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID REFERENCES content_catalog(id) ON DELETE CASCADE,
  artist_handle TEXT NOT NULL,
  label_id UUID,
  start_seconds NUMERIC NOT NULL,
  end_seconds NUMERIC NOT NULL,
  duration_seconds NUMERIC GENERATED ALWAYS AS (end_seconds - start_seconds) STORED,
  speaker TEXT,                     -- 'artist', 'interviewer', 'unknown'
  transcript_excerpt TEXT NOT NULL, -- The actual words spoken in this segment
  moment_summary TEXT NOT NULL,     -- Claude/Gemini's 1-sentence summary
  moment_type TEXT,                 -- 'emotional', 'funny', 'revelation', 'controversial', 'nostalgic', 'behind_the_scenes'
  fan_potential_score INT DEFAULT 0 CHECK (fan_potential_score BETWEEN 0 AND 100),
  visual_description TEXT,          -- What's happening visually (from Gemini video analysis)
  visual_confirmed BOOLEAN DEFAULT FALSE, -- TRUE = Gemini analyzed the actual video clip
  
  -- Clip extraction
  clip_storage_path TEXT,           -- Supabase Storage path (after yt-dlp extraction)
  clip_storage_url TEXT,            -- Public URL for the extracted clip
  clip_extracted_at TIMESTAMPTZ,
  
  -- RAG infrastructure (same pattern as artist_rag_content)
  content TEXT NOT NULL,            -- Combined searchable text: summary + transcript excerpt + visual description
  fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  embedding VECTOR(768),            -- Gemini embedding-001
  
  metadata JSONB DEFAULT '{}',      -- Source video title, channel, view count (denormalized for search results)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hybrid search indexes (same pattern as artist_rag_content)
CREATE INDEX idx_cs_artist ON content_segments(artist_handle);
CREATE INDEX idx_cs_label ON content_segments(label_id);
CREATE INDEX idx_cs_catalog ON content_segments(catalog_id);
CREATE INDEX idx_cs_score ON content_segments(fan_potential_score DESC);
CREATE INDEX idx_cs_type ON content_segments(moment_type);
CREATE INDEX idx_cs_fts ON content_segments USING GIN (fts);
CREATE INDEX idx_cs_embedding ON content_segments USING HNSW (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Hybrid search RPC (same pattern as artist_hybrid_search)
CREATE OR REPLACE FUNCTION segment_hybrid_search(
  query_text TEXT,
  query_embedding VECTOR(768),
  p_artist_handle TEXT DEFAULT NULL,
  p_label_id UUID DEFAULT NULL,
  p_moment_type TEXT DEFAULT NULL,
  match_count INT DEFAULT 20,
  full_text_weight FLOAT DEFAULT 1.0,
  semantic_weight FLOAT DEFAULT 1.0,
  rrf_k INT DEFAULT 50
)
RETURNS SETOF content_segments
LANGUAGE sql STABLE
AS $$
WITH full_text AS (
  SELECT id,
    ROW_NUMBER() OVER(ORDER BY ts_rank_cd(fts, websearch_to_tsquery(query_text)) DESC) AS rank_ix
  FROM content_segments
  WHERE fts @@ websearch_to_tsquery(query_text)
    AND (p_artist_handle IS NULL OR artist_handle = p_artist_handle)
    AND (p_label_id IS NULL OR label_id = p_label_id)
    AND (p_moment_type IS NULL OR moment_type = p_moment_type)
  ORDER BY rank_ix
  LIMIT LEAST(match_count, 50) * 2
),
semantic AS (
  SELECT id,
    ROW_NUMBER() OVER(ORDER BY embedding <=> query_embedding) AS rank_ix
  FROM content_segments
  WHERE (p_artist_handle IS NULL OR artist_handle = p_artist_handle)
    AND (p_label_id IS NULL OR label_id = p_label_id)
    AND (p_moment_type IS NULL OR moment_type = p_moment_type)
  ORDER BY rank_ix
  LIMIT LEAST(match_count, 50) * 2
)
SELECT content_segments.*
FROM full_text
FULL OUTER JOIN semantic ON full_text.id = semantic.id
JOIN content_segments ON COALESCE(full_text.id, semantic.id) = content_segments.id
ORDER BY
  COALESCE(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  COALESCE(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight DESC
LIMIT LEAST(match_count, 50);
$$;
```

### fan_briefs
The final output — one row per daily brief suggestion. **NO vectors** — dedup via simple SQL (video_id + timestamp overlap + date range).

```sql
CREATE TABLE fan_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_handle TEXT NOT NULL,
  artist_id UUID REFERENCES artist_intelligence(id),
  label_id UUID REFERENCES labels(id),
  segment_id UUID REFERENCES content_segments(id),

  -- The brief content
  hook_text TEXT NOT NULL,              -- On-screen text / opening line
  caption TEXT,                          -- Full caption with hashtags
  format_recommendation TEXT NOT NULL,   -- '15s_vertical_clip', 'carousel', 'duet_prompt', 'reaction_bait', etc.
  platform_recommendation TEXT[],        -- ['tiktok', 'reels']
  sound_pairing TEXT,                    -- Suggested trending sound (from Sound Intelligence)
  why_now TEXT NOT NULL,                 -- Reasoning: trend alignment, anniversary, content plan fit
  confidence_score INT DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),

  -- Source reference
  source_url TEXT,                       -- Direct link to source video
  source_title TEXT,                     -- Title of the source video
  timestamp_start NUMERIC,              -- Start of clip in seconds
  timestamp_end NUMERIC,                -- End of clip in seconds
  youtube_timestamp_url TEXT,            -- Deep link: youtube.com/watch?v=X&t=2052
  
  -- Extracted clip
  clip_storage_path TEXT,               -- Supabase Storage path
  clip_storage_url TEXT,                -- Public download URL for the extracted clip
  clip_duration_seconds NUMERIC,        -- Duration of extracted clip

  -- Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'skipped', 'modified', 'posted', 'archived')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  modified_hook TEXT,                    -- If user modifies the hook
  posted_url TEXT,                       -- URL where it was actually posted (future)

  -- Metadata
  generation_context JSONB DEFAULT '{}', -- What data sources were used to generate this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_label FOREIGN KEY (label_id) REFERENCES labels(id)
);

CREATE INDEX idx_fb_artist ON fan_briefs(artist_handle);
CREATE INDEX idx_fb_label ON fan_briefs(label_id);
CREATE INDEX idx_fb_status ON fan_briefs(status);
CREATE INDEX idx_fb_created ON fan_briefs(created_at DESC);
CREATE INDEX idx_fb_score ON fan_briefs(confidence_score DESC);
-- Dedup index: prevent same clip in same week
CREATE INDEX idx_fb_dedup ON fan_briefs(artist_handle, source_url, timestamp_start, created_at);

-- RLS
ALTER TABLE fan_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Label members can view their briefs"
  ON fan_briefs FOR SELECT
  USING (label_id IN (
    SELECT label_id FROM user_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "Label members update status"
  ON fan_briefs FOR UPDATE
  USING (label_id IN (
    SELECT label_id FROM user_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "Service role full access"
  ON fan_briefs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

Dedup logic (in pipeline code, NOT vectors):
```sql
-- Check before inserting a new brief
SELECT EXISTS (
  SELECT 1 FROM fan_briefs
  WHERE artist_handle = $1
    AND source_url = $2
    AND ABS(timestamp_start - $3) < 30  -- within 30 seconds of same moment
    AND created_at > NOW() - INTERVAL '7 days'
) AS is_duplicate;
```

---

## 5. OPUS SYNTHESIS PROMPT (BRIEF GENERATION)

### Input assembly (per artist, per run)
The prompt receives a combined context built from existing tables:

```
1. Artist identity (from artist_intelligence.brand_document)
   → archetype, genre, what works, what doesn't, voice/tone

2. Top content segments (from content_segments, sorted by fan_potential_score)
   → 10-20 highest-scoring unprocessed segments with transcripts + timestamps

3. Current content plan (from deep_research_jobs.content_plan or content_plans)
   → what the label plans to post this week — briefs must complement, not conflict

4. Sound Intelligence (from sound_scans + sound_scan_videos)
   → trending formats, which audio is working, format-level engagement data

5. Past briefs (from fan_briefs, last 7 days)
   → SQL dedup: list recent brief source_urls + timestamps to avoid repeating same clips

6. Niche viral patterns (from rag_content via hybrid_search)
   → what's working for similar artists right now

7. Calendar context
   → current date, upcoming release dates, anniversaries of past releases
```

### Prompt structure (Claude Opus 4.6)
```xml
<system>
You are the content intelligence engine for Wavebound, a B2B platform serving major record labels.
You generate daily "fan account content briefs" — specific, actionable instructions for label social media teams.

Each brief must feel like it was written by an elite fan account operator who deeply understands the artist,
the platform algorithms, and what fans actually engage with in 2026.

Rules:
- Every brief must reference a SPECIFIC source clip with exact timestamps
- Hooks must be 15 words or fewer, punchy, native to TikTok/IG voice
- Never suggest content that conflicts with the current content plan
- Prioritize segments where the artist shows vulnerability, humor, or behind-the-scenes authenticity
- Use Sound Intelligence data to pair clips with trending formats/sounds when relevant
- Score confidence 0-100 based on: format performance data + trend alignment + emotional resonance + content plan fit
- Output EXACTLY 5 briefs as a JSON array
</system>

<artist_identity>
{brand_document_summary}
</artist_identity>

<available_segments>
{top_20_content_segments_with_transcripts_and_scores}
</available_segments>

<current_content_plan>
{this_weeks_plan}
</current_content_plan>

<sound_intelligence>
{trending_formats_and_sounds}
</sound_intelligence>

<recent_briefs_to_avoid>
{last_7_days_brief_hooks_and_embeddings}
</recent_briefs_to_avoid>

<niche_patterns>
{top_performing_formats_from_rag_search}
</niche_patterns>

<calendar>
Today: {date}
Upcoming releases: {release_dates}
Anniversaries: {notable_dates}
</calendar>

Generate 5 fan account content briefs as JSON:
[{
  "hook_text": "string (≤15 words)",
  "caption": "string (with hashtags)",
  "format_recommendation": "string",
  "platform_recommendation": ["tiktok", "reels"],
  "sound_pairing": "string or null",
  "why_now": "string (1-2 sentences)",
  "confidence_score": number,
  "source_segment_id": "uuid",
  "source_url": "string",
  "source_title": "string",
  "timestamp_start": number,
  "timestamp_end": number
}]
```

---

## 6. PIPELINE ARCHITECTURE (NO N8N)

### Tech stack for the pipeline
- **Language**: TypeScript (strict)
- **Runtime**: Deno on Hetzner VPS (same machine as n8n, separate process)
- **Database**: Supabase Postgres via `@supabase/supabase-js` (service_role key)
- **YouTube Discovery + Transcripts**: ScrapeCreators YouTube API (already in stack, no quota limits)
- **AI Analysis**: Gemini 3.1 Pro (video moment extraction from transcripts)
- **AI Synthesis**: Claude Opus 4.6 (brief generation)
- **Scheduling**: Supabase pg_cron triggers an Edge Function webhook → calls the VPS service
- **Monitoring**: Sentry + console logs

### Why ScrapeCreators, not YouTube Data API v3 + yt-dlp
ScrapeCreators already handles our TikTok/Instagram scraping. Their YouTube API covers every endpoint we need:
- `GET /v1/youtube/search?query={artist}+interview` → discover interviews (no 100-unit quota per search)
- `GET /v1/youtube/channel-videos?handle={handle}` → get all videos from artist's channel
- `GET /v1/youtube/video/transcript?url={url}` → full timestamped transcript (replaces yt-dlp entirely)
- `GET /v1/youtube/video?url={url}` → complete video metadata + description + chapters
- `GET /v1/youtube/search/hashtag?hashtag={artist}` → find fan content
- `GET /v1/youtube/video/comments?url={url}` → fan sentiment on specific videos
- `GET /v1/youtube/channel?handle={handle}` → channel metadata

Benefits over YouTube Data API + yt-dlp:
- Zero quota limits (ScrapeCreators is credit-based, we have millions of credits)
- No yt-dlp binary dependency (problematic in Deno/serverless)
- No OAuth required
- Transcript endpoint returns timestamped segments natively (startMs, endMs, text)
- One API key for YouTube + TikTok + Instagram (already configured)
- `continuationToken` pagination for large catalogs

### Pipeline stages (runs daily per artist)
```
Stage 1: DISCOVER
  ScrapeCreators /v1/youtube/search → query="{artist_name} interview" 
  → filter: lengthSeconds > 600 (10+ min), not already in content_catalog
  → also: /v1/youtube/channel-videos for artist's official YT channel
  → insert new rows into content_catalog

Stage 2: TRANSCRIBE
  For each new content_catalog row:
  → ScrapeCreators /v1/youtube/video/transcript → timestamped transcript
  → Store both transcript_only_text AND transcript_timestamps (raw JSON array)
  → If transcript is null: flag for Gemini video analysis fallback
  → Update content_catalog.transcript + transcript_source = 'scrapecreators'

Stage 3A: TRANSCRIPT ANALYSIS (cheap, wide net)
  For each transcribed item:
  → Claude Opus reads full transcript with timestamps
  → Identifies 10-15 candidate moments (quotable, emotional, funny, vulnerable, BTS)
  → Outputs: [{start_seconds, end_seconds, transcript_excerpt, moment_type, initial_score, reasoning}]
  → Cost: ~$0.10 per interview (transcript is ~10K tokens)

Stage 3B: VIDEO CONFIRMATION (precise, narrow)
  For each candidate moment from Stage 3A:
  → yt-dlp downloads ONLY that 15-60s clip: yt-dlp --download-sections "*MM:SS-MM:SS" -o clip.mp4 {url}
  → Gemini 3.1 Pro analyzes the short video clip for visual signals:
    facial expressions, body language, setting, chemistry, meme potential
  → Updates: visual_description, fan_potential_score (adjusted up/down based on visual data)
  → Cost: ~$0.30-0.50 per interview (only analyzing 5-10 min of selected clips, not full video)

Stage 4: EMBED + STORE SEGMENTS
  For each confirmed segment:
  → Build content string: summary + transcript + visual description
  → Gemini embedding-001 → 768-dim vector
  → Insert into content_segments with all fields + embedding + fts
  → This makes the segment searchable via segment_hybrid_search()

Stage 5: EXTRACT + UPLOAD CLIPS
  For each high-scoring segment (fan_potential_score > 60):
  → yt-dlp already downloaded the clip in Stage 3B (reuse it)
  → ffmpeg trim/format if needed (already on VPS)
  → Upload to Supabase Storage: fan-briefs/{artist_handle}/{segment_id}.mp4
  → Update content_segments.clip_storage_url

Stage 6: SYNTHESIZE BRIEFS
  → Assemble prompt context from all existing Wavebound data
  → Claude Opus 4.6: Generate 5 briefs from top-scoring segments
  → SQL dedup check: same source_url + overlapping timestamps + last 7 days
  → Insert into fan_briefs with clip_storage_url + youtube_timestamp_url
  → youtube_timestamp_url = source_url + "&t=" + floor(timestamp_start)

Stage 7: NOTIFY (future)
  → Supabase Realtime pushes new briefs to portal
  → Optional: Slack/email notification to label team
```

### ScrapeCreators YouTube API Reference (for pipeline development)
```
DISCOVERY:
  GET /v1/youtube/search
    ?query={artist} interview    (Required)
    &uploadDate=this_year        (Optional: today, this_week, this_month, this_year)
    &sortBy=relevance            (Optional: relevance, popular)
    &continuationToken={token}   (Pagination)
    → Returns: videos[].{id, url, title, channel, viewCountInt, publishedTime, lengthSeconds}

  GET /v1/youtube/channel-videos
    ?handle={handle}             (or channelId)
    &sort=latest                 (Options: latest, popular)
    &continuationToken={token}
    &includeExtras=true          (Gets like + comment count + description)
    → Returns: videos[].{id, url, title, viewCountInt, publishedTime, lengthSeconds, description}

  GET /v1/youtube/search/hashtag
    ?hashtag={artist_name}
    &type=all                    (Options: all, shorts)
    &continuationToken={token}
    → Returns: videos[] (fan content, covers, edits)

DETAILS:
  GET /v1/youtube/video
    ?url={youtube_url}           (Required)
    → Returns: {id, title, description, likeCountInt, commentCountInt, viewCountInt, publishDate, 
                channel, chapters[], keywords[], genre, durationMs, captionTracks[]}

TRANSCRIPTS:
  GET /v1/youtube/video/transcript
    ?url={youtube_url}           (Required)
    &language=en                 (Optional: 2-letter code)
    → Returns: {transcript: [{text, startMs, endMs, startTimeText}], transcript_only_text, language}
    NOTE: startMs/endMs are strings, cast to number. transcript_only_text is the full text concatenated.

COMMENTS (for fan sentiment analysis, Phase 2):
  GET /v1/youtube/video/comments
    ?url={youtube_url}
    &order=top                   (Options: top, newest)
    &continuationToken={token}
    → Returns: comments[].{content, author, engagement.{likes, replies}, publishedTime}

CHANNEL INFO:
  GET /v1/youtube/channel
    ?handle={handle}             (or channelId or url)
    → Returns: {channelId, name, subscriberCount, videoCountText, description, links[]}
```

### Rate limits & cost controls
- ScrapeCreators: Credit-based (millions available). Rate limit to 1 req/second to be safe.
- Gemini 3.1 Pro: ~$1-2 per artist per day (transcript-based analysis is MUCH cheaper than video analysis)
- Claude Opus: ~$0.50-0.75 per artist per day (5 briefs).
- Total: ~$2-4 per artist per day (cheaper than original estimate because we analyze transcripts, not video files)

---

## 7. FRONTEND (LABEL PORTAL PAGE)

### Route: `/label/fan-briefs`

### Components needed
1. **FanBriefsPage** — Main page wrapped in LabelLayout
2. **BriefCard** — Individual brief display (the core component)
3. **BriefFilter** — Status filter pills (All / Pending / Approved / Skipped)
4. **BriefDetail** — Expanded modal with full context + modify hook

### BriefCard contents
- Artist avatar + name
- Confidence score badge (emerald, top-right)
- Hook text (bold, editable on click)
- Format tag (blue) + Platform tag (violet) + Reason tag (amber)
- Source info (video title, timestamp, "Why now")
- Action buttons: Approve & Send to Plan / Modify Hook / Skip

### Data fetching
```typescript
// Fetch briefs for current label
const { data: briefs } = await supabase
  .from('fan_briefs')
  .select('*, content_segments(*), content_catalog(*)')
  .eq('label_id', userProfile.label_id)
  .order('confidence_score', { ascending: false })
  .limit(20);
```

### Interactions
- **Approve**: Updates status to 'approved', sets approved_by + approved_at
- **Skip**: Updates status to 'skipped'
- **Modify Hook**: Opens inline editor, saves modified_hook, updates status to 'modified'
- All actions use Supabase RPC or direct update with RLS

---

## 8. SPRINT PLAN (8 SPRINTS)

Each sprint = one Claude Code session (30-90 min). Ship one change. Verify. Commit. Move on.

### Sprint 1: Schema (40 min)
- **Input**: Existing Supabase schema
- **Do**: Create content_catalog (no vectors) + content_segments (full RAG table with fts + vectors + hybrid search RPC) + fan_briefs (no vectors, clip URLs, SQL dedup index) + RLS on all three + Supabase Storage bucket `fan-briefs`
- **Verify**: SQL queries return empty tables. RLS blocks anon. segment_hybrid_search() function exists.
- **Commit**: `SPRINT-1: Fan briefs schema — 3 tables + hybrid search RPC + storage bucket`

### Sprint 2: YouTube Discovery + Transcripts (60 min)
- **Input**: Sprint 1 complete
- **Do**: TypeScript script (Deno on VPS) that uses ScrapeCreators YouTube API: search interviews → get video details → fetch timestamped transcripts. Store in content_catalog. Rate limit 1 req/sec.
- **Verify**: Run for Harry Styles → 5+ interviews with full transcripts in DB
- **Commit**: `SPRINT-2: YouTube discovery + transcript pipeline via ScrapeCreators`

### Sprint 3: Claude Transcript Analysis (50 min)
- **Input**: Sprint 2 complete (content_catalog has rows with transcripts)
- **Do**: TypeScript function that sends full timestamped transcript to Claude Opus. Prompt: "Identify 10-15 fan-account-worthy moments with start/end seconds, speaker, moment type, score, reasoning." Output as JSON. Insert candidate moments as preliminary rows.
- **Verify**: 10+ candidate moments identified for one Harry Styles interview
- **Commit**: `SPRINT-3: Claude transcript moment extraction`

### Sprint 4: Gemini Video Confirmation + Clip Extraction (90 min)
- **Input**: Sprint 3 complete (candidate moments exist)
- **Do**: For each candidate moment: yt-dlp downloads just that 15-60s clip → Gemini 3.1 Pro analyzes the short video clip (facial expressions, body language, visual setting, meme potential) → update fan_potential_score and visual_description → ffmpeg trim if needed → upload to Supabase Storage → embed content via Gemini embedding-001 → insert final content_segments row with all fields
- **Verify**: 5+ segments with visual_confirmed=true, clip_storage_url populated, embedding present
- **Commit**: `SPRINT-4: Gemini video confirmation + clip extraction + embeddings`

### Sprint 5: Opus Brief Synthesis (60 min)
- **Input**: Sprint 4 complete + existing artist_intelligence/rag/sound data
- **Do**: TypeScript function that assembles full prompt context (brand doc, segments, content plan, sound intelligence, past briefs, niche patterns, calendar), calls Claude Opus, generates 5 briefs, runs SQL dedup check, inserts into fan_briefs with clip_storage_url + youtube_timestamp_url
- **Verify**: 5 briefs in DB with hooks, formats, reasoning, confidence scores, working clip URLs and YouTube deep links
- **Commit**: `SPRINT-5: Opus brief synthesis with full context assembly`

### Sprint 6: Portal Page (90 min)
- **Input**: Sprint 5 complete (fan_briefs has real data with clips)
- **Do**: New React page at /label/fan-briefs. BriefCard component showing: embedded YouTube preview (timestamped), downloadable clip button, hook (editable), tags, confidence score, source info. Approve/Skip/Modify actions. Status filters.
- **Verify**: Page loads, shows briefs with video preview + clip download, approve updates status
- **Commit**: `SPRINT-6: Fan briefs portal page with clip previews`

### Sprint 7: Sidebar + Full Pipeline (60 min)
- **Input**: Sprint 6 complete
- **Do**: Add to sidebar nav. Chain all stages into single orchestrator script. Run end-to-end for one artist.
- **Verify**: One command runs full pipeline: discover → transcribe → Claude analyze → Gemini confirm → extract clips → generate briefs → visible in portal
- **Commit**: `SPRINT-7: Full pipeline orchestrator + sidebar nav`

### Sprint 8: Daily Automation (45 min)
- **Input**: Sprint 7 complete
- **Do**: Set up daily trigger (pg_cron → Edge Function webhook → VPS pipeline). Error handling + Sentry logging for all stages. Retry logic for API failures.
- **Verify**: Pipeline runs autonomously overnight. New briefs appear in portal next morning.
- **Commit**: `SPRINT-8: Daily automation + error handling + monitoring`

### Decision point after Sprint 8:
Demo to label. Show live Harry Styles briefs with extracted clips + YouTube previews. Get feedback. Then prioritize Phase 2.

### Minimal demo slice (Sprints 1, 2, 3, 4, 5, 6):
Walk into Columbia with real briefs, real clips, real YouTube previews. Skip daily automation for the demo — trigger manually.

---

## 9. PHASE 2+ ROADMAP (AFTER LABEL FEEDBACK)

| Feature | Effort | Value | Priority |
|---------|--------|-------|----------|
| **V2 Auto-editing**: ffmpeg text overlay + captions → finished post ready for upload | Medium | Killer | P0 |
| **V2 Draft push**: Auto-upload finished clips to TikTok/IG drafts via API | Hard | Killer | P0 |
| Podcast discovery (Taddy API) | Medium | High | P1 |
| Performance feedback loop (track posted briefs → engagement) | Medium | Critical | P1 |
| Rights clearance flags (official vs fan-cam) | Easy | High | P1 |
| Artist chat tool integration (search_segments tool) | Easy | High | P1 |
| Multi-language hooks (Gemini multilingual) | Easy | Medium | P2 |
| Dropbox/DAM integration (label uploads private assets) | Medium | Lock-in | P2 |
| Live event clipping (real-time moments) | Hard | High | P3 |
| Whop/ClipWav distribution integration | Medium | Revenue | P3 |

---

## 10. COST MODEL

### Per artist per day (steady state)
| Component | Cost |
|-----------|------|
| ScrapeCreators YouTube (search + transcripts + details) | $0.15 |
| Claude Opus transcript analysis (5 interviews) | $0.50 |
| Gemini 3.1 Pro video confirmation (selected clips only, ~10 min total) | $0.80 |
| Claude Opus brief synthesis (5 briefs) | $0.75 |
| yt-dlp clip download + Supabase Storage | $0.05 |
| Supabase compute + embeddings | $0.15 |
| **Total** | **~$2.40** |

### Cold start (first-time artist onboarding)
- Harry Styles (5000+ videos): Process top 50 by views first → $25-40 one-time
- Emerging artist (200 videos): Process all → $15-25 one-time
- Prioritization: Official channel + >1M views first, then recent, then everything else
- ScrapeCreators pagination (continuationToken) handles large catalogs without quota issues

### Revenue math
- 10 artists per label × $10K/month subscription = $1,000/artist/month revenue
- $2.40/day × 30 = $72/artist/month cost
- **Gross margin: 93%**
- Labels currently pay agencies $5K-$50K/campaign for manual equivalent

---

## 11. KEY TECHNICAL DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pipeline runtime | Deno on Hetzner VPS | Type-safe, no n8n limitations, testable, deployable alongside existing infra. yt-dlp + ffmpeg already installed. |
| NOT n8n | Confirmed | Template literal bugs, no type safety, JSON workflows un-testable. Fan briefs is the first feature built "like a real engineer" |
| NOT Supabase Edge Functions for AI calls | Confirmed | 2-second CPU limit kills Gemini/Claude calls. Edge Functions only for lightweight triggers/webhooks |
| YouTube data source | ScrapeCreators YouTube API | Already in stack (TikTok/IG), no quota limits, transcript endpoint built-in, credit-based pricing, single API key |
| NOT YouTube Data API v3 | Confirmed | 10k units/day quota is restrictive for catalog-scale discovery. Search costs 100 units each. |
| Analysis approach | Two-stage: Claude transcript → Gemini video on selected clips | Claude is the cheap wide net (~$0.10/interview). Gemini is the expensive precision lens on 15-60s clips only. Gets both verbal AND visual signals without paying to analyze 40 min of setup questions. |
| Clip extraction | yt-dlp `--download-sections` + ffmpeg on VPS | Both already installed. Downloads only the selected clip segment, not the full video. ffmpeg for trim/format. Upload to Supabase Storage. |
| yt-dlp role | Clip DOWNLOAD only, NOT discovery or transcripts | ScrapeCreators handles discovery + transcripts. yt-dlp only enters the pipeline at Stage 3B to extract confirmed video clips. |
| Vectors | content_segments ONLY (proper RAG with hybrid search) | This is the searchable knowledge collection. Enables: brief generation, artist chat tool, cross-artist similarity. content_catalog and fan_briefs don't need vectors — SQL handles their queries. |
| fan_briefs dedup | Simple SQL (video_id + timestamp proximity + 7-day window) | 5 briefs/day doesn't justify embedding-based dedup. SQL is faster, simpler, deterministic. |
| Embeddings | Gemini embedding-001, 768 dims | Consistent with existing RAG infrastructure (artist_rag_content, rag_content) |
| Frontend | Extend existing React app | Not a new repo. New page in existing label portal. Same patterns, same components |
| Brief card shows | YouTube embed preview + downloadable extracted clip | Manager sees the moment in context (YouTube) AND has the raw clip ready to hand to an editor |
| Video storage | Extracted clips only (15-60s segments in Supabase Storage). Never full videos. | Keeps storage costs minimal. Full videos remain on YouTube. |

---

## 12. REFERENCES

### Existing tables this feature reads from
- `artist_intelligence` — brand_document, content_analysis_raw, label_id
- `artist_rag_content` — embedded chunks, artist_hybrid_search() RPC
- `artist_videos_tiktok` — per-video performance data
- `rag_content` — niche viral videos, hybrid_search() RPC
- `content_plans` / `deep_research_jobs.content_plan` — weekly plan
- `sound_scans` + `sound_scan_videos` — Sound Intelligence (in build)
- `labels` — label metadata, invite codes
- `user_profiles` — label_id for RLS scoping

### Existing patterns to reuse
- WF7 Opus synthesis prompt structure → adapt for brief generation
- WF2 Gemini video analysis prompt → adapt for moment extraction
- `artist_hybrid_search()` RPC → semantic search over artist data
- `hybrid_search()` RPC → semantic search over niche content
- LabelLayout + sidebar nav → wrap new page
- shadcn Card, Button, Badge → brief card components

### API keys needed
- ScrapeCreators API key (existing — same key used for TikTok/IG, now also for YouTube)
- Gemini API key (existing)
- Anthropic API key (existing)
- Supabase service_role key (existing)
- NO YouTube Data API key needed (ScrapeCreators replaces it)

### VPS tools needed (already installed)
- yt-dlp (for clip segment download only — NOT for discovery or transcripts)
- ffmpeg (for clip trimming/formatting, V2 text overlay + captions)

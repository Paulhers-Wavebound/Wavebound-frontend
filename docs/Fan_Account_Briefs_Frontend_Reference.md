# Fan Account Briefs — Implementation Reference

> **For:** Claude Code sessions building this feature in the Wavebound-frontend repo
> **Created:** March 30, 2026
> **Read this BEFORE writing any code for Fan Account Briefs.**

---

## WHAT THIS FEATURE IS

A new page in the label portal (`/label/fan-briefs`) that displays AI-generated daily content briefs for fan accounts. Each brief tells a label social media manager exactly which existing clip to repost, with what hook, in what format, and why.

**This is an extension of the existing label portal, not a new product.** It reads from existing Wavebound tables (artist_intelligence, artist_rag_content, artist_videos_tiktok, sound_intelligence, content_plans) and writes to 3 new tables (content_catalog, content_segments, fan_briefs).

---

## EXISTING INFRASTRUCTURE TO REUSE

### Tables you MUST understand (read Supabase_Tables.md for full schemas)
- `artist_intelligence` — one row per artist. brand_document (JSONB), content_analysis_raw, label_id, artist_handle. This is the god table.
- `artist_rag_content` — embedded chunks of artist research. 768-dim Gemini vectors. Has `artist_hybrid_search()` RPC for semantic + BM25 search.
- `artist_videos_tiktok` — individual video rows per roster artist. views, likes, shares, performance_multiplier, viral_score.
- `rag_content` — 4634+ niche viral video analyses with embeddings. Has `hybrid_search()` RPC.
- `deep_research_jobs` — contains content_plan (JSONB) per artist.
- `labels` — id, name, slug, invite_code. FK target for label_id columns.
- `user_profiles` — user_id, label_id, artist_handle. Used for RLS scoping.
- `sound_scans`, `sound_scan_videos` — Sound Intelligence data (may be in build, check current state).

### Frontend patterns to follow
- **Layout**: Use `LabelLayout` wrapper (same as Dashboard, Sound Intelligence pages)
- **Sidebar**: Add entry to `LabelSidebar.tsx` bottomNav or mainNav array
- **Routing**: Add `<Route>` in `App.tsx` (same pattern as `/label/settings`, `/label/sound-intelligence`)
- **Data fetching**: Use `(supabase.from as any)('table_name')` pattern (types not generated for new tables)
- **Auth context**: Use `useUserProfile()` from `UserProfileContext` for label_id and artist access
- **Components**: shadcn/ui Card, Button, Badge, Toast. Tailwind dark theme with CSS variables (--bg, --ink, --accent, --border, etc.)
- **State**: React useState + useEffect. No external state management. Follow Dashboard page patterns.

### Key CSS variables (from existing theme)
```
--bg: dark background
--bg-elevated: slightly lighter
--border: rgba(255,255,255,0.06)
--ink: primary text
--ink-secondary: secondary text
--ink-tertiary: tertiary text
--accent: emerald green (#34d399 or similar)
--accent-light: accent background tint
```

### Fonts
- Body: "DM Sans"
- Mono: "JetBrains Mono"
- Use inline styles matching existing LabelSidebar/LabelDashboard patterns (the codebase uses inline styles, not Tailwind classes for most label portal components)

---

## NEW DATABASE TABLES

### content_catalog (NO vectors — plain SQL queries)
```sql
CREATE TABLE content_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artist_intelligence(id) ON DELETE CASCADE,
  artist_handle TEXT NOT NULL,
  label_id UUID REFERENCES labels(id),
  source_platform TEXT NOT NULL CHECK (source_platform IN ('youtube', 'tiktok', 'instagram', 'podcast', 'other')),
  source_url TEXT UNIQUE NOT NULL,
  video_id TEXT,
  title TEXT,
  description TEXT,
  channel_name TEXT,
  upload_date TIMESTAMPTZ,
  duration_seconds INT,
  view_count BIGINT,
  transcript TEXT,
  transcript_timestamps JSONB,  -- Raw [{text, startMs, endMs}] from ScrapeCreators
  transcript_source TEXT,       -- 'scrapecreators', 'gemini_fallback'
  metadata JSONB DEFAULT '{}',
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes: artist_handle, label_id, platform, is_processed, video_id unique
-- RLS: label members read, service_role full
```

### content_segments (WITH vectors + FTS — this is a RAG table)
```sql
CREATE TABLE content_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID REFERENCES content_catalog(id) ON DELETE CASCADE,
  artist_handle TEXT NOT NULL,
  label_id UUID,
  start_seconds NUMERIC NOT NULL,
  end_seconds NUMERIC NOT NULL,
  duration_seconds NUMERIC GENERATED ALWAYS AS (end_seconds - start_seconds) STORED,
  speaker TEXT,
  transcript_excerpt TEXT NOT NULL,
  moment_summary TEXT NOT NULL,
  moment_type TEXT,               -- 'emotional', 'funny', 'revelation', 'controversial', 'nostalgic', 'behind_the_scenes'
  fan_potential_score INT DEFAULT 0 CHECK (fan_potential_score BETWEEN 0 AND 100),
  visual_description TEXT,        -- From Gemini video analysis
  visual_confirmed BOOLEAN DEFAULT FALSE,
  clip_storage_path TEXT,         -- Supabase Storage path
  clip_storage_url TEXT,          -- Public URL for extracted clip
  clip_extracted_at TIMESTAMPTZ,
  content TEXT NOT NULL,          -- Combined: summary + transcript + visual (for hybrid search)
  fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  embedding VECTOR(768),          -- Gemini embedding-001
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes: artist_handle, label_id, catalog_id, score DESC, moment_type, GIN(fts), HNSW(embedding)
-- RPC: segment_hybrid_search() for semantic + BM25 search
-- RLS: label members read, service_role full
```

### fan_briefs (NO vectors — SQL dedup)
```sql
CREATE TABLE fan_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_handle TEXT NOT NULL,
  artist_id UUID REFERENCES artist_intelligence(id),
  label_id UUID REFERENCES labels(id),
  segment_id UUID REFERENCES content_segments(id),
  hook_text TEXT NOT NULL,
  caption TEXT,
  format_recommendation TEXT NOT NULL,
  platform_recommendation TEXT[],
  sound_pairing TEXT,
  why_now TEXT NOT NULL,
  confidence_score INT DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  source_url TEXT,
  source_title TEXT,
  timestamp_start NUMERIC,
  timestamp_end NUMERIC,
  youtube_timestamp_url TEXT,     -- Deep link: youtube.com/watch?v=X&t=2052
  clip_storage_path TEXT,         -- Supabase Storage path
  clip_storage_url TEXT,          -- Public download URL for extracted clip
  clip_duration_seconds NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'skipped', 'modified', 'posted', 'archived')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  modified_hook TEXT,
  posted_url TEXT,
  generation_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes: artist_handle, label_id, status, created_at DESC, score DESC, dedup composite
-- RLS: label members read + update status, service_role full
```

---

## FRONTEND IMPLEMENTATION

### File structure (new files only)
```
src/
  pages/
    label/
      LabelFanBriefs.tsx       ← Main page (new)
  components/
    fan-briefs/
      BriefCard.tsx            ← Individual brief card (new)
      BriefDetail.tsx          ← Expanded modal (new)
      BriefFilters.tsx         ← Status filter pills (new)
  types/
    fanBriefs.ts               ← TypeScript interfaces (new)
```

### TypeScript interfaces
```typescript
// src/types/fanBriefs.ts

export interface FanBrief {
  id: string;
  artist_handle: string;
  artist_id: string;
  label_id: string;
  segment_id: string | null;

  hook_text: string;
  caption: string | null;
  format_recommendation: string;
  platform_recommendation: string[];
  sound_pairing: string | null;
  why_now: string;
  confidence_score: number;

  source_url: string | null;
  source_title: string | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  youtube_timestamp_url: string | null;  // Deep link to exact moment
  
  clip_storage_url: string | null;       // Download URL for extracted clip
  clip_duration_seconds: number | null;

  status: 'pending' | 'approved' | 'skipped' | 'modified' | 'posted' | 'archived';
  approved_by: string | null;
  approved_at: string | null;
  modified_hook: string | null;

  created_at: string;
}

export interface ContentSegment {
  id: string;
  catalog_id: string;
  artist_handle: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  speaker: string | null;
  transcript_excerpt: string;
  moment_summary: string;
  moment_type: string | null;
  fan_potential_score: number;
  visual_description: string | null;
  visual_confirmed: boolean;
  clip_storage_url: string | null;
}

export interface ContentCatalogItem {
  id: string;
  artist_handle: string;
  source_platform: string;
  source_url: string;
  title: string | null;
  channel_name: string | null;
  upload_date: string | null;
  duration_seconds: number | null;
  view_count: number | null;
}

export type BriefStatus = FanBrief['status'];
```

### BriefCard component pattern
Follow the exact visual design from the HTML proposal (Fan_Account_Briefs_Proposal.html):
- Dark card with --bg-card background
- Top: artist avatar (initials fallback) + name + confidence score badge (emerald)
- **Video preview**: Embedded YouTube iframe using youtube_timestamp_url (shows exact moment in context)
- **Clip download**: Button linking to clip_storage_url (pre-extracted 15-60s segment ready for editors)
- Hook text: large, serif font (Instrument Serif or similar), italic, editable on click
- Tags row: format (blue), platform (violet), reason (amber) — use rgba colored pills
- Source block: gray background with video title, timestamp range, "why now" reasoning, sound pairing
- Bottom: Approve (emerald primary button), Modify Hook (secondary), Skip (secondary)

YouTube embed pattern:
```typescript
// Convert youtube_timestamp_url to embed URL
const getEmbedUrl = (brief: FanBrief) => {
  if (!brief.source_url || !brief.timestamp_start) return null;
  const videoId = brief.source_url.match(/v=([^&]+)/)?.[1];
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?start=${Math.floor(brief.timestamp_start)}&end=${Math.floor(brief.timestamp_end || brief.timestamp_start + 60)}`;
};
```

### Data fetching pattern
```typescript
// In LabelFanBriefs.tsx
const { userProfile } = useUserProfile();
const [briefs, setBriefs] = useState<FanBrief[]>([]);
const [filter, setFilter] = useState<BriefStatus | 'all'>('all');

useEffect(() => {
  if (!userProfile?.label_id) return;
  const fetchBriefs = async () => {
    let query = (supabase.from as any)('fan_briefs')
      .select('*')
      .eq('label_id', userProfile.label_id)
      .order('confidence_score', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    const { data, error } = await query.limit(30);
    if (data) setBriefs(data);
  };
  fetchBriefs();
}, [userProfile?.label_id, filter]);
```

### Action handlers
```typescript
const handleApprove = async (briefId: string) => {
  await (supabase.from as any)('fan_briefs')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', briefId);
  // Refresh or optimistic update
};

const handleSkip = async (briefId: string) => {
  await (supabase.from as any)('fan_briefs')
    .update({ status: 'skipped' })
    .eq('id', briefId);
};

const handleModifyHook = async (briefId: string, newHook: string) => {
  await (supabase.from as any)('fan_briefs')
    .update({ status: 'modified', modified_hook: newHook })
    .eq('id', briefId);
};
```

---

## SIDEBAR INTEGRATION

In `src/components/label/LabelSidebar.tsx`, add to the nav array:

```typescript
// In the main nav items array (where Dashboard, Sound Intelligence, etc. are)
{ id: 'fan-briefs', label: 'Fan Briefs', icon: Sparkles, path: '/label/fan-briefs' },
```

In `src/App.tsx`, add the route:
```typescript
import LabelFanBriefs from "./pages/label/LabelFanBriefs";
// Inside the label routes:
<Route path="/label/fan-briefs" element={<LabelFanBriefs />} />
```

---

## BACKEND PIPELINE (SEPARATE FROM FRONTEND)

The backend pipeline lives on the Hetzner VPS as a standalone Deno TypeScript project. It is NOT part of the frontend repo. It is NOT an n8n workflow. It is NOT a Supabase Edge Function (CPU limits too restrictive for AI calls).

It uses **ScrapeCreators YouTube API** for discovery + transcripts, **yt-dlp** for clip segment download only, and **ffmpeg** for clip trimming/formatting. All three already available on the VPS.

The frontend only reads from the `fan_briefs` table and writes status updates (approve/skip/modify). The backend pipeline handles all discovery, analysis, clip extraction, and brief generation.

**Frontend developers: you do NOT need to build the pipeline.** Just build the portal page that reads from fan_briefs and displays/manages them.

### For seeding test data (during frontend development)
Insert mock briefs directly into fan_briefs via SQL:

```sql
INSERT INTO fan_briefs (artist_handle, artist_id, label_id, hook_text, caption, format_recommendation, platform_recommendation, sound_pairing, why_now, confidence_score, source_url, source_title, timestamp_start, timestamp_end, youtube_timestamp_url, clip_storage_url, clip_duration_seconds, status)
VALUES 
  ('harrystyles', (SELECT id FROM artist_intelligence WHERE artist_handle = 'harrystyles'), 
   (SELECT id FROM labels WHERE slug = 'columbia-records-us'),
   'I still get nervous before every show',
   'the way he says this so casually 🥺 #harrystyles #interview #vulnerable',
   '15s_vertical_clip_text_overlay', ARRAY['tiktok', 'reels'],
   'Sign of the Times slowed reverb', 
   'Raw confession format driving 2.8x engagement this week. 2-year interview anniversary.',
   87, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'Harry Styles x Zane Lowe — Apple Music',
   2052, 2067, 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=2052',
   'https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/fan-briefs/harrystyles/mock-clip-1.mp4',
   15, 'pending'),
  ('harrystyles', (SELECT id FROM artist_intelligence WHERE artist_handle = 'harrystyles'), 
   (SELECT id FROM labels WHERE slug = 'columbia-records-us'),
   'The first time I heard it on the radio I pulled over',
   'imagine hearing your own song on the radio for the first time 😭 #harrystyles #firsttime',
   '20s_vertical_clip_text_overlay', ARRAY['tiktok', 'reels'],
   NULL, 
   'Nostalgia format trending on fan accounts. Origin story clips drive 3.1x saves.',
   92, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'Harry Styles — Capital FM Interview 2023',
   1834, 1854, 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=1834',
   NULL, 20, 'pending'),
  ('harrystyles', (SELECT id FROM artist_intelligence WHERE artist_handle = 'harrystyles'), 
   (SELECT id FROM labels WHERE slug = 'columbia-records-us'),
   'My mum still texts me good luck before every show',
   'protect this man at all costs 🥹 #harrystyles #wholesome #mum',
   'carousel_3_stills_caption', ARRAY['reels', 'tiktok'],
   NULL, 
   'Family content outperforms promo by 4x on fan accounts this month.',
   74, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'Harry Styles — Hot Ones S18',
   412, 428, 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=412',
   NULL, 16, 'pending');
```

Create 5-10 mock briefs with varying confidence scores (60-95), different formats, some with clip_storage_url and some without (to test both states), and different statuses to test the full UI.

---

## CRITICAL RULES

1. **Use service_role key for pipeline writes.** Anon key returns empty arrays on these tables (RLS). Frontend reads work via JWT + RLS.
2. **Never store video files.** Only URLs + metadata + transcripts.
3. **Embeddings are 768-dim Gemini embedding-001.** Consistent with existing artist_rag_content and rag_content tables.
4. **fan_briefs.label_id must always be set.** RLS depends on it. Pipeline must populate from artist_intelligence.label_id.
5. **The (supabase.from as any)() pattern** is required because generated Supabase types don't include new tables. This is a known project-wide issue.
6. **Follow existing component patterns.** Look at LabelSettings.tsx, SoundIntelligenceOverview.tsx, and LabelDashboard.tsx for exact style patterns before writing new components.

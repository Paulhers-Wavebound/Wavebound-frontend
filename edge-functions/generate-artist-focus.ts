/**
 * Generate AI-focused sound pick for an artist (Layer 3 judgment).
 *
 * AGENTIC VERSION — Opus 4.6 with extended thinking + tools.
 * The AI gets a baseline data dump from 8 parallel queries, then can
 * use tools (web search, database queries) to fill gaps and verify
 * claims before making its final judgment call.
 *
 * POST { artist_handle, label_id }
 * POST { label_id, batch: true } — processes all artists for the label
 *
 * Stores in artist_intelligence.weekly_pulse + weekly_pulse_generated_at.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface FocusedSound {
  title: string;
  reason: string;
  action: string;
}

interface CatalogueAlert {
  title: string;
  delta: string;
  reason: string;
  action: string;
}

type ReleaseConfidence = "high" | "medium" | "low";

interface NextReleaseIntel {
  date: string | null;
  title?: string | null;
  source_url?: string | null;
  source_type?: "tiktok_caption" | "web" | "latest_release" | "manual" | null;
  evidence?: string | null;
  confidence?: ReleaseConfidence | null;
  checked_at?: string;
}

interface ArtistFocusResult {
  focused_sound?: FocusedSound;
  catalogue_alert?: CatalogueAlert;
  next_release_date?: string | null;
  next_release?: NextReleaseIntel | null;
  next_release_title?: string | null;
  next_release_source_url?: string | null;
  next_release_source_type?: NextReleaseIntel["source_type"];
  next_release_evidence?: string | null;
  next_release_confidence?: ReleaseConfidence | null;
}

// ── Tool Definitions ───────────────────────────────────

// Client-side tools (we execute these)
const CLIENT_TOOLS = [
  {
    name: "query_database",
    description: `Query the Wavebound database for detailed artist data beyond what's in the pre-loaded context.

YOU MUST USE THIS TOOL WHEN:
- You need to verify a specific metric before citing it
- The pre-loaded data seems thin (e.g., 0 sounds, stale dates)
- You want to see the full list of an artist's sounds with performance data
- You need video-level detail (specific post captions, engagement per video)
- You want to check if newer data exists than what was pre-loaded

AVAILABLE TABLES:

1. catalog_tiktok_performance — All sounds with UGC breakdown
   Key columns: song_name, artist_name, tiktok_video_count, total_tiktok_plays,
   fan_to_artist_ratio, tiktok_status, videos_last_7d, videos_last_30d, unique_creators
   Filter by: artist_name (use filter_type: "name")

2. artist_videos_tiktok — Recent TikTok posts with captions
   Key columns: artist_handle, date_posted, caption, sound_title, music_id,
   video_views, video_saves, video_shares, video_likes
   Filter by: artist_handle (use filter_type: "handle")

3. roster_dashboard_metrics — Performance snapshot
   Key columns: artist_handle, artist_name, momentum_tier, risk_level,
   days_since_last_post, avg_views_30d, avg_saves_30d, delta_avg_views_pct,
   latest_release_name, latest_release_date
   Filter by: artist_handle (use filter_type: "handle")

4. artist_content_dna — Content format analysis
   Key columns: artist_handle, best_format, best_format_vs_median, worst_format,
   avg_hook_score, avg_viral_score, primary_genre
   Filter by: artist_handle (use filter_type: "handle")

5. artist_intelligence — Brand research, releases, past AI analysis
   Key columns: artist_handle, artist_name, latest_release, brand_document
   Filter by: artist_handle (use filter_type: "handle")
   NOTE: brand_document is large — only query this if you specifically need brand/career info.

ALWAYS set a limit (max 50). ALWAYS filter by artist.`,
    input_schema: {
      type: "object" as const,
      properties: {
        table: {
          type: "string",
          description: "Table name to query",
          enum: [
            "catalog_tiktok_performance",
            "artist_videos_tiktok",
            "roster_dashboard_metrics",
            "artist_content_dna",
            "artist_intelligence",
          ],
        },
        select: {
          type: "string",
          description: "Comma-separated column names to return. Use * for all.",
        },
        artist_filter: {
          type: "string",
          description:
            "Artist handle (e.g., 'malcolmtodddd') or name (e.g., 'Malcolm Todd').",
        },
        filter_type: {
          type: "string",
          enum: ["handle", "name"],
          description:
            "Whether artist_filter is a handle (exact) or name (partial match). Default: handle.",
        },
        extra_filters: {
          type: "object",
          description:
            'Additional filters as {column: value}. Prefix value with > or < for comparisons (e.g., {"videos_last_7d": ">10"}).',
        },
        order_by: {
          type: "string",
          description: "Column to sort by",
        },
        order_direction: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort direction. Default: desc.",
        },
        limit: {
          type: "number",
          description: "Max rows (1-50). Default: 20.",
        },
      },
      required: ["table", "artist_filter"],
    },
  },
];

// Server-side tools (Anthropic executes these)
const SERVER_TOOLS = [
  {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 5,
  },
];

const ALL_TOOLS = [...SERVER_TOOLS, ...CLIENT_TOOLS];

// ── Tool Executors ─────────────────────────────────────

const ALLOWED_TABLES = new Set([
  "catalog_tiktok_performance",
  "artist_videos_tiktok",
  "roster_dashboard_metrics",
  "artist_content_dna",
  "artist_intelligence",
]);

const TABLE_ARTIST_COLUMNS: Record<string, { handle?: string; name?: string }> =
  {
    catalog_tiktok_performance: { name: "artist_name" },
    artist_videos_tiktok: { handle: "artist_handle" },
    roster_dashboard_metrics: { handle: "artist_handle", name: "artist_name" },
    artist_content_dna: { handle: "artist_handle" },
    artist_intelligence: { handle: "artist_handle", name: "artist_name" },
  };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function normalizeConfidence(value: unknown): ReleaseConfidence | null {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return null;
}

function normalizeSourceType(
  value: unknown,
): NextReleaseIntel["source_type"] {
  if (
    value === "tiktok_caption" ||
    value === "web" ||
    value === "latest_release" ||
    value === "manual"
  ) {
    return value;
  }
  return null;
}

function normalizeReleaseDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const parsed = Date.parse(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed)) return null;

  const today = new Date();
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const daysUntil = Math.round((parsed - todayUTC) / 86_400_000);

  if (daysUntil < 0 || daysUntil > 60) return null;
  return trimmed;
}

function normalizeReleaseIntel(
  input: unknown,
  checkedAt = new Date().toISOString(),
): NextReleaseIntel {
  const source = isRecord(input) ? input : {};
  const date =
    normalizeReleaseDate(source.date) ??
    normalizeReleaseDate(source.next_release_date);

  if (!date) {
    return {
      date: null,
      title: null,
      source_url: null,
      source_type: null,
      evidence: null,
      confidence: null,
      checked_at: checkedAt,
    };
  }

  return {
    date,
    title: cleanString(source.title, 140),
    source_url: cleanString(source.source_url, 500),
    source_type: normalizeSourceType(source.source_type),
    evidence: cleanString(source.evidence, 360),
    confidence: normalizeConfidence(source.confidence) ?? "medium",
    checked_at: checkedAt,
  };
}

function withReleaseFields(
  result: ArtistFocusResult,
  release: NextReleaseIntel,
): ArtistFocusResult {
  return {
    ...result,
    next_release_date: release.date,
    next_release: release,
    next_release_title: release.title ?? null,
    next_release_source_url: release.source_url ?? null,
    next_release_source_type: release.source_type ?? null,
    next_release_evidence: release.evidence ?? null,
    next_release_confidence: release.confidence ?? null,
  };
}

function mergeReleaseIntoPulse(
  pulse: unknown,
  release: NextReleaseIntel,
): ArtistFocusResult {
  const current = isRecord(pulse) ? (pulse as ArtistFocusResult) : {};
  return withReleaseFields(current, release);
}

async function persistReleaseIntel(
  supabase: ReturnType<typeof createClient>,
  artistHandle: string,
  labelId: string,
  release: NextReleaseIntel,
): Promise<void> {
  if (!release.date) return;

  const { error } = await supabase.from("artist_release_calendar").upsert(
    {
      label_id: labelId,
      artist_handle: artistHandle.toLowerCase().replace(/^@+/, ""),
      release_date: release.date,
      title: release.title,
      source_url: release.source_url,
      source_type: release.source_type,
      evidence: release.evidence,
      confidence: release.confidence ?? "medium",
      status: "ai_detected",
      detected_by: "generate-artist-focus",
      last_seen_at: release.checked_at ?? new Date().toISOString(),
      evidence_payload: release,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "label_id,artist_handle,release_date" },
  );

  if (error) {
    console.error(
      `Failed to persist release intel for ${artistHandle}: ${error.message}`,
    );
  }
}

async function executeQueryDatabase(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>,
): Promise<string> {
  try {
    const table = input.table as string;
    const select = (input.select as string) || "*";
    const artistFilter = input.artist_filter as string;
    const filterType = (input.filter_type as string) || "handle";
    const extraFilters = (input.extra_filters as Record<string, unknown>) || {};
    const orderBy = input.order_by as string | undefined;
    const orderDirection = (input.order_direction as string) || "desc";
    const limit = Math.min((input.limit as number) || 20, 50);

    if (!ALLOWED_TABLES.has(table)) {
      return JSON.stringify({
        error: `Table "${table}" not allowed. Use: ${[...ALLOWED_TABLES].join(", ")}`,
      });
    }

    let query = supabase.from(table).select(select);

    // Apply artist filter
    const columns = TABLE_ARTIST_COLUMNS[table];
    if (filterType === "name" && columns.name) {
      query = query.ilike(columns.name, `%${artistFilter}%`);
    } else if (columns.handle) {
      query = query.eq(
        columns.handle,
        artistFilter.toLowerCase().replace(/^@+/, ""),
      );
    } else if (columns.name) {
      query = query.ilike(columns.name, `%${artistFilter}%`);
    }

    // Apply extra filters
    for (const [key, value] of Object.entries(extraFilters)) {
      const v = String(value);
      if (v.startsWith(">")) {
        query = query.gt(key, parseFloat(v.slice(1)));
      } else if (v.startsWith("<")) {
        query = query.lt(key, parseFloat(v.slice(1)));
      } else if (v.startsWith("!=")) {
        query = query.neq(key, v.slice(2));
      } else {
        query = query.eq(key, value);
      }
    }

    if (orderBy) {
      query = query.order(orderBy, { ascending: orderDirection === "asc" });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      return JSON.stringify({
        error: error.message,
        hint: error.hint || undefined,
      });
    }

    return JSON.stringify({
      table,
      count: (data || []).length,
      results: data || [],
    });
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : "Query failed",
    });
  }
}

// ── System Prompt ──────────────────────────────────────

const SYSTEM_PROMPT = `You are the AI intelligence layer at a major record label. You make the same judgment calls a senior Head of Content & Social Media would make after 2 hours of morning triage — but you do it in seconds, backed by data and research tools.

Your job: look at ALL the data for this artist and pick the ONE sound the label should focus their energy on RIGHT NOW. This is not about which sound has the most total plays. This is about which sound represents the highest-value decision opportunity TODAY.

═══════════════════════════════════════════════════════
TOOLS — YOU MUST USE THEM. THIS IS NOT OPTIONAL.
═══════════════════════════════════════════════════════

You have two tools. Using them is MANDATORY in the scenarios below. Guessing when you could verify is negligence. This brief goes to Sony Music Group executives who WILL fact-check your claims.

1. web_search — Search the internet for current information
   ┌─────────────────────────────────────────────────┐
   │ MANDATORY USE — you MUST search when:           │
   │                                                 │
   │ • A sound has high UGC (>1000 videos/week)      │
   │   → Search "[song] [artist] TikTok chart 2026"  │
   │   → Verify if it's charting. Execs already know.│
   │                                                 │
   │ • latest_release data is >60 days old           │
   │   → Search "[artist] new release 2026"          │
   │   → There may be newer releases our DB missed.  │
   │                                                 │
   │ • You want to say ANYTHING about chart position │
   │   → SEARCH FIRST. Never guess chart positions.  │
   │                                                 │
   │ • You want to reference public news/activity    │
   │   → Search for it. Don't assume from captions.  │
   └─────────────────────────────────────────────────┘

2. query_database — Query our internal database
   ┌─────────────────────────────────────────────────┐
   │ MANDATORY USE — you MUST query when:            │
   │                                                 │
   │ • Pre-loaded data shows 0 sounds or 0 UGC      │
   │   → Query catalog_tiktok_performance for full   │
   │     sound catalog. Data may exist beyond the    │
   │     pre-loaded summary.                         │
   │                                                 │
   │ • You're about to say "no data available"       │
   │   → Query FIRST. The pre-load is a summary.     │
   │   → The full DB may have what you need.         │
   │                                                 │
   │ • You want more video detail                    │
   │   → Query artist_videos_tiktok for full post    │
   │     history with captions and sound usage.      │
   │                                                 │
   │ • A metric in the pre-load seems stale/wrong    │
   │   → Query the source table to verify.           │
   └─────────────────────────────────────────────────┘

WHEN IN DOUBT → USE A TOOL.
Finding nothing is infinitely better than making something up.

═══════════════════════════════════════════════════════
DECISION FRAMEWORK (weighted by urgency)
═══════════════════════════════════════════════════════

1. NEW RELEASE IN PUSH WINDOW (highest weight)
   If the artist has a recent release (< 30 days), this is almost always the focus.
   The label is spending money, the algorithm window is open.
   Exception: if it's flopping badly AND a catalog track is organically surging.
   IMPORTANT: Check BOTH the "LATEST RELEASE" field AND the "RECENT TIKTOK POSTS" captions.
   Artists tease new songs in captions BEFORE release data updates.
   If captions reference a new song not in LATEST RELEASE — use web_search to verify the release date.

2. ORGANIC UGC SURGE ON ANY SOUND (high weight)
   fan_to_artist_ratio >= 3x signals strong organic fan adoption.
   Key signal: videos_last_7d growing + high unique_creators + fan_to_artist_ratio >= 2x.
   If UGC is high (>1000/week), use web_search to check if the sound is charting.

3. CATALOG NOSTALGIA LOOP (medium-high weight)
   Old tracks trending because they fit current cultural context.
   Signal: catalog track with increasing videos_last_7d relative to other sounds.

4. ACCELERATING SOUND with CONVERSION (medium weight)
   Sound gaining videos AND decent save rate (> 1.5%).
   Reaching people AND converting to streams.

5. VIRAL MIRAGE — HIGH VIEWS, LOW SAVES (flag it)
   Massive views but save rate < 0.8% = content reaches but doesn't convert.

CATALOG ALERT (separate from focused sound):
Only flag a catalog track with genuinely unexpected growth — NOT the same as the focused sound.
If no catalog track shows surprising movement, return catalogue_alert as null.

═══════════════════════════════════════════════════════
ANTI-HALLUCINATION RULES — VIOLATING THESE GETS YOU FIRED
═══════════════════════════════════════════════════════

This brief goes to senior label executives at Sony Music Group. They live in this data every day. One wrong claim and this product is dead.

1. NEVER claim something you cannot see in the data or verify with a tool.
   You have NO visibility into:
   - Whether the label is running a push/campaign on a track
   - Whether a sound is "organic" vs "paid"
   - What the artist's management is planning
   - Chart positions (unless you SEARCHED and found them)
   - What competitors are doing

   BANNED PHRASES (unless you have tool-verified evidence):
   "despite no label push" | "without promotion" | "organically trending" |
   "charting at #X" (without web_search) | "going viral" (without metrics)

2. NEVER prescribe specific creative actions you can't justify from data.
   BAD: "Release a sped-up version and seed with nano-creators"
   GOOD: "20K weekly UGC with 6x fan ratio — evaluate resource allocation for this track"

3. EVERY claim must cite a specific number from the data or from tool results.
   BAD: "massive surge" → GOOD: "+20,037 new videos in 7 days"
   BAD: "gaining traction" → GOOD: "videos_last_7d: 704, status: accelerating"

4. When data is thin, SAY SO. Then use your tools to try to fill the gap.
   "Limited data in pre-load — querying database for full sound catalog..."
   is the CORRECT response. "No data available" without querying first is WRONG.

5. The "action" field frames the DECISION, not the solution.
   Executives decide what to do. You surface what the data shows.

═══════════════════════════════════════════════════════
NEXT RELEASE DETECTION
═══════════════════════════════════════════════════════

Separately from focused_sound and catalogue_alert, populate "next_release" with structured
upcoming-release intelligence for an ANNOUNCED upcoming release within the next 60 days.

Set next_release.date to the ISO date (YYYY-MM-DD) only when:
  - A TikTok caption you read explicitly states a release date ("Out April 30th", "drops 5/12", etc.), OR
  - A web_search returns a press release, label announcement, or distributor page with a specific public release date, OR
  - The latest_release data already includes a future-dated release.

ONLY set this when there is a SPECIFIC, PUBLIC, ANNOUNCED date. Do NOT set it for:
  - Vague language ("coming soon", "new music dropping this summer")
  - Speculation based on posting cadence
  - Teaser videos with no announced date

When next_release.date is set, also set:
  - next_release.title: release title if known, else null.
  - next_release.source_url: the exact public URL you used, if web_search provided one; otherwise null.
  - next_release.source_type: "web", "tiktok_caption", or "latest_release".
  - next_release.evidence: one short sentence quoting/paraphrasing the public evidence.
  - next_release.confidence:
      "high" = official source, label/artist announcement, distributor/press page, or future latest_release data.
      "medium" = specific public date from a credible non-official source or clear TikTok caption.
      "low" = specific date exists but source is weak/ambiguous; only use low if you would want a human to verify.

Also duplicate the date at top-level "next_release_date" for backwards compatibility.

If no specific public announced date exists, set next_release_date to null and next_release.date to null.
Better to be null than wrong — this field controls a roster-wide "Posting Window" indicator,
and a false positive misleads the entire content team for a week.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

After using tools and analyzing all data, respond with JSON ONLY (no markdown fences):
{"focused_sound":{"title":"...","reason":"...","action":"..."},"catalogue_alert":{"title":"...","delta":"...","reason":"...","action":"..."} or null,"next_release_date":"YYYY-MM-DD" or null,"next_release":{"date":"YYYY-MM-DD" or null,"title":"..." or null,"source_url":"https://..." or null,"source_type":"web" or "tiktok_caption" or "latest_release" or null,"evidence":"..." or null,"confidence":"high" or "medium" or "low" or null}}

- "reason": ONE sentence. What signal did you detect? Cite specific numbers.
- "action": ONE sentence. What decision does the exec need to evaluate?
- If catalogue_alert has no surprising movement, set it to null.
- If no announced upcoming release within 60 days, set next_release_date to null and next_release.date to null.
- Every number you cite must come from the pre-loaded data OR from a tool result.`;

const RELEASE_SCAN_PROMPT = `You are Wavebound's release-date intelligence collector for a major label roster.

Your only job: determine whether this artist has a SPECIFIC, PUBLICLY ANNOUNCED upcoming song/album release date in the next 60 days.

Use the provided context first. Use web_search when captions, latest_release data, or brand context suggest there may be an upcoming release but the date/source is not explicit enough.

STRICT RULES:
- Return null date unless there is a concrete date in YYYY-MM-DD form or a public source that can be normalized to YYYY-MM-DD.
- "Coming soon", "new era", "soon", "this summer", and cadence guesses are NOT release dates.
- Prefer official artist/label/distributor/press sources over secondary sites.
- If the only source is a TikTok caption with a specific date, source_type is "tiktok_caption" and source_url may be null.
- Confidence "high" requires official/future latest_release data or a clearly official public source.
- Confidence "medium" is a credible public source or clear caption.
- Confidence "low" means a specific date exists but a human should verify it; low confidence will not drive Posting Window sorting.

Respond with JSON ONLY:
{"date":"YYYY-MM-DD" or null,"title":"..." or null,"source_url":"https://..." or null,"source_type":"web" or "tiktok_caption" or "latest_release" or null,"evidence":"one short sentence with the evidence" or null,"confidence":"high" or "medium" or "low" or null}`;

// ── Agentic Loop ───────────────────────────────────────

const MAX_TOOL_ROUNDS = 3;

async function runAgenticLoop(
  supabase: ReturnType<typeof createClient>,
  artistName: string,
  context: string,
  anthropicApiKey: string,
): Promise<ArtistFocusResult> {
  const messages: unknown[] = [
    {
      role: "user",
      content: `Here is the pre-loaded context for ${artistName}. Analyze it, use your tools to verify and fill gaps, then pick the focused sound and check for catalog alerts.

${context}`,
    },
  ];

  let toolRound = 0;

  while (toolRound <= MAX_TOOL_ROUNDS) {
    console.log(
      `  [${artistName}] API call ${toolRound + 1}/${MAX_TOOL_ROUNDS + 1}...`,
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 16000,
        thinking: {
          type: "enabled",
          budget_tokens: 10000,
        },
        system: SYSTEM_PROMPT,
        messages,
        tools: ALL_TOOLS,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const result = (await response.json()) as {
      content: Array<Record<string, unknown>>;
      stop_reason: string;
    };
    const contentBlocks = result.content || [];
    const stopReason = result.stop_reason;

    // Find client-side tool_use blocks that need our execution
    const clientToolBlocks = contentBlocks.filter(
      (b) => b.type === "tool_use",
    ) as Array<{ id: string; name: string; input: Record<string, unknown> }>;

    // If no more tools needed, or max rounds hit, extract final text
    if (
      stopReason !== "tool_use" ||
      clientToolBlocks.length === 0 ||
      toolRound >= MAX_TOOL_ROUNDS
    ) {
      // Find ALL text blocks (there may be multiple after tool rounds)
      const textBlocks = contentBlocks.filter(
        (b) => b.type === "text",
      ) as Array<{ text: string }>;
      // Use the last text block — that's the final answer after tool usage
      const textContent =
        textBlocks.length > 0 ? textBlocks[textBlocks.length - 1].text : "{}";

      const cleaned = textContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Try direct parse first
      try {
        return JSON.parse(cleaned);
      } catch {
        // Try to extract JSON object from mixed text
        const jsonMatch = cleaned.match(/\{[\s\S]*"focused_sound"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {
            // fall through
          }
        }
        // Last resort: find any JSON object
        const anyJson = cleaned.match(/\{[\s\S]*\}/);
        if (anyJson) {
          try {
            return JSON.parse(anyJson[0]);
          } catch {
            // fall through
          }
        }
        console.error(
          `  [${artistName}] Failed to parse JSON from response: ${cleaned.slice(0, 500)}`,
        );
        throw new Error(
          `Failed to parse AI response as JSON. Raw text: ${cleaned.slice(0, 200)}`,
        );
      }
    }

    // Execute client tools
    const toolResults: unknown[] = [];

    for (const toolBlock of clientToolBlocks) {
      console.log(
        `  [${artistName}] Tool: ${toolBlock.name}(${JSON.stringify(toolBlock.input).slice(0, 150)})`,
      );

      let toolResult: string;
      if (toolBlock.name === "query_database") {
        toolResult = await executeQueryDatabase(supabase, toolBlock.input);
      } else {
        toolResult = JSON.stringify({
          error: `Unknown tool: ${toolBlock.name}. Available: query_database`,
        });
      }

      console.log(
        `  [${artistName}] Result: ${toolResult.slice(0, 200)}${toolResult.length > 200 ? "..." : ""}`,
      );

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: toolResult,
      });
    }

    // Add assistant response (with ALL blocks including thinking) and tool results
    messages.push({ role: "assistant", content: contentBlocks });
    messages.push({ role: "user", content: toolResults });

    toolRound++;
  }

  throw new Error(
    `Agentic loop for ${artistName} ended without producing a result after ${MAX_TOOL_ROUNDS} rounds`,
  );
}

async function runReleaseScanLoop(
  supabase: ReturnType<typeof createClient>,
  artistName: string,
  context: string,
  anthropicApiKey: string,
): Promise<NextReleaseIntel> {
  const messages: unknown[] = [
    {
      role: "user",
      content: `Here is the pre-loaded context for ${artistName}. Find only the next announced release date if one exists.\n\n${context}`,
    },
  ];

  let toolRound = 0;

  while (toolRound <= MAX_TOOL_ROUNDS) {
    console.log(
      `  [${artistName}] Release scan API call ${toolRound + 1}/${MAX_TOOL_ROUNDS + 1}...`,
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 4000,
        thinking: {
          type: "enabled",
          budget_tokens: 2000,
        },
        system: RELEASE_SCAN_PROMPT,
        messages,
        tools: ALL_TOOLS,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const result = (await response.json()) as {
      content: Array<Record<string, unknown>>;
      stop_reason: string;
    };
    const contentBlocks = result.content || [];
    const stopReason = result.stop_reason;

    const clientToolBlocks = contentBlocks.filter(
      (b) => b.type === "tool_use",
    ) as Array<{ id: string; name: string; input: Record<string, unknown> }>;

    if (
      stopReason !== "tool_use" ||
      clientToolBlocks.length === 0 ||
      toolRound >= MAX_TOOL_ROUNDS
    ) {
      const textBlocks = contentBlocks.filter(
        (b) => b.type === "text",
      ) as Array<{ text: string }>;
      const textContent =
        textBlocks.length > 0 ? textBlocks[textBlocks.length - 1].text : "{}";

      const cleaned = textContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      try {
        return normalizeReleaseIntel(JSON.parse(cleaned));
      } catch {
        const anyJson = cleaned.match(/\{[\s\S]*\}/);
        if (anyJson) {
          try {
            return normalizeReleaseIntel(JSON.parse(anyJson[0]));
          } catch {
            // fall through
          }
        }
        console.error(
          `  [${artistName}] Failed to parse release JSON: ${cleaned.slice(0, 500)}`,
        );
        throw new Error(
          `Failed to parse release scan response as JSON. Raw text: ${cleaned.slice(0, 200)}`,
        );
      }
    }

    const toolResults: unknown[] = [];

    for (const toolBlock of clientToolBlocks) {
      console.log(
        `  [${artistName}] Release tool: ${toolBlock.name}(${JSON.stringify(toolBlock.input).slice(0, 150)})`,
      );

      let toolResult: string;
      if (toolBlock.name === "query_database") {
        toolResult = await executeQueryDatabase(supabase, toolBlock.input);
      } else {
        toolResult = JSON.stringify({
          error: `Unknown tool: ${toolBlock.name}. Available: query_database`,
        });
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: toolResult,
      });
    }

    messages.push({ role: "assistant", content: contentBlocks });
    messages.push({ role: "user", content: toolResults });

    toolRound++;
  }

  throw new Error(
    `Release scan loop for ${artistName} ended without producing a result after ${MAX_TOOL_ROUNDS} rounds`,
  );
}

// ── Context Builder (pre-fetch 8 data sources) ────────

async function buildArtistContext(
  supabase: ReturnType<typeof createClient>,
  artistHandle: string,
  labelId: string,
): Promise<{ context: string; artistName: string }> {
  const normalizedHandle = artistHandle.toLowerCase().replace(/^@+/, "");

  const [
    velocityRes,
    catalogRes,
    intelligenceRes,
    siRes,
    rosterRes,
    dnaRes,
    sentimentRes,
    recentVideosRes,
  ] = await Promise.all([
    supabase
      .rpc("get_artist_sound_velocity", { p_label_id: labelId })
      .then((res: { data: unknown[] | null }) => {
        const data = (res.data || []) as Array<Record<string, unknown>>;
        return data.find(
          (d) =>
            ((d.artist_handle as string) || "")
              .toLowerCase()
              .replace(/^@+/, "") === normalizedHandle,
        );
      }),

    supabase
      .from("catalog_tiktok_performance")
      .select(
        "song_name, tiktok_video_count, total_tiktok_plays, fan_to_artist_ratio, tiktok_status, videos_last_7d, videos_last_30d, unique_creators, fan_videos",
      )
      .ilike("artist_name", `%${normalizedHandle}%`)
      .gt("tiktok_video_count", 0)
      .order("tiktok_video_count", { ascending: false })
      .limit(15),

    supabase
      .from("artist_intelligence")
      .select(
        "latest_release, brand_document, artist_name, content_plan_html, content_plan_30d_html",
      )
      .eq("artist_handle", artistHandle)
      .maybeSingle(),

    supabase
      .rpc("get_si_sound_performance", { p_label_id: labelId })
      .then((res: { data: unknown[] | null }) => {
        const data = (res.data || []) as Array<Record<string, unknown>>;
        return data.filter((d) =>
          ((d.artist_name as string) || "")
            .toLowerCase()
            .includes(normalizedHandle),
        );
      }),

    supabase
      .from("roster_dashboard_metrics")
      .select(
        "momentum_tier, risk_level, days_since_last_post, avg_views_30d, avg_saves_30d, delta_avg_views_pct, avg_engagement_30d, posting_freq_30d",
      )
      .eq("artist_handle", artistHandle)
      .maybeSingle(),

    supabase
      .from("artist_content_dna" as string)
      .select(
        "best_format, best_format_vs_median, worst_format, avg_hook_score, avg_viral_score, primary_genre",
      )
      .eq("artist_handle", normalizedHandle)
      .maybeSingle(),

    supabase
      .from("wb_comment_sentiment" as string)
      .select("sentiment_score, fan_energy")
      .eq("entity_id", normalizedHandle)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("artist_videos_tiktok")
      .select(
        "caption, sound_title, music_id, is_original_sound, date_posted, video_views, video_saves, video_shares",
      )
      .eq("artist_handle", artistHandle)
      .order("date_posted", { ascending: false })
      .limit(10),
  ]);

  const artistName =
    ((intelligenceRes.data as Record<string, unknown> | null)
      ?.artist_name as string) || artistHandle;
  const roster = rosterRes.data as Record<string, unknown> | null;
  const dna = dnaRes.data as Record<string, unknown> | null;

  // Build context string
  const contextParts: string[] = [];

  contextParts.push(`TODAY: ${new Date().toISOString().split("T")[0]}`);
  contextParts.push(`ARTIST: ${artistName} (@${artistHandle})`);

  if (roster) {
    const parts: string[] = [];
    parts.push(`momentum: ${roster.momentum_tier || "unknown"}`);
    parts.push(`risk: ${roster.risk_level || "unknown"}`);
    if (roster.days_since_last_post != null)
      parts.push(`last post: ${roster.days_since_last_post} days ago`);
    if (roster.avg_views_30d != null)
      parts.push(
        `avg views: ${Math.round(roster.avg_views_30d as number).toLocaleString()}`,
      );
    if (
      roster.avg_saves_30d != null &&
      (roster.avg_saves_30d as number) > 0 &&
      roster.avg_views_30d != null
    )
      parts.push(
        `save rate: ${(((roster.avg_saves_30d as number) / (roster.avg_views_30d as number)) * 100).toFixed(1)}%`,
      );
    if (roster.delta_avg_views_pct != null)
      parts.push(
        `velocity: ${(roster.delta_avg_views_pct as number) > 0 ? "+" : ""}${(roster.delta_avg_views_pct as number).toFixed(0)}% WoW`,
      );
    contextParts.push(`STATE: ${parts.join(", ")}`);
  }

  if (dna) {
    const parts: string[] = [];
    if (dna.best_format)
      parts.push(
        `best format: ${dna.best_format}${dna.best_format_vs_median ? ` (${(dna.best_format_vs_median as number).toFixed(1)}x median)` : ""}`,
      );
    if (dna.worst_format) parts.push(`worst format: ${dna.worst_format}`);
    if (dna.avg_hook_score)
      parts.push(`hook score: ${Math.round(dna.avg_hook_score as number)}/100`);
    if (dna.avg_viral_score)
      parts.push(
        `viral score: ${Math.round(dna.avg_viral_score as number)}/100`,
      );
    if (dna.primary_genre) parts.push(`genre: ${dna.primary_genre}`);
    if (parts.length > 0) contextParts.push(`CONTENT DNA: ${parts.join(", ")}`);
  }

  const intel = intelligenceRes.data as Record<string, unknown> | null;
  if (intel?.latest_release) {
    const lr = intel.latest_release as Record<string, string>;
    if (typeof lr === "object" && lr.date) {
      const releaseDate = new Date(lr.date);
      const now = new Date();
      const ageInDays = Math.floor(
        (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const inPushWindow = ageInDays <= 30;
      contextParts.push(
        `LATEST RELEASE: "${lr.name}" (${lr.type || "single"}) — released ${lr.date} (${ageInDays} days ago). ${inPushWindow ? "WITHIN 30-DAY PUSH WINDOW." : "OUTSIDE push window — this is now catalog."}`,
      );
    } else {
      contextParts.push(
        `LATEST RELEASE: ${typeof lr === "object" ? JSON.stringify(lr) : lr}`,
      );
    }
  }

  if (velocityRes) {
    const v = velocityRes as Record<string, unknown>;
    contextParts.push(
      `CURRENT TOP SOUND: "${v.top_sound_title}" — ${v.top_sound_new_ugc || 0} new UGC this week, ${v.top_sound_total_ugc || 0} total, velocity: ${v.velocity || "unknown"}, ${v.sounds_tracked || 0} sounds tracked`,
    );
  }

  const catalogData = (catalogRes.data || []) as Array<Record<string, unknown>>;
  if (catalogData.length > 0) {
    const catalogLines = catalogData.map((c) => {
      const parts: string[] = [];
      parts.push(`"${c.song_name}"`);
      parts.push(`${c.tiktok_video_count} total videos`);
      if (c.videos_last_7d) parts.push(`${c.videos_last_7d} new this week`);
      if (c.videos_last_30d) parts.push(`${c.videos_last_30d} in 30d`);
      if (c.unique_creators) parts.push(`${c.unique_creators} creators`);
      if ((c.fan_to_artist_ratio as number) >= 2)
        parts.push(
          `fan ratio: ${(c.fan_to_artist_ratio as number).toFixed(1)}x`,
        );
      parts.push(`status: ${c.tiktok_status || "unknown"}`);
      if (c.total_tiktok_plays)
        parts.push(
          `${((c.total_tiktok_plays as number) / 1_000_000).toFixed(1)}M plays`,
        );
      return parts.join(", ");
    });
    contextParts.push(`CATALOG TIKTOK SOUNDS:\n${catalogLines.join("\n")}`);
  }

  const siData = (siRes || []) as Array<Record<string, unknown>>;
  if (siData.length > 0) {
    const siLines = siData.map((s) => {
      const parts: string[] = [];
      parts.push(`"${s.track_name}"`);
      parts.push(`${s.videos_count || 0} videos`);
      parts.push(`${Number(s.total_views || 0).toLocaleString()} views`);
      if (s.weekly_new_videos) parts.push(`${s.weekly_new_videos} new/week`);
      parts.push(`analysis status: ${s.si_status || "unknown"}`);
      return parts.join(", ");
    });
    contextParts.push(`SOUND INTELLIGENCE TRACKED:\n${siLines.join("\n")}`);
  }

  const sentiment = sentimentRes.data as Record<string, unknown> | null;
  if (sentiment) {
    const parts: string[] = [];
    if (sentiment.sentiment_score != null)
      parts.push(
        `sentiment: ${(sentiment.sentiment_score as number).toFixed(1)}/5`,
      );
    if (sentiment.fan_energy != null)
      parts.push(`fan energy: ${sentiment.fan_energy}`);
    if (parts.length > 0)
      contextParts.push(`FAN SENTIMENT: ${parts.join(", ")}`);
  }

  const recentVideos = (recentVideosRes.data || []) as Array<
    Record<string, unknown>
  >;
  if (recentVideos.length > 0) {
    const videoLines = recentVideos.map((v) => {
      const parts: string[] = [];
      parts.push(`${((v.date_posted as string) || "").slice(0, 10)}`);
      if (v.sound_title) parts.push(`sound: "${v.sound_title}"`);
      if (v.is_original_sound) parts.push("(original sound)");
      if (v.music_id) parts.push(`music_id: ${v.music_id}`);
      parts.push(`${((v.video_views as number) || 0).toLocaleString()} views`);
      if (v.video_saves) parts.push(`${v.video_saves} saves`);
      if (v.caption)
        parts.push(`caption: "${(v.caption as string).slice(0, 120)}"`);
      return parts.join(", ");
    });
    contextParts.push(
      `RECENT TIKTOK POSTS (newest first — read captions carefully for new release teasers):\n${videoLines.join("\n")}`,
    );
  }

  return { context: contextParts.join("\n\n"), artistName };
}

// ── Main: Generate Focus for Artist ───────────────────

async function generateFocusForArtist(
  supabase: ReturnType<typeof createClient>,
  artistHandle: string,
  labelId: string,
  anthropicApiKey: string,
): Promise<ArtistFocusResult> {
  // Phase 1: Pre-fetch baseline data (fast, parallel)
  const { context, artistName } = await buildArtistContext(
    supabase,
    artistHandle,
    labelId,
  );

  // Phase 2: Agentic loop — Opus thinks, uses tools, delivers judgment
  const result = await runAgenticLoop(
    supabase,
    artistName,
    context,
    anthropicApiKey,
  );
  const release = normalizeReleaseIntel(result.next_release ?? result);
  const resultWithRelease = withReleaseFields(result, release);

  // Phase 3: Store result immediately (survives batch timeout)
  await supabase
    .from("artist_intelligence")
    .update({
      weekly_pulse: resultWithRelease,
      weekly_pulse_generated_at: new Date().toISOString(),
    })
    .eq("artist_handle", artistHandle)
    .eq("label_id", labelId);

  await persistReleaseIntel(supabase, artistHandle, labelId, release);

  return resultWithRelease;
}

async function scanReleaseForArtist(
  supabase: ReturnType<typeof createClient>,
  artistHandle: string,
  labelId: string,
  anthropicApiKey: string,
): Promise<NextReleaseIntel> {
  const { context, artistName } = await buildArtistContext(
    supabase,
    artistHandle,
    labelId,
  );

  const release = await runReleaseScanLoop(
    supabase,
    artistName,
    context,
    anthropicApiKey,
  );

  const { data: current } = await supabase
    .from("artist_intelligence")
    .select("weekly_pulse")
    .eq("artist_handle", artistHandle)
    .eq("label_id", labelId)
    .maybeSingle();

  const mergedPulse = mergeReleaseIntoPulse(current?.weekly_pulse, release);

  await supabase
    .from("artist_intelligence")
    .update({
      weekly_pulse: mergedPulse,
    })
    .eq("artist_handle", artistHandle)
    .eq("label_id", labelId);

  await persistReleaseIntel(supabase, artistHandle, labelId, release);

  return release;
}

// ── Deno serve ──────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!anthropicApiKey) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { artist_handle, label_id, batch, release_scan_only } = body;

    if (!label_id && !(batch && release_scan_only)) {
      return jsonResponse({ error: "label_id required" }, 400);
    }

    if (batch) {
      const labels =
        release_scan_only && !label_id
          ? (
              await supabase
                .from("labels")
                .select("id, name")
                .eq("is_active", true)
            ).data || []
          : [{ id: label_id, name: "selected label" }];

      // Batch mode: process artists sequentially.
      // Each result is stored to DB immediately after completion,
      // so even if the HTTP connection times out, completed artists
      // retain their results.
      const results: Record<string, ArtistFocusResult> = {};
      const releaseResults: Record<string, NextReleaseIntel> = {};
      const errors: Record<string, string> = {};

      for (const label of labels as Array<{ id: string; name: string }>) {
        const { data: roster } = await supabase
          .from("roster_dashboard_metrics")
          .select("artist_handle, artist_name")
          .eq("label_id", label.id);

        for (const r of (roster || []) as Array<Record<string, string>>) {
          const resultKey = `${label.id}:${r.artist_handle}`;
          try {
            console.log(
              `\n═══ ${release_scan_only ? "Scanning release" : "Generating focus"} for ${r.artist_name} (@${r.artist_handle}) — ${label.name} ═══`,
            );
            if (release_scan_only) {
              releaseResults[resultKey] = await scanReleaseForArtist(
                supabase,
                r.artist_handle,
                label.id,
                anthropicApiKey,
              );
            } else {
              results[resultKey] = await generateFocusForArtist(
                supabase,
                r.artist_handle,
                label.id,
                anthropicApiKey,
              );
            }
            console.log(`═══ Done: ${r.artist_name} ═══`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors[resultKey] = msg;
            console.error(`═══ FAILED: ${resultKey}: ${msg} ═══`);
          }
        }
      }

      return jsonResponse({
        batch: true,
        release_scan_only: !!release_scan_only,
        processed: release_scan_only
          ? Object.keys(releaseResults).length
          : Object.keys(results).length,
        failed: Object.keys(errors).length,
        results: release_scan_only ? releaseResults : results,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      });
    }

    // Single artist mode
    if (!artist_handle) {
      return jsonResponse({ error: "artist_handle required" }, 400);
    }

    console.log(`\n═══ Generating focus for @${artist_handle} ═══`);
    const result = release_scan_only
      ? await scanReleaseForArtist(
          supabase,
          artist_handle,
          label_id,
          anthropicApiKey,
        )
      : await generateFocusForArtist(
          supabase,
          artist_handle,
          label_id,
          anthropicApiKey,
        );

    return jsonResponse({ artist_handle, focus: result });
  } catch (err) {
    console.error("generate-artist-focus error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});

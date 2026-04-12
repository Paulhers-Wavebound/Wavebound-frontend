/**
 * Generate the AI Signal Report — the cross-roster morning brief.
 *
 * This is the SECOND agent in the pipeline. It runs AFTER all individual
 * artist focus picks (generate-artist-focus) are complete.
 *
 * Its job: read all 13 weekly_pulse results, roster metrics, and anomalies,
 * then produce the 3-5 decisions that matter THIS MORNING — ranked by urgency.
 *
 * Think: Head of Content presenting to SVP at the 9am standup.
 * You have 2 minutes. What are the 3 decisions that need to happen today?
 *
 * POST { label_id }
 * Stores in: president_briefs table (label_id, text, generated_at)
 */
import { createClient } from "npm:@supabase/supabase-js@2";

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

// ── Tool Definitions ───────────────────────────────────

const CLIENT_TOOLS = [
  {
    name: "query_database",
    description: `Query the Wavebound database for additional data to verify or enrich your brief.

USE THIS WHEN:
- You need to verify a specific metric before including it in the brief
- You want historical context for a trend you're highlighting
- You need more detail on a specific artist's recent posts or sounds

AVAILABLE TABLES:

1. catalog_tiktok_performance — Sound performance with UGC breakdown
   Key columns: song_name, artist_name, tiktok_video_count, total_tiktok_plays,
   fan_to_artist_ratio, videos_last_7d, videos_last_30d, unique_creators
   Filter by: artist_name (use filter_type: "name")

2. artist_videos_tiktok — Recent TikTok posts with captions
   Key columns: artist_handle, date_posted, caption, sound_title, video_views, video_saves
   Filter by: artist_handle (use filter_type: "handle")

3. roster_dashboard_metrics — Performance snapshot per artist
   Key columns: artist_handle, artist_name, momentum_tier, risk_level,
   days_since_last_post, avg_views_30d, avg_saves_30d, delta_avg_views_pct,
   latest_release_name, latest_release_date, risk_flags
   Filter by: artist_handle or label_id

4. artist_content_dna — Content format analysis
   Key columns: artist_handle, best_format, best_format_vs_median, worst_format
   Filter by: artist_handle (use filter_type: "handle")

Always set a limit (max 50). Always filter by artist or label.`,
    input_schema: {
      type: "object" as const,
      properties: {
        table: {
          type: "string",
          enum: [
            "catalog_tiktok_performance",
            "artist_videos_tiktok",
            "roster_dashboard_metrics",
            "artist_content_dna",
            "artist_intelligence",
          ],
        },
        select: { type: "string" },
        artist_filter: {
          type: "string",
          description: "Artist handle or name, OR label_id for cross-roster queries.",
        },
        filter_type: {
          type: "string",
          enum: ["handle", "name", "label_id"],
        },
        extra_filters: { type: "object" },
        order_by: { type: "string" },
        order_direction: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "number" },
      },
      required: ["table", "artist_filter"],
    },
  },
];

const SERVER_TOOLS = [
  {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 5,
  },
];

const ALL_TOOLS = [...SERVER_TOOLS, ...CLIENT_TOOLS];

// ── Tool Executor ──────────────────────────────────────

const ALLOWED_TABLES = new Set([
  "catalog_tiktok_performance",
  "artist_videos_tiktok",
  "roster_dashboard_metrics",
  "artist_content_dna",
  "artist_intelligence",
]);

const TABLE_ARTIST_COLUMNS: Record<string, { handle?: string; name?: string; label_id?: string }> = {
  catalog_tiktok_performance: { name: "artist_name" },
  artist_videos_tiktok: { handle: "artist_handle" },
  roster_dashboard_metrics: { handle: "artist_handle", name: "artist_name", label_id: "label_id" },
  artist_content_dna: { handle: "artist_handle" },
  artist_intelligence: { handle: "artist_handle", name: "artist_name", label_id: "label_id" },
};

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
      return JSON.stringify({ error: `Table not allowed. Use: ${[...ALLOWED_TABLES].join(", ")}` });
    }

    let query = supabase.from(table).select(select);
    const columns = TABLE_ARTIST_COLUMNS[table];

    if (filterType === "label_id" && columns.label_id) {
      query = query.eq(columns.label_id, artistFilter);
    } else if (filterType === "name" && columns.name) {
      query = query.ilike(columns.name, `%${artistFilter}%`);
    } else if (columns.handle) {
      query = query.eq(columns.handle, artistFilter.toLowerCase().replace(/^@+/, ""));
    } else if (columns.name) {
      query = query.ilike(columns.name, `%${artistFilter}%`);
    }

    for (const [key, value] of Object.entries(extraFilters)) {
      const v = String(value);
      if (v.startsWith(">")) query = query.gt(key, parseFloat(v.slice(1)));
      else if (v.startsWith("<")) query = query.lt(key, parseFloat(v.slice(1)));
      else query = query.eq(key, value);
    }

    if (orderBy) query = query.order(orderBy, { ascending: orderDirection === "asc" });
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({ table, count: (data || []).length, results: data || [] });
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : "Query failed" });
  }
}

// ── System Prompt ──────────────────────────────────────

const SYSTEM_PROMPT = `You are the Head of Content & Social at a major record label. You are about to walk into the 9am standup with the SVP. You have 2 minutes.

Your job: look at ALL the individual artist briefs and roster data, then distill them into the 3-5 decisions that need executive attention TODAY. Not 13 separate updates — the 3-5 things that MATTER.

═══════════════════════════════════════════════════════
HOW A GREAT SIGNAL REPORT WORKS
═══════════════════════════════════════════════════════

Think of yourself as the editor of the "Presidential Daily Brief" — not a data dump, but a narrative intelligence product. The SVP reads this before their first meeting. It must:

1. LEAD WITH THE SINGLE MOST IMPORTANT THING
   Not alphabetical. Not by artist size. By urgency × impact.
   "Earrings just hit Billboard #65 and climbing — this is our biggest priority today."

2. GROUP RELATED SIGNALS INTO THEMES
   If 3 artists have stale releases, that's ONE decision point (pipeline problem), not 3.
   If 2 artists are in push windows, compare them — which deserves more resources?
   Pattern recognition is your superpower. Individuals = noise. Patterns = signal.

3. FRAME EVERY ITEM AS A DECISION
   Not "Earrings is charting" but "Earrings vs Breathe — where do we allocate?"
   Not "3 artists haven't posted" but "Content pipeline gap — do we escalate to management?"
   The exec's only question is: "What do I need to decide, and what's the cost of waiting?"

4. INCLUDE THE NUMBERS THAT PROVE IT
   Every claim has a number. "#65 Billboard, 20K UGC/week, 6x fan ratio."
   If you don't have the number, use web_search or query_database to find it.
   If you can't find it, say so — don't fabricate.

5. END WITH A QUICK ROSTER PULSE
   2-3 sentences: how many artists are healthy, how many need attention, any systemic issues.

═══════════════════════════════════════════════════════
DECISION CATEGORIES (from the Content & Social Bible)
═══════════════════════════════════════════════════════

Map each decision point to one of these:

- MOMENTUM_CAPTURE: An artist/sound is surging — allocate resources NOW before the window closes
- BUDGET_REALLOCATION: A breakout video/sound needs budget shifted from underperformers
- FORMAT_PIVOT: Content format isn't working — data shows a better format exists
- CATALOG_ACTIVATION: Legacy track showing unexpected momentum — evaluate activation
- CONTENT_PIPELINE: Posting drought or content gap — needs management intervention
- CRISIS_RESPONSE: Risk flag or suppression — needs immediate action
- CONVERSION_ALERT: High reach but low saves (Viral Mirage) — content strategy review needed

═══════════════════════════════════════════════════════
DATA RULES
═══════════════════════════════════════════════════════

The individual artist briefs were generated by an AI agent with web search + database tools.
Chart positions and numbers in those briefs are tool-verified — cite them directly.
DO NOT invent data not present in the input. If a brief mentions a chart position, cite it.
If it doesn't, don't guess. This goes to Sony Music Group. Wrong info = instant dismissal.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Return JSON (no markdown fences):
{
  "headline": "One sentence — the single most important thing today",
  "decision_points": [
    {
      "priority": 1,
      "category": "MOMENTUM_CAPTURE",
      "title": "Short title (e.g., 'Earrings is charting — reallocate from Breathe')",
      "artist_names": ["Malcolm Todd"],
      "signal": "What the data shows — specific numbers",
      "decision": "What the exec needs to decide",
      "urgency": "now | today | this_week",
      "evidence": ["Billboard #65", "20K UGC/week", "6x fan ratio"]
    }
  ],
  "roster_pulse": "2-3 sentences on overall roster health",
  "generated_at": "ISO timestamp"
}

Maximum 5 decision points. Minimum 2. Ranked by priority (1 = most urgent).
"now" = act within hours. "today" = act before end of day. "this_week" = can wait but shouldn't.`;

// ── Agentic Loop ───────────────────────────────────────

async function callOpus(
  userMessage: string,
  anthropicApiKey: string,
): Promise<Record<string, unknown>> {
  console.log(`  [SignalReport] Calling Opus 4.6 with extended thinking...`);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 32000,
      thinking: { type: "enabled", budget_tokens: 16000 },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
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

  // Extract JSON from the text block (may or may not have thinking blocks)
  const textBlocks = contentBlocks.filter((b) => b.type === "text") as Array<{ text: string }>;
  const textContent = textBlocks.length > 0 ? textBlocks[textBlocks.length - 1].text : "{}";

  const cleaned = textContent
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*"decision_points"[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
    }
    const anyJson = cleaned.match(/\{[\s\S]*\}/);
    if (anyJson) {
      try { return JSON.parse(anyJson[0]); } catch { /* fall through */ }
    }
    console.error(`  [SignalReport] Failed to parse: ${cleaned.slice(0, 500)}`);
    throw new Error(`Failed to parse Signal Report JSON: ${cleaned.slice(0, 200)}`);
  }
}

// ── Context Builder ────────────────────────────────────

async function buildSignalReportContext(
  supabase: ReturnType<typeof createClient>,
  labelId: string,
): Promise<{ context: string; labelName: string }> {
  // Fetch all data in parallel
  const [rosterRes, intelligenceRes, anomaliesRes] = await Promise.all([
    // Full roster metrics
    supabase
      .from("roster_dashboard_metrics")
      .select(
        "artist_handle, artist_name, momentum_tier, risk_level, days_since_last_post, " +
        "avg_views_30d, avg_saves_30d, delta_avg_views_pct, latest_release_name, " +
        "latest_release_date, risk_flags, label_name",
      )
      .eq("label_id", labelId)
      .order("avg_views_30d", { ascending: false }),

    // All weekly_pulse results (the per-artist AI briefs)
    supabase
      .from("artist_intelligence")
      .select(
        "artist_handle, artist_name, weekly_pulse, weekly_pulse_generated_at, latest_release",
      )
      .eq("label_id", labelId),

    // Recent anomalies
    supabase
      .from("content_anomalies" as string)
      .select("*")
      .eq("label_id", labelId)
      .order("detected_at", { ascending: false })
      .limit(20),
  ]);

  const roster = (rosterRes.data || []) as Array<Record<string, unknown>>;
  const intelligence = (intelligenceRes.data || []) as Array<Record<string, unknown>>;
  const anomalies = (anomaliesRes.data || []) as Array<Record<string, unknown>>;
  const labelName = (roster[0]?.label_name as string) || "Unknown Label";

  const contextParts: string[] = [];

  // Date
  contextParts.push(`TODAY: ${new Date().toISOString().split("T")[0]}`);
  contextParts.push(`LABEL: ${labelName} (${roster.length} artists)`);

  // Roster summary stats
  const healthy = roster.filter((a) => a.risk_level === "ok" || a.risk_level === "low").length;
  const atRisk = roster.filter((a) => a.risk_level === "critical" || a.risk_level === "warning").length;
  const inPushWindow = roster.filter((a) => {
    const date = a.latest_release_date as string;
    if (!date) return false;
    const age = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return age <= 30;
  }).length;
  const withSaves = roster.filter((a) => (a.avg_saves_30d as number) > 0 && (a.avg_views_30d as number) > 0);
  const avgSaveRate = withSaves.length > 0
    ? withSaves.reduce((s, a) => s + ((a.avg_saves_30d as number) / (a.avg_views_30d as number)) * 100, 0) / withSaves.length
    : null;

  contextParts.push(
    `ROSTER HEALTH: ${healthy} healthy, ${atRisk} at-risk, ${inPushWindow} in active push window` +
    (avgSaveRate != null ? `, avg save rate: ${avgSaveRate.toFixed(1)}%` : ""),
  );

  // Per-artist briefs from the focus picker
  contextParts.push("\n═══ INDIVIDUAL ARTIST BRIEFS (from per-artist AI analysis) ═══");

  for (const intel of intelligence) {
    const wp = intel.weekly_pulse as Record<string, unknown> | null;
    const rosterRow = roster.find(
      (r) => r.artist_handle === intel.artist_handle,
    );
    if (!wp) continue;

    const fs = wp.focused_sound as Record<string, string> | undefined;
    const ca = wp.catalogue_alert as Record<string, string> | undefined;

    const parts: string[] = [];
    parts.push(`\n--- ${intel.artist_name} (@${intel.artist_handle}) ---`);

    // Key metrics from roster
    if (rosterRow) {
      const metrics: string[] = [];
      metrics.push(`momentum: ${rosterRow.momentum_tier}`);
      metrics.push(`risk: ${rosterRow.risk_level}`);
      if (rosterRow.days_since_last_post != null) metrics.push(`${rosterRow.days_since_last_post}d since post`);
      if (rosterRow.avg_views_30d != null) metrics.push(`${Math.round(rosterRow.avg_views_30d as number).toLocaleString()} avg views`);
      if (rosterRow.avg_saves_30d != null && (rosterRow.avg_saves_30d as number) > 0 && rosterRow.avg_views_30d != null) {
        const sr = ((rosterRow.avg_saves_30d as number) / (rosterRow.avg_views_30d as number) * 100);
        metrics.push(`save rate: ${sr.toFixed(1)}%`);
      }
      if (rosterRow.delta_avg_views_pct != null) metrics.push(`velocity: ${(rosterRow.delta_avg_views_pct as number) > 0 ? "+" : ""}${(rosterRow.delta_avg_views_pct as number).toFixed(0)}%`);
      if (rosterRow.latest_release_name) {
        const age = Math.floor((Date.now() - new Date(rosterRow.latest_release_date as string).getTime()) / (1000 * 60 * 60 * 24));
        metrics.push(`latest: "${rosterRow.latest_release_name}" (${age}d ago${age <= 30 ? ", IN PUSH WINDOW" : ""})`);
      }
      parts.push(`Metrics: ${metrics.join(", ")}`);

      // Risk flags
      const flags = rosterRow.risk_flags as Array<Record<string, unknown>> | null;
      if (flags && flags.length > 0) {
        parts.push(`Risk flags: ${flags.map((f) => `${f.type}(${f.severity})`).join(", ")}`);
      }
    }

    // AI-generated focus (condensed — full detail already analyzed by per-artist agent)
    if (fs) {
      parts.push(`FOCUS: "${fs.title}" — ${(fs.reason || "").slice(0, 180)}`);
      parts.push(`  Action: ${(fs.action || "").slice(0, 150)}`);
    }

    if (ca) {
      parts.push(`CATALOG: "${ca.title}" — ${(ca.reason || "").slice(0, 150)}`);
    }

    contextParts.push(parts.join("\n"));
  }

  // Anomalies — only include high-severity ones to save context space
  const criticalAnomalies = anomalies.filter((a) => a.severity === "highlight");
  if (criticalAnomalies.length > 0) {
    contextParts.push("\n═══ CRITICAL ANOMALIES ═══");
    for (const a of criticalAnomalies.slice(0, 5)) {
      contextParts.push(`${a.artist_handle}: ${a.anomaly_type} — ${((a.insight_message as string) || "").slice(0, 100)}`);
    }
  }

  return { context: contextParts.join("\n"), labelName };
}

// ── Main ───────────────────────────────────────────────
// Uses EdgeRuntime.waitUntil() to run Opus 4.6 + extended thinking
// in the background (up to 400s on Pro), returning 202 immediately.

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

    if (!anthropicApiKey) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { label_id } = body;

    if (!label_id) {
      return jsonResponse({ error: "label_id required" }, 400);
    }

    // ── Background task with loud logging ──
    const backgroundTask = (async () => {
      const supabase = createClient(supabaseUrl, serviceKey);
      const startTime = Date.now();

      try {
        console.log("=== [Signal Report BG] STARTED ===");
        console.log(`  label_id: ${label_id}`);
        console.log(`  timestamp: ${new Date().toISOString()}`);

        // Write processing marker to DB (upsert to handle existing row for today)
        const briefDate = new Date().toISOString().split("T")[0];
        const { error: markerErr } = await supabase
          .from("president_briefs")
          .upsert(
            {
              label_id,
              role: "content",
              brief_date: briefDate,
              brief_text: "__PROCESSING__",
              brief_json: { status: "processing", started_at: new Date().toISOString() },
              generated_at: new Date().toISOString(),
            },
            { onConflict: "label_id,role,brief_date" },
          );
        console.log(`  Processing marker: ${markerErr ? "FAILED " + markerErr.message : "written"}`);

        // Build context
        console.log("  Building context...");
        const { context, labelName } = await buildSignalReportContext(supabase, label_id);
        console.log(`  Context built for ${labelName} (${context.length} chars, ${((Date.now() - startTime) / 1000).toFixed(1)}s elapsed)`);

        // Call Opus with extended thinking
        console.log("  Calling Opus 4.6 with 10K thinking budget...");
        const report = await callOpus(context, anthropicApiKey);
        console.log(`  Opus responded (${((Date.now() - startTime) / 1000).toFixed(1)}s elapsed)`);

        if (!report.generated_at) {
          report.generated_at = new Date().toISOString();
        }

        // Store final report (upsert overwrites processing marker)
        const { error: storeError } = await supabase
          .from("president_briefs")
          .upsert(
            {
              label_id,
              role: "content",
              brief_date: briefDate,
              brief_text: (report.headline as string) || "",
              brief_json: report,
              generated_at: report.generated_at || new Date().toISOString(),
            },
            { onConflict: "label_id,role,brief_date" },
          );

        if (storeError) {
          console.error(`  Store FAILED: ${storeError.message}`);
        } else {
          console.log(`  Report STORED successfully`);
        }

        const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`=== [Signal Report BG] COMPLETED in ${totalSec}s ===`);
      } catch (err: unknown) {
        const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const errMsg = err instanceof Error ? err.message : String(err);
        const errStack = err instanceof Error ? err.stack : "no stack";
        console.error(`=== [Signal Report BG] CRASHED after ${totalSec}s ===`);
        console.error(`  Error: ${errMsg}`);
        console.error(`  Stack: ${errStack}`);

        // Write error to DB so we can see it from the frontend
        const errDate = new Date().toISOString().split("T")[0];
        await supabase
          .from("president_briefs")
          .upsert(
            {
              label_id,
              role: "content",
              brief_date: errDate,
              brief_text: `__ERROR__: ${errMsg.slice(0, 200)}`,
              brief_json: { error: true, message: errMsg, elapsed_sec: totalSec },
              generated_at: new Date().toISOString(),
            },
            { onConflict: "label_id,role,brief_date" },
          )
          .then(() => console.log("  Error state written to DB"))
          .catch((e: unknown) => console.error("  Failed to write error state:", e));
      }
    })();

    // Keep the worker alive after response using EdgeRuntime.waitUntil
    // deno-lint-ignore no-explicit-any
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime?.waitUntil) {
      console.log("[Signal Report] EdgeRuntime.waitUntil IS available — using it");
      runtime.waitUntil(backgroundTask);
    } else {
      console.warn("[Signal Report] EdgeRuntime.waitUntil NOT available — task may be killed after response");
      // Still fire the promise — Deno might keep the isolate alive for pending promises
      backgroundTask.catch((e: unknown) => console.error("Unhandled bg error:", e));
    }

    // Return 202 immediately
    return jsonResponse(
      {
        status: "processing",
        label_id,
        message: "Signal Report generating with extended thinking. Results stored in president_briefs.",
      },
      202,
    );
  } catch (err) {
    console.error("generate-signal-report error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});

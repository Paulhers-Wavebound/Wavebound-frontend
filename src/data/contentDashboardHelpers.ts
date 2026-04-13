/* ─── Content & Social Dashboard — Types & Pure Helpers ─── */

// ─── Types ────────────────────────────────────────────────

export interface ContentArtist {
  // From roster_dashboard_metrics
  artist_handle: string;
  artist_name: string;
  avatar_url: string | null;
  label_id: string | null;
  momentum_tier: string | null;
  days_since_last_post: number | null;
  posting_freq_30d: number | null;
  posting_freq_7d: number | null;
  avg_views_30d: number | null;
  avg_views_7d: number | null;
  avg_engagement_30d: number | null;
  avg_engagement_7d: number | null;
  delta_avg_views_pct: number | null;
  delta_engagement_pct: number | null;
  delta_followers_pct: number | null;
  total_videos: number | null;
  risk_flags: Array<{ severity: string; message: string }> | null;
  risk_level: string | null;
  tiktok_followers: number | null;
  instagram_followers: number | null;
  median_views_baseline: number | null;
  has_content_plan: boolean;
  has_intelligence_report: boolean;
  has_30day_plan: boolean;
  // From artist_content_dna (joined)
  primary_genre: string | null;
  best_format: string | null;
  best_format_vs_median: number | null;
  worst_format: string | null;
  avg_hook_score: number | null;
  avg_viral_score: number | null;
  signature_style: string | null;
  dominant_mood: string | null;
  // From artist_content_evolution (joined)
  performance_trend: string | null;
  strategy_label: string | null;
  format_shift: boolean | null;
  views_change_pct: number | null;
  recent_top_format: string | null;
  prior_top_format: string | null;
  // From tiktok_video_summary (joined)
  posting_cadence: string | null;
  consistency_score: number | null;
  avg_engagement_rate: number | null;
  plays_trend_pct: number | null;
  engagement_trend_pct: number | null;
  // From wb_comment_sentiment (joined)
  sentiment_score: number | null;
  fan_energy: number | null;
  // From artist_sound_velocity (joined)
  top_sound_title: string | null;
  top_sound_new_ugc: number | null;
  top_sound_total_ugc: number | null;
  sound_velocity: string | null;
  sounds_tracked: number | null;
  // Calculated: Save-to-Reach conversion ratio
  avg_saves_30d: number | null;
  save_to_reach_pct: number | null;
  // From artist_intelligence.weekly_pulse (Layer 3 AI judgment)
  weekly_pulse: {
    focused_sound?: { title: string; reason: string; action: string };
    catalogue_alert?: {
      title: string;
      delta: string;
      reason: string;
      action: string;
    };
  } | null;
  weekly_pulse_generated_at: string | null;
}

export type ContentPriorityType =
  | "POSTING_DROUGHT"
  | "CONTENT_SPIKE"
  | "ENGAGEMENT_DROP"
  | "FORMAT_SHIFT"
  | "UGC_SURGE";

export interface ContentPriorityItem {
  type: ContentPriorityType;
  artist_handle: string;
  artist_name: string;
  headline: string;
  detail: string;
  accent: string;
  stats: { label: string; value: string; color?: string }[];
}

export interface SongUGC {
  song_name: string;
  artist_name: string | null;
  tiktok_video_count: number;
  total_tiktok_plays: number;
  unique_creators: number;
  fan_videos: number;
  fan_to_artist_ratio: number;
  tiktok_status: string | null;
  cross_platform_gap: string | null;
  videos_last_7d: number | null;
  videos_last_30d: number | null;
  tiktok_music_id: string | null;
}

export interface ContentAnomaly {
  artist_handle: string;
  anomaly_type: string;
  anomaly_direction: string;
  metric_name: string;
  metric_value: number | null;
  baseline_median: number | null;
  baseline_avg: number | null;
  deviation_pct: number | null;
  deviation_multiple: number | null;
  insight_message: string;
  severity: string;
  scan_date: string;
  seen: boolean;
}

export interface ContentBriefing {
  greeting: string;
  paragraphs: string[];
  actions: string[];
  /** When all actions are for one artist, this holds the name (shown as header) */
  actionsArtist?: string | null;
  summary: string;
}

export type ContentFilter =
  | "all"
  | "posting_gap"
  | "top_performers"
  | "declining"
  | "format_shift"
  | "ugc_surge";

export type ContentSortKey =
  | "content_health"
  | "performance"
  | "format_alpha"
  | "top_sound"
  | "activity"
  | "artist";

// ─── Formatting helpers ───────────────────────────────────

export function fmtViews(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return Math.round(n).toLocaleString();
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}%`;
}

export function fmtFreq(postsPerWeek: number | null | undefined): string {
  if (postsPerWeek == null) return "—";
  if (postsPerWeek >= 7) return `${Math.round(postsPerWeek / 7)}x/day`;
  if (postsPerWeek >= 1) return `${postsPerWeek.toFixed(1)}x/wk`;
  return `${(postsPerWeek * 4).toFixed(1)}x/mo`;
}

// ─── Save-to-Reach helpers (Bible §9 benchmarks) ────────

export function saveToReachColor(pct: number | null): string {
  if (pct == null) return "rgba(255,255,255,0.30)";
  if (pct >= 5.0) return "#BF5AF2"; // purple — exceptional
  if (pct >= 1.5) return "#30D158"; // green — healthy
  if (pct >= 0.8) return "#FFD60A"; // yellow — fair
  return "#FF453A"; // red — low
}

export function saveToReachLabel(pct: number | null): string {
  if (pct == null) return "—";
  if (pct >= 5.0) return "Exceptional";
  if (pct >= 1.5) return "Healthy";
  if (pct >= 0.8) return "Fair";
  return "Low";
}

// ─── Tier grouping (Bible §10 artist tiering) ───────────

export type TierGroup = "breakout" | "momentum" | "catalog";

export function getTierGroup(tier: string | null): TierGroup {
  if (tier === "viral" || tier === "breakout") return "breakout";
  if (tier === "momentum") return "momentum";
  return "catalog"; // stable, stalled, null
}

// ─── Normalizer ───────────────────────────────────────────

export function normalizeHandle(h: string | null | undefined): string {
  return (h || "").trim().toLowerCase().replace(/^@+/, "");
}

// ─── Greeting ─────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Priority Builder ─────────────────────────────────────

const PRIORITY_ORDER: Record<ContentPriorityType, number> = {
  POSTING_DROUGHT: 0,
  ENGAGEMENT_DROP: 1,
  CONTENT_SPIKE: 2,
  FORMAT_SHIFT: 3,
  UGC_SURGE: 4,
};

export function buildPriorityItems(
  artists: ContentArtist[],
  anomalies: ContentAnomaly[],
  songUGC?: SongUGC[],
): ContentPriorityItem[] {
  const items: ContentPriorityItem[] = [];

  // POSTING_DROUGHT: artists with >= 7 days since last post
  for (const a of artists) {
    if (a.days_since_last_post != null && a.days_since_last_post >= 7) {
      const freq = a.posting_freq_30d
        ? fmtFreq(a.posting_freq_30d / 4)
        : "unknown";
      items.push({
        type: "POSTING_DROUGHT",
        artist_handle: a.artist_handle,
        artist_name: a.artist_name,
        headline: `No posts in ${a.days_since_last_post} days`,
        detail: `Usually posts ${freq}. Content staling.`,
        accent: "#FF453A",
        stats: [
          {
            label: "Days Silent",
            value: `${a.days_since_last_post}`,
            color: "#FF453A",
          },
          { label: "Usual Freq", value: freq },
          {
            label: "Views Trend",
            value: fmtPct(a.delta_avg_views_pct),
            color:
              a.delta_avg_views_pct != null && a.delta_avg_views_pct < 0
                ? "#FF453A"
                : undefined,
          },
        ],
      });
    }
  }

  // Build artist name lookup for anomalies
  const nameMap = new Map(
    artists.map((a) => [normalizeHandle(a.artist_handle), a.artist_name]),
  );

  // CONTENT_SPIKE: anomalies with views_spike and highlight severity
  for (const an of anomalies) {
    if (
      an.anomaly_type === "views_spike" &&
      (an.severity === "highlight" || an.severity === "normal")
    ) {
      const name =
        nameMap.get(normalizeHandle(an.artist_handle)) || an.artist_handle;
      items.push({
        type: "CONTENT_SPIKE",
        artist_handle: an.artist_handle,
        artist_name: name,
        headline: `Viral video — ${an.deviation_multiple?.toFixed(1) || "?"}x above median`,
        detail: an.insight_message,
        accent: "#30D158",
        stats: [
          {
            label: "Views",
            value: fmtViews(an.metric_value),
            color: "#30D158",
          },
          {
            label: "vs Median",
            value: `${an.deviation_multiple?.toFixed(1) || "?"}x`,
          },
          { label: "Baseline", value: fmtViews(an.baseline_median) },
        ],
      });
    }
  }

  // ENGAGEMENT_DROP: anomalies with engagement_drop
  for (const an of anomalies) {
    if (an.anomaly_type === "engagement_drop") {
      const name =
        nameMap.get(normalizeHandle(an.artist_handle)) || an.artist_handle;
      items.push({
        type: "ENGAGEMENT_DROP",
        artist_handle: an.artist_handle,
        artist_name: name,
        headline: `Engagement down ${Math.abs(an.deviation_pct || 0).toFixed(0)}%`,
        detail: an.insight_message,
        accent: "#FF9F0A",
        stats: [
          {
            label: "Engagement",
            value: `${an.metric_value?.toFixed(2) || "?"}%`,
            color: "#FF9F0A",
          },
          {
            label: "Baseline",
            value: `${an.baseline_avg?.toFixed(2) || "?"}%`,
          },
          {
            label: "Change",
            value: fmtPct(
              an.deviation_pct ? -Math.abs(an.deviation_pct) : null,
            ),
            color: "#FF453A",
          },
        ],
      });
    }
  }

  // FORMAT_SHIFT: artists where format_shift is true
  for (const a of artists) {
    if (a.format_shift && a.prior_top_format && a.recent_top_format) {
      items.push({
        type: "FORMAT_SHIFT",
        artist_handle: a.artist_handle,
        artist_name: a.artist_name,
        headline: `Shifted from ${a.prior_top_format} to ${a.recent_top_format}`,
        detail: a.strategy_label || "Content strategy changed",
        accent: "#0A84FF",
        stats: [
          { label: "Was", value: a.prior_top_format },
          { label: "Now", value: a.recent_top_format, color: "#0A84FF" },
          {
            label: "Views",
            value: fmtPct(a.views_change_pct),
            color:
              a.views_change_pct != null && a.views_change_pct > 0
                ? "#30D158"
                : "#FF453A",
          },
        ],
      });
    }
  }

  // UGC_SURGE: songs with high fan-to-artist ratio and recent activity
  if (songUGC) {
    for (const song of songUGC) {
      if (
        song.fan_to_artist_ratio >= 3 &&
        (song.videos_last_7d ?? 0) > 0 &&
        (song.tiktok_status === "viral" || song.tiktok_status === "trending")
      ) {
        items.push({
          type: "UGC_SURGE",
          artist_handle: song.artist_name || "unknown",
          artist_name: song.artist_name || "Unknown",
          headline: `"${song.song_name}" UGC surging — ${song.tiktok_status}`,
          detail: `${song.unique_creators} creators, ${song.videos_last_7d} new videos this week`,
          accent: "#BF5AF2",
          stats: [
            {
              label: "Fan Videos",
              value: `${song.fan_videos}`,
              color: "#BF5AF2",
            },
            { label: "Creators", value: `${song.unique_creators}` },
            {
              label: "Plays",
              value: fmtViews(song.total_tiktok_plays),
              color: "#30D158",
            },
          ],
        });
        break; // Only one UGC card
      }
    }
  }

  // Sort by priority type, then by severity within type
  items.sort((a, b) => PRIORITY_ORDER[a.type] - PRIORITY_ORDER[b.type]);

  return items.slice(0, 5);
}

// ─── Briefing Generator ───────────────────────────────────

export function generateContentBriefing(
  artists: ContentArtist[],
  anomalies: ContentAnomaly[],
  labelName: string,
): ContentBriefing {
  const greeting = getGreeting();
  const paragraphs: string[] = [];
  const actions: string[] = [];

  // Posting health overview
  const droughtArtists = artists.filter(
    (a) => a.days_since_last_post != null && a.days_since_last_post >= 7,
  );
  const activeArtists = artists.filter(
    (a) => a.days_since_last_post != null && a.days_since_last_post < 3,
  );
  const totalWithData = artists.filter(
    (a) => a.days_since_last_post != null,
  ).length;

  if (totalWithData > 0) {
    const parts: string[] = [];
    parts.push(
      `Across your ${artists.length} artists, ${activeArtists.length} posted in the last 3 days`,
    );
    if (droughtArtists.length > 0) {
      const worstDrought = droughtArtists.sort(
        (a, b) => (b.days_since_last_post || 0) - (a.days_since_last_post || 0),
      )[0];
      parts.push(
        `${droughtArtists.length} ${droughtArtists.length === 1 ? "has" : "have"} posting gaps of 7+ days. ${worstDrought.artist_name} leads at ${worstDrought.days_since_last_post} days silent`,
      );
    } else {
      parts.push("no one has a posting gap beyond 7 days");
    }
    paragraphs.push(parts.join(", and ") + ".");
  }

  // Performance highlights
  const improving = artists.filter(
    (a) => a.delta_avg_views_pct != null && a.delta_avg_views_pct > 20,
  );
  const declining = artists.filter(
    (a) => a.delta_avg_views_pct != null && a.delta_avg_views_pct < -20,
  );

  if (improving.length > 0 || declining.length > 0) {
    const parts: string[] = [];
    if (improving.length > 0) {
      const best = improving.sort(
        (a, b) => (b.delta_avg_views_pct || 0) - (a.delta_avg_views_pct || 0),
      )[0];
      parts.push(
        `${best.artist_name}'s content is surging — views up ${best.delta_avg_views_pct?.toFixed(0)}% this month${best.best_format ? `, led by ${best.best_format} format` : ""}`,
      );
    }
    if (declining.length > 0) {
      const worst = declining.sort(
        (a, b) => (a.delta_avg_views_pct || 0) - (b.delta_avg_views_pct || 0),
      )[0];
      parts.push(
        `${worst.artist_name}'s views are down ${Math.abs(worst.delta_avg_views_pct || 0).toFixed(0)}% — may need a format refresh`,
      );
    }
    paragraphs.push(parts.join(". Meanwhile, ") + ".");
  }

  // Content anomaly spikes
  const spikes = anomalies.filter(
    (a) =>
      a.anomaly_type === "views_spike" &&
      (a.severity === "highlight" || a.severity === "normal"),
  );
  if (spikes.length > 0) {
    const top = spikes[0];
    const name =
      artists.find(
        (a) =>
          normalizeHandle(a.artist_handle) ===
          normalizeHandle(top.artist_handle),
      )?.artist_name || top.artist_handle;
    paragraphs.push(
      `${name} has a breakout video at ${top.deviation_multiple?.toFixed(1) || "?"}x their median views. Worth studying what worked and replicating the format.`,
    );
  }

  // Recommended actions
  if (droughtArtists.length > 0) {
    const top = droughtArtists[0];
    actions.push(
      `Check in on ${top.artist_name}'s posting drought \u2014 ${top.days_since_last_post} days silent.`,
    );
  }
  if (improving.length > 0) {
    const best = improving[0];
    actions.push(
      `Double down on ${best.artist_name}'s momentum \u2014 views up ${best.delta_avg_views_pct?.toFixed(0)}%${best.best_format ? `, ${best.best_format} format` : ""}.`,
    );
  }
  if (declining.length > 0) {
    const worst = declining.sort(
      (a, b) => (a.delta_avg_views_pct || 0) - (b.delta_avg_views_pct || 0),
    )[0];
    actions.push(
      `Review ${worst.artist_name}'s content strategy \u2014 engagement declining.`,
    );
  }
  if (spikes.length > 0) {
    const top = spikes[0];
    const name =
      artists.find(
        (a) =>
          normalizeHandle(a.artist_handle) ===
          normalizeHandle(top.artist_handle),
      )?.artist_name || top.artist_handle;
    actions.push(`Analyze ${name}'s viral video and replicate the format.`);
  }

  // Summary
  const summary =
    droughtArtists.length > 0
      ? `${droughtArtists.length} posting gap${droughtArtists.length > 1 ? "s" : ""} need attention. ${activeArtists.length} artists actively posting.`
      : `All clear \u2014 ${activeArtists.length} of ${artists.length} artists posted in the last 3 days.`;

  return {
    greeting,
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : [
            "Your roster's content health looks stable. No urgent issues detected.",
          ],
    actions:
      actions.length > 0
        ? actions
        : ["Review content plans for upcoming releases."],
    summary,
  };
}

// ─── Signal Report (Bible §3: replaces 08:00-10:00 manual triage) ─

/**
 * Decision point categories from the Bible's decision taxonomy (§4).
 * Each maps to a specific type of action the strategist takes.
 */
export type DecisionCategory =
  | "BUDGET_REALLOCATION" // Shift spend to high-performing content
  | "FORMAT_PIVOT" // Switch content format based on data
  | "CRISIS_RESPONSE" // Risk flags, suppression, fraud
  | "CATALOG_ACTIVATION" // Legacy track gaining organic traction
  | "CONTENT_PIPELINE" // Posting drought, missing content plans
  | "MOMENTUM_CAPTURE" // Breakout happening, scale immediately
  | "CONVERSION_ALERT"; // High views but low save rate (Viral Mirage)

export interface DecisionPoint {
  /**
   * Deterministic UUIDv5 from the backend generator (generate-signal-report.ts).
   * Optional because briefs generated before 2026-04-12 don't have it. When
   * present, `decisionPointKey()` prefers it over the synthesized fallback.
   */
  id?: string;
  /** Which decision category from the Bible taxonomy */
  category: DecisionCategory;
  /** The artist this decision concerns */
  artist_name: string;
  artist_handle: string;
  /** Artist avatar for visual identification */
  avatar_url: string | null;
  /** The signal: what happened / what was detected */
  signal: string;
  /** The decision: what the strategist needs to do — specific and actionable */
  decision: string;
  /** Urgency: how fast must this be acted on */
  urgency: "now" | "today" | "this_week";
  /** Key numbers backing the decision */
  evidence: { label: string; value: string; color?: string }[];
}

export interface SignalReportTodo {
  text: string;
  artist_name: string;
  avatar_url: string | null;
  category: DecisionCategory;
  urgency: "now" | "today" | "this_week";
}

export interface SignalReport {
  /** Date string for display */
  date: string;
  /** 1-2 sentence roster pulse: overall direction */
  rosterPulse: string;
  /** The 3-5 critical decision points — the core of the signal report */
  decisionPoints: DecisionPoint[];
  /** Risk alerts (critical/warning risk_flags across roster) */
  riskAlerts: {
    artist_name: string;
    avatar_url: string | null;
    message: string;
    severity: string;
  }[];
  /** Proposed TODO list derived from decision points */
  todos: SignalReportTodo[];
  /** Roster-level metrics for the header */
  metrics: {
    activeArtists: number;
    totalArtists: number;
    avgVelocityDelta: number;
    avgSaveRate: number | null;
    breakoutCount: number;
    atRiskCount: number;
  };
}

/**
 * Generate the Signal Report — the document that replaces the strategist's
 * 08:00-10:00 manual triage. This is what they'd present at the 10am standup.
 *
 * Uses ALL available data: roster metrics, anomalies, content DNA, sound velocity,
 * weekly pulse (Layer 3 AI), sentiment, risk flags, save rates, format shifts.
 */
export function generateSignalReport(
  artists: ContentArtist[],
  anomalies: ContentAnomaly[],
  songUGC: SongUGC[],
  labelName: string,
): SignalReport {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const decisionPoints: DecisionPoint[] = [];
  const nameMap = new Map(
    artists.map((a) => [normalizeHandle(a.artist_handle), a.artist_name]),
  );

  // ── Compute roster-level metrics ──────────────────────

  // delta_avg_views_pct is null/0 for the entire roster — backend pipeline
  // never populates it. Derive from avg_views_7d vs avg_views_30d instead,
  // which are populated. Tracked in backend-todo.md.
  const velocityDeltas = artists
    .map((a) =>
      a.avg_views_7d != null && a.avg_views_30d != null && a.avg_views_30d > 0
        ? ((a.avg_views_7d - a.avg_views_30d) / a.avg_views_30d) * 100
        : null,
    )
    .filter((v): v is number => v != null);
  const avgVelocityDelta =
    velocityDeltas.length > 0
      ? velocityDeltas.reduce((s, v) => s + v, 0) / velocityDeltas.length
      : 0;

  const withSaveRate = artists.filter((a) => a.save_to_reach_pct != null);
  const avgSaveRate =
    withSaveRate.length > 0
      ? withSaveRate.reduce((s, a) => s + (a.save_to_reach_pct ?? 0), 0) /
        withSaveRate.length
      : null;

  const activeArtists = artists.filter(
    (a) => a.days_since_last_post != null && a.days_since_last_post < 3,
  ).length;

  const breakoutCount = artists.filter(
    (a) => a.momentum_tier === "viral" || a.momentum_tier === "breakout",
  ).length;

  const atRiskCount = artists.filter(
    (a) =>
      a.risk_level === "critical" ||
      a.risk_level === "warning" ||
      a.momentum_tier === "stalled",
  ).length;

  // ── Roster Pulse ──────────────────────────────────────

  const direction =
    avgVelocityDelta > 5 ? "up" : avgVelocityDelta < -5 ? "down" : "steady";
  const directionPhrase =
    direction === "up"
      ? `trending up ${Math.abs(avgVelocityDelta).toFixed(0)}% WoW`
      : direction === "down"
        ? `trending down ${Math.abs(avgVelocityDelta).toFixed(0)}% WoW`
        : "holding steady WoW";

  const pulseDetails: string[] = [];
  pulseDetails.push(
    `${activeArtists} of ${artists.length} artists actively posting`,
  );
  if (breakoutCount > 0) {
    pulseDetails.push(`${breakoutCount} in breakout momentum`);
  }
  if (atRiskCount > 0) {
    pulseDetails.push(`${atRiskCount} need attention`);
  }

  const rosterPulse = `Roster velocity ${directionPhrase}. ${pulseDetails.join(", ")}.`;

  // ── Decision Point 1: MOMENTUM CAPTURE ────────────────
  // Artists with breakout velocity — scale immediately

  const surging = artists
    .filter((a) => a.delta_avg_views_pct != null && a.delta_avg_views_pct > 25)
    .sort(
      (a, b) => (b.delta_avg_views_pct || 0) - (a.delta_avg_views_pct || 0),
    );

  for (const a of surging.slice(0, 2)) {
    const evidence: DecisionPoint["evidence"] = [
      {
        label: "Views",
        value: fmtPct(a.delta_avg_views_pct),
        color: "#30D158",
      },
    ];
    if (a.best_format) {
      evidence.push({
        label: "Top Format",
        value: a.best_format,
      });
      if (a.best_format_vs_median != null && a.best_format_vs_median > 1) {
        evidence.push({
          label: "vs Median",
          value: `${a.best_format_vs_median.toFixed(1)}x`,
          color: "#30D158",
        });
      }
    }
    if (a.save_to_reach_pct != null) {
      evidence.push({
        label: "Save Rate",
        value: `${a.save_to_reach_pct.toFixed(1)}%`,
        color: saveToReachColor(a.save_to_reach_pct),
      });
    }

    decisionPoints.push({
      category: "MOMENTUM_CAPTURE",
      artist_name: a.artist_name,
      artist_handle: a.artist_handle,
      avatar_url: a.avatar_url,
      signal: `Content velocity up ${a.delta_avg_views_pct?.toFixed(0)}%${a.best_format ? ` — ${a.best_format} format is driving it` : ""}`,
      decision: a.best_format
        ? `${a.best_format} content outperforming${a.best_format_vs_median != null && a.best_format_vs_median > 1 ? ` at ${a.best_format_vs_median.toFixed(1)}x median` : ""} — evaluate scaling this format.`
        : `Velocity spike detected — review which content is driving it.`,
      urgency: "now",
      evidence,
    });
  }

  // ── Decision Point 2: BUDGET REALLOCATION via anomaly spikes ─

  const spikes = anomalies.filter(
    (a) =>
      a.anomaly_type === "views_spike" &&
      (a.severity === "highlight" || a.severity === "normal"),
  );

  for (const spike of spikes.slice(0, 1)) {
    const artistName =
      nameMap.get(normalizeHandle(spike.artist_handle)) || spike.artist_handle;
    const artist = artists.find(
      (a) =>
        normalizeHandle(a.artist_handle) ===
        normalizeHandle(spike.artist_handle),
    );

    // Don't duplicate if already captured by MOMENTUM_CAPTURE
    if (
      surging.some(
        (s) =>
          normalizeHandle(s.artist_handle) ===
          normalizeHandle(spike.artist_handle),
      )
    )
      continue;

    const evidence: DecisionPoint["evidence"] = [
      {
        label: "Views",
        value: fmtViews(spike.metric_value),
        color: "#30D158",
      },
      {
        label: "vs Median",
        value: `${spike.deviation_multiple?.toFixed(1) || "?"}x`,
      },
    ];
    if (artist?.best_format) {
      evidence.push({ label: "Format", value: artist.best_format });
    }

    decisionPoints.push({
      category: "BUDGET_REALLOCATION",
      artist_name: artistName,
      artist_handle: spike.artist_handle,
      avatar_url: artist?.avatar_url ?? null,
      signal: `Breakout video at ${spike.deviation_multiple?.toFixed(1) || "?"}x median views. ${spike.insight_message}`,
      decision: `Breakout video detected — review the hook and format. Algorithm is currently favoring this content.`,
      urgency: "now",
      evidence,
    });
  }

  // ── Decision Point 3: FORMAT PIVOT ────────────────────
  // Artists with declining views who have a clear best format they're not using

  const declining = artists
    .filter(
      (a) =>
        a.delta_avg_views_pct != null &&
        a.delta_avg_views_pct < -15 &&
        a.best_format != null,
    )
    .sort(
      (a, b) => (a.delta_avg_views_pct || 0) - (b.delta_avg_views_pct || 0),
    );

  for (const a of declining.slice(0, 1)) {
    const evidence: DecisionPoint["evidence"] = [
      {
        label: "Views",
        value: fmtPct(a.delta_avg_views_pct),
        color: "#FF453A",
      },
    ];
    if (a.best_format) {
      evidence.push({ label: "Best Format", value: a.best_format });
    }
    if (a.worst_format) {
      evidence.push({
        label: "Worst Format",
        value: a.worst_format,
        color: "#FF453A",
      });
    }
    if (a.avg_hook_score != null) {
      evidence.push({
        label: "Hook Score",
        value: `${Math.round(a.avg_hook_score)}/100`,
      });
    }

    const hasFormatShift = a.format_shift && a.prior_top_format;
    decisionPoints.push({
      category: "FORMAT_PIVOT",
      artist_name: a.artist_name,
      artist_handle: a.artist_handle,
      avatar_url: a.avatar_url,
      signal: `Views down ${Math.abs(a.delta_avg_views_pct || 0).toFixed(0)}%.${hasFormatShift ? ` Recently shifted from ${a.prior_top_format} to ${a.recent_top_format}.` : ""}`,
      decision: `${a.best_format} format performing at ${a.best_format_vs_median != null && a.best_format_vs_median > 1 ? `${a.best_format_vs_median.toFixed(1)}x median` : "above average"} while ${a.worst_format || "other formats"} underperforming — review format mix.`,
      urgency: "today",
      evidence,
    });
  }

  // ── Decision Point 4: CATALOG ACTIVATION ──────────────
  // Sounds gaining organic UGC traction (from weekly_pulse or sound velocity)

  const catalogActivations = artists.filter(
    (a) =>
      a.weekly_pulse?.catalogue_alert != null ||
      (a.sound_velocity === "up" &&
        a.top_sound_new_ugc != null &&
        a.top_sound_new_ugc > 5 &&
        getTierGroup(a.momentum_tier) === "catalog"),
  );

  for (const a of catalogActivations.slice(0, 1)) {
    const catAlert = a.weekly_pulse?.catalogue_alert;
    const evidence: DecisionPoint["evidence"] = [];

    if (catAlert) {
      evidence.push({
        label: "Sound",
        value: catAlert.title,
      });
      evidence.push({
        label: "Delta",
        value: catAlert.delta,
        color: "#30D158",
      });
    } else {
      if (a.top_sound_title) {
        evidence.push({ label: "Sound", value: a.top_sound_title });
      }
      if (a.top_sound_new_ugc != null) {
        evidence.push({
          label: "New UGC",
          value: `+${fmtViews(a.top_sound_new_ugc)}`,
          color: "#30D158",
        });
      }
    }

    decisionPoints.push({
      category: "CATALOG_ACTIVATION",
      artist_name: a.artist_name,
      artist_handle: a.artist_handle,
      avatar_url: a.avatar_url,
      signal: catAlert
        ? `${catAlert.title}: ${catAlert.reason}`
        : `"${a.top_sound_title}" — +${fmtViews(a.top_sound_new_ugc)} new UGC videos this week.`,
      decision:
        catAlert?.action ||
        `Catalog track showing UGC momentum — evaluate whether to allocate content resources to this sound.`,
      urgency: "today",
      evidence,
    });
  }

  // ── Decision Point 5: CONTENT PIPELINE ────────────────
  // Posting droughts — artists who need content activation

  const droughts = artists
    .filter(
      (a) => a.days_since_last_post != null && a.days_since_last_post >= 7,
    )
    .sort(
      (a, b) => (b.days_since_last_post || 0) - (a.days_since_last_post || 0),
    );

  for (const a of droughts.slice(0, 1)) {
    const evidence: DecisionPoint["evidence"] = [
      {
        label: "Days Silent",
        value: `${a.days_since_last_post}`,
        color: "#FF453A",
      },
    ];
    if (a.posting_freq_30d != null) {
      evidence.push({
        label: "Usual Freq",
        value: fmtFreq(a.posting_freq_30d / 4),
      });
    }
    if (!a.has_content_plan) {
      evidence.push({
        label: "Content Plan",
        value: "Missing",
        color: "#FF453A",
      });
    }

    decisionPoints.push({
      category: "CONTENT_PIPELINE",
      artist_name: a.artist_name,
      artist_handle: a.artist_handle,
      avatar_url: a.avatar_url,
      signal: `Silent for ${a.days_since_last_post} days. ${!a.has_content_plan ? "No content plan on file." : "Has a content plan but not executing."}`,
      decision: !a.has_content_plan
        ? `No content plan on file and ${a.days_since_last_post} days inactive — needs attention.`
        : `Content plan exists but ${a.days_since_last_post} days without a post — check what's blocking execution.`,
      urgency: a.days_since_last_post! >= 14 ? "now" : "today",
      evidence,
    });
  }

  // ── Decision Point 6: CONVERSION ALERT (Viral Mirage) ─
  // High views but terrible save rate

  const viralMirages = artists
    .filter(
      (a) =>
        a.save_to_reach_pct != null &&
        a.save_to_reach_pct < 0.8 &&
        a.avg_views_30d != null &&
        a.avg_views_30d > 5000,
    )
    .sort((a, b) => (a.save_to_reach_pct || 0) - (b.save_to_reach_pct || 0));

  for (const a of viralMirages.slice(0, 1)) {
    const evidence: DecisionPoint["evidence"] = [
      {
        label: "Save Rate",
        value: `${a.save_to_reach_pct?.toFixed(1)}%`,
        color: "#FF453A",
      },
      {
        label: "Views",
        value: fmtViews(a.avg_views_30d),
      },
    ];
    if (a.best_format) {
      evidence.push({ label: "Format", value: a.best_format });
    }

    decisionPoints.push({
      category: "CONVERSION_ALERT",
      artist_name: a.artist_name,
      artist_handle: a.artist_handle,
      avatar_url: a.avatar_url,
      signal: `${fmtViews(a.avg_views_30d)} avg views but only ${a.save_to_reach_pct?.toFixed(1)}% save rate \u2014 Viral Mirage.`,
      decision: `${fmtViews(a.avg_views_30d)} avg views but ${a.save_to_reach_pct?.toFixed(1)}% save rate — content reaching audience but not converting to saves. Review hook strategy.`,
      urgency: "this_week",
      evidence,
    });
  }

  // ── AI-generated focus sounds as decision points ──────

  for (const a of artists) {
    if (a.weekly_pulse?.focused_sound && decisionPoints.length < 5) {
      // Don't duplicate artists already in decision points
      if (decisionPoints.some((dp) => dp.artist_handle === a.artist_handle))
        continue;

      const fs = a.weekly_pulse.focused_sound;
      decisionPoints.push({
        category: "MOMENTUM_CAPTURE",
        artist_name: a.artist_name,
        artist_handle: a.artist_handle,
        avatar_url: a.avatar_url,
        signal: fs.reason,
        decision: fs.action,
        urgency: "today",
        evidence: [{ label: "Focus Sound", value: fs.title }],
      });
    }
  }

  // ── Sort by urgency (now > today > this_week), cap at 5 ─

  const urgencyOrder: Record<string, number> = {
    now: 0,
    today: 1,
    this_week: 2,
  };
  decisionPoints.sort(
    (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency],
  );
  const topDecisions = decisionPoints.slice(0, 5);

  // ── Risk Alerts ───────────────────────────────────────

  const riskAlerts: SignalReport["riskAlerts"] = [];
  for (const a of artists) {
    if (a.risk_flags && a.risk_flags.length > 0) {
      for (const flag of a.risk_flags) {
        if (flag.severity === "critical" || flag.severity === "warning") {
          riskAlerts.push({
            artist_name: a.artist_name,
            avatar_url: a.avatar_url,
            message: flag.message,
            severity: flag.severity,
          });
        }
      }
    }
  }
  // Sort critical first
  riskAlerts.sort((a, b) =>
    a.severity === "critical" && b.severity !== "critical" ? -1 : 1,
  );

  // ── TODO List ─────────────────────────────────────────

  const todos: SignalReportTodo[] = topDecisions.map((dp) => ({
    text: dp.decision,
    artist_name: dp.artist_name,
    avatar_url: dp.avatar_url,
    category: dp.category,
    urgency: dp.urgency,
  }));

  // Add risk-related TODOs
  if (riskAlerts.length > 0) {
    const criticalRisks = riskAlerts.filter((r) => r.severity === "critical");
    if (criticalRisks.length > 0) {
      todos.unshift({
        text: `Investigate critical risk: ${criticalRisks[0].message}`,
        artist_name: criticalRisks[0].artist_name,
        avatar_url: criticalRisks[0].avatar_url,
        category: "CRISIS_RESPONSE",
        urgency: "now",
      });
    }
  }

  return {
    date: dateStr,
    rosterPulse,
    decisionPoints: topDecisions,
    riskAlerts: riskAlerts.slice(0, 5),
    todos: todos.slice(0, 7),
    metrics: {
      activeArtists,
      totalArtists: artists.length,
      avgVelocityDelta,
      avgSaveRate,
      breakoutCount,
      atRiskCount,
    },
  };
}

// ── Keep generatePDBBriefing for backward compat (text fallback) ──

export function generatePDBBriefing(
  artists: ContentArtist[],
  anomalies: ContentAnomaly[],
  labelName: string,
): string {
  const report = generateSignalReport(artists, anomalies, [], labelName);
  const parts = [report.rosterPulse];
  for (const dp of report.decisionPoints.slice(0, 3)) {
    parts.push(`${dp.artist_name}: ${dp.signal} ${dp.decision}`);
  }
  return `The Wavebound Brief (${report.date}): ${parts.join(". ")}`;
}

// ─── Insight Generator ────────────────────────────────────

export function generateContentInsight(
  artists: ContentArtist[],
  anomalies: ContentAnomaly[],
): string {
  const withData = artists.filter((a) => a.posting_cadence != null);
  const daily = withData.filter((a) => a.posting_cadence === "daily").length;
  const regular = withData.filter(
    (a) => a.posting_cadence === "regular",
  ).length;
  const sporadic = withData.filter(
    (a) => a.posting_cadence === "sporadic" || a.posting_cadence === "inactive",
  ).length;
  const dormant = withData.filter(
    (a) => a.posting_cadence === "dormant",
  ).length;

  const spikeCount = anomalies.filter(
    (a) => a.anomaly_type === "views_spike",
  ).length;

  const bestPerformer = artists
    .filter((a) => a.delta_avg_views_pct != null)
    .sort(
      (a, b) => (b.delta_avg_views_pct || 0) - (a.delta_avg_views_pct || 0),
    )[0];

  if (
    bestPerformer &&
    bestPerformer.delta_avg_views_pct != null &&
    bestPerformer.delta_avg_views_pct > 10
  ) {
    return `${daily + regular} of your ${artists.length} artists are posting consistently. ${bestPerformer.artist_name} leads with views up ${bestPerformer.delta_avg_views_pct.toFixed(0)}% this month${bestPerformer.best_format ? ` — driven by ${bestPerformer.best_format} format` : ""}. ${dormant > 0 ? `${dormant} ${dormant === 1 ? "artist is" : "artists are"} dormant.` : ""}`;
  }

  if (spikeCount > 0) {
    return `${spikeCount} content ${spikeCount === 1 ? "spike" : "spikes"} detected this week across your roster. ${daily + regular} artists posting consistently, ${sporadic + dormant} need attention.`;
  }

  return `${daily + regular} of ${artists.length} artists are posting consistently this week. ${sporadic > 0 ? `${sporadic} posting sporadically.` : ""} ${dormant > 0 ? `${dormant} dormant.` : "No dormant artists."}`;
}

// ─── Filter ───────────────────────────────────────────────

export const CONTENT_FILTER_TABS: { key: ContentFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "posting_gap", label: "Posting Gap" },
  { key: "top_performers", label: "Top Performers" },
  { key: "declining", label: "Declining" },
  { key: "format_shift", label: "Format Shift" },
  { key: "ugc_surge", label: "UGC Surge" },
];

export function filterContentArtists(
  artists: ContentArtist[],
  filter: ContentFilter,
): ContentArtist[] {
  switch (filter) {
    case "posting_gap":
      return artists.filter(
        (a) => a.days_since_last_post != null && a.days_since_last_post >= 5,
      );
    case "top_performers":
      return artists.filter(
        (a) =>
          (a.delta_avg_views_pct != null && a.delta_avg_views_pct > 15) ||
          a.performance_trend === "improving",
      );
    case "declining":
      return artists.filter(
        (a) =>
          (a.delta_avg_views_pct != null && a.delta_avg_views_pct < -15) ||
          (a.delta_engagement_pct != null && a.delta_engagement_pct < -20) ||
          a.performance_trend === "declining" ||
          a.momentum_tier === "stalled",
      );
    case "format_shift":
      return artists.filter((a) => a.format_shift === true);
    case "ugc_surge":
      return artists.filter(
        (a) =>
          a.sound_velocity === "up" ||
          a.sound_velocity === "new" ||
          (a.top_sound_new_ugc != null && a.top_sound_new_ugc > 0),
      );
    default:
      return artists;
  }
}

export function getFilterCounts(
  artists: ContentArtist[],
): Record<ContentFilter, number> {
  return {
    all: artists.length,
    posting_gap: filterContentArtists(artists, "posting_gap").length,
    top_performers: filterContentArtists(artists, "top_performers").length,
    declining: filterContentArtists(artists, "declining").length,
    format_shift: filterContentArtists(artists, "format_shift").length,
    ugc_surge: filterContentArtists(artists, "ugc_surge").length,
  };
}

// ─── Sort ─────────────────────────────────────────────────

export function sortContentArtists(
  artists: ContentArtist[],
  key: ContentSortKey,
  asc: boolean,
): ContentArtist[] {
  const sorted = [...artists].sort((a, b) => {
    let va: number;
    let vb: number;
    switch (key) {
      case "content_health":
        // Higher consistency = healthier, lower days_since_last_post = healthier
        va = (a.consistency_score || 0) - (a.days_since_last_post || 0) * 2;
        vb = (b.consistency_score || 0) - (b.days_since_last_post || 0) * 2;
        break;
      case "performance":
        va = a.avg_views_30d || 0;
        vb = b.avg_views_30d || 0;
        break;
      case "format_alpha":
        va = a.best_format_vs_median || 0;
        vb = b.best_format_vs_median || 0;
        break;
      case "top_sound":
        va = a.top_sound_new_ugc || a.top_sound_total_ugc || 0;
        vb = b.top_sound_new_ugc || b.top_sound_total_ugc || 0;
        break;
      case "activity":
        // Lower days = more active = sorts first (descending)
        va = -(a.days_since_last_post ?? 999);
        vb = -(b.days_since_last_post ?? 999);
        break;
      case "artist":
        return asc
          ? (a.artist_name || "").localeCompare(b.artist_name || "")
          : (b.artist_name || "").localeCompare(a.artist_name || "");
      default:
        va = 0;
        vb = 0;
    }
    return asc ? va - vb : vb - va;
  });
  return sorted;
}

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
  | "format_shift";

export type ContentSortKey =
  | "content_health"
  | "performance"
  | "format_alpha"
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

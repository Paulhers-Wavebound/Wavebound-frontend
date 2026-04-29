import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Clock,
  TrendingUp,
  Heart,
  Lightbulb,
  BarChart3,
  Music2,
  Zap,
  CalendarClock,
  Bookmark,
  Target,
  Users,
  LayoutGrid,
  List,
  Activity,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import InfoPopover from "@/components/sound-intelligence/InfoPopover";
import type {
  ContentArtist,
  ContentFilter,
  ContentSortKey,
  TierGroup,
} from "@/data/contentDashboardHelpers";
import {
  CONTENT_FILTER_TABS,
  filterContentArtists,
  getFilterCounts,
  sortContentArtists,
  fmtViews,
  fmtPct,
  roundedTrendPct,
  saveToReachColor,
  saveToReachLabel,
  getTierGroup,
} from "@/data/contentDashboardHelpers";
import { renderBriefText } from "@/utils/briefText";

/* ─── Artist avatar with initials fallback ────────────────── */

function ArtistAvatar({
  name,
  url,
  size = 28,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (!url || failed) {
    return (
      <span
        className="rounded-full shrink-0 flex items-center justify-center bg-white/[0.06] text-white/40 font-semibold"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

/* ─── Momentum tier badge (Phase 2) ──────────────────────── */

const TIER_BADGE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  viral: { label: "VIRAL", color: "#BF5AF2", bg: "rgba(191,90,242,0.12)" },
  breakout: {
    label: "BREAKOUT",
    color: "#30D158",
    bg: "rgba(48,209,88,0.12)",
  },
  momentum: {
    label: "MOMENTUM",
    color: "#0A84FF",
    bg: "rgba(10,132,255,0.12)",
  },
  stalled: {
    label: "STALLED",
    color: "rgba(255,255,255,0.40)",
    bg: "rgba(255,255,255,0.06)",
  },
};

function MomentumBadge({ tier }: { tier: string | null }) {
  if (!tier || tier === "stable") return null;
  const cfg = TIER_BADGE_CONFIG[tier];
  if (!cfg) return null;

  return (
    <span
      className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded ml-1.5 shrink-0"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

/* ─── Risk indicator (Phase 2) ───────────────────────────── */

function RiskIndicator({
  flags,
}: {
  flags: Array<{ severity: string; message: string }> | null;
}) {
  if (!flags || flags.length === 0) return null;
  const hasUrgent = flags.some(
    (f) => f.severity === "critical" || f.severity === "warning",
  );
  if (!hasUrgent) return null;

  const hasCritical = flags.some((f) => f.severity === "critical");
  return (
    <span
      className="shrink-0 ml-1.5 inline-block h-1.5 w-1.5 rounded-full"
      style={{
        background: hasCritical
          ? "rgba(255,69,58,0.65)"
          : "rgba(255,159,10,0.50)",
      }}
    />
  );
}

/* ─── Content Health pill ──────────────────────────────────── */

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Hot: { color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  Healthy: { color: "#34C759", bg: "rgba(52,199,89,0.10)" },
  Stable: { color: "#A2C739", bg: "rgba(162,199,57,0.10)" },
  Inconsistent: { color: "#FF9F0A", bg: "rgba(255,159,10,0.10)" },
  "At Risk": { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  Silent: { color: "#6B6B70", bg: "rgba(107,107,112,0.12)" },
};

function deriveStatus(
  daysSince: number | null,
  dbtCadence: string | null,
  trend: string | null,
): string {
  if (dbtCadence) {
    const c = dbtCadence.toLowerCase();
    if (c === "daily") return trend === "improving" ? "Hot" : "Healthy";
    if (c === "regular") return trend === "improving" ? "Healthy" : "Stable";
    if (c === "sporadic") return "Inconsistent";
    if (c === "inactive") return "At Risk";
    if (c === "dormant") return "Silent";
  }
  if (daysSince != null) {
    if (daysSince <= 2) return trend === "improving" ? "Hot" : "Healthy";
    if (daysSince <= 5) return "Stable";
    if (daysSince <= 10) return "Inconsistent";
    if (daysSince <= 21) return "At Risk";
    if (daysSince > 21) return "Silent";
  }
  return "\u2014";
}

const STATUS_ARROWS: Record<string, string> = {
  Hot: "\u25B2",
  Inconsistent: "\u25BC",
  "At Risk": "\u25BC",
  Silent: "\u25BC",
};

function ContentHealthPill({
  cadence,
  daysSince,
  trend,
}: {
  cadence: string | null;
  daysSince: number | null;
  trend: string | null;
}) {
  const status = deriveStatus(daysSince, cadence, trend);
  if (status === "\u2014") return null;
  const { color, bg } = STATUS_COLORS[status] ?? {
    color: "rgba(255,255,255,0.30)",
    bg: "rgba(255,255,255,0.04)",
  };
  const arrow = STATUS_ARROWS[status] ?? "";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-semibold"
      style={{ color, background: bg }}
    >
      {status}
      <span className="text-[9px]">{arrow}</span>
    </span>
  );
}

/* ─── Performance cell (Phase 2: hero flip — trend is PRIMARY) */

function PerformanceCell({ artist }: { artist: ContentArtist }) {
  const views = artist.avg_views_30d ?? artist.avg_views_7d;
  const trend = artist.plays_trend_pct ?? artist.velocity_views_pct;
  const roundedTrend = roundedTrendPct(trend);
  const saveRate = artist.save_to_reach_pct;

  const trendColor =
    roundedTrend != null && roundedTrend > 10
      ? "#30D158"
      : roundedTrend != null && roundedTrend < -10
        ? "#FF453A"
        : "rgba(255,255,255,0.55)";

  // Hero: trend percentage (bold, colored, large)
  // When no trend, fall back to view count as hero
  if (roundedTrend != null) {
    return (
      <div className="flex flex-col gap-0.5">
        <p
          className="text-[16px] font-bold tabular-nums leading-tight"
          style={{ color: trendColor }}
        >
          {roundedTrend > 0 ? "+" : ""}
          {roundedTrend}%
        </p>
        <p className="text-[11px] text-white/40 tabular-nums leading-tight">
          {fmtViews(views)} avg views
        </p>
        {saveRate != null && (
          <p
            className="text-[10px] font-medium tabular-nums leading-tight"
            style={{ color: saveToReachColor(saveRate) }}
          >
            {saveRate.toFixed(1)}% save rate
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[14px] font-semibold text-white/87 tabular-nums leading-tight">
        {fmtViews(views)} views
      </p>
      <p className="text-[11px] text-white/40 tabular-nums leading-tight">
        flat
      </p>
      {saveRate != null && (
        <p
          className="text-[10px] font-medium tabular-nums leading-tight"
          style={{ color: saveToReachColor(saveRate) }}
        >
          {saveRate.toFixed(1)}% save rate
        </p>
      )}
    </div>
  );
}

/* ─── Activity cell ────────────────────────────────────────── */

function ActivityCell({ artist }: { artist: ContentArtist }) {
  const days = artist.days_since_last_post;
  const daysColor =
    days != null && days <= 3
      ? "#30D158"
      : days != null && days <= 7
        ? "#FFD60A"
        : days != null
          ? "#FF453A"
          : undefined;

  return (
    <span
      className="text-[12px] font-medium tabular-nums"
      style={{ color: daysColor }}
    >
      {days != null
        ? days === 0
          ? "Today"
          : days === 1
            ? "1d ago"
            : `${days}d ago`
        : "\u2014"}
    </span>
  );
}

/* ─── Expanded detail row (Phase 4: tier-adaptive tiles) ──── */

function freqToLabel(freq: number): string {
  if (freq >= 14) return "Posting multiple times a day";
  if (freq >= 7) return "Posting daily";
  if (freq >= 5) return "Posting almost daily";
  if (freq >= 3) return "Posting every other day";
  if (freq >= 2) return "Posting every 3rd day";
  if (freq >= 1) return "Posting about once a week";
  if (freq >= 0.5) return "Posting every couple of weeks";
  return "Rarely posting";
}

function derivePriorityAction(artist: ContentArtist): string {
  // Layer 3: use AI-generated action when available
  const focused = artist.weekly_pulse?.focused_sound;
  if (focused?.action) return focused.action;

  const days = artist.days_since_last_post;
  if (days != null && days >= 7) {
    return `Get ${artist.artist_name} posting again \u2014 ${days} days silent`;
  }
  const trend = artist.plays_trend_pct ?? artist.velocity_views_pct;
  if (trend != null && trend < -20 && artist.best_format) {
    return `Review content strategy \u2014 views down ${Math.abs(trend).toFixed(0)}%, lean into ${artist.best_format}`;
  }
  if (artist.best_format && trend != null && trend > 10) {
    return `Double down on ${artist.best_format} \u2014 momentum is building`;
  }
  if (artist.best_format) {
    return `Keep pushing ${artist.best_format} content this week`;
  }
  return "Run a content DNA scan to unlock format insights";
}

const EASE_OUT: [number, number, number, number] = [0.25, 1, 0.5, 1];

function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
  valueColor,
  index,
  skipMotion,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  index: number;
  skipMotion?: boolean;
}) {
  return (
    <motion.div
      initial={skipMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        skipMotion
          ? { duration: 0 }
          : { duration: 0.25, delay: index * 0.06, ease: EASE_OUT }
      }
      className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] px-3.5 py-3 min-w-0"
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.05]">
        <Icon size={14} className="text-white/40" />
      </div>
      <div className="min-w-0">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
          {label}
        </span>
        <p
          className="text-[13px] font-medium leading-snug"
          style={{ color: valueColor || "rgba(255,255,255,0.80)" }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-white/40 leading-tight mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/** Build tier-adaptive tiles based on momentum_tier (Bible §10) */
function buildTierAdaptiveTiles(
  artist: ContentArtist,
  tierGroup: TierGroup,
): {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}[] {
  const tiles: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    valueColor?: string;
  }[] = [];

  const trend = artist.plays_trend_pct ?? artist.velocity_views_pct;
  const engagement = artist.avg_engagement_30d ?? artist.avg_engagement_rate;
  const freq = Math.max(
    artist.posting_freq_7d ?? 0,
    artist.posting_freq_30d ?? 0,
  );

  // Common: cadence (always useful)
  if (freq > 0) {
    tiles.push({ icon: Clock, label: "Cadence", value: freqToLabel(freq) });
  }

  switch (tierGroup) {
    case "breakout": {
      // Breakout artists: velocity growth, engagement, format alpha, follower delta
      const velocityViews = artist.avg_views_30d ?? artist.avg_views_7d;
      if (velocityViews != null) {
        const roundedTrend = roundedTrendPct(trend);
        const velocitySub =
          roundedTrend != null
            ? `${roundedTrend > 0 ? "+" : ""}${roundedTrend}% vs last 7d`
            : undefined;
        tiles.push({
          icon: TrendingUp,
          label: "Velocity",
          value: fmtViews(velocityViews) + " avg",
          sub: velocitySub,
          valueColor:
            roundedTrend != null && roundedTrend > 10 ? "#30D158" : undefined,
        });
      }
      if (engagement != null) {
        tiles.push({
          icon: Heart,
          label: "Engagement",
          value: `${engagement.toFixed(2)}%`,
        });
      }
      if (artist.best_format) {
        const mult = artist.best_format_vs_median;
        tiles.push({
          icon: Zap,
          label: "Format Alpha",
          value: artist.best_format,
          sub:
            mult != null && mult > 1
              ? `${mult.toFixed(1)}x vs median`
              : undefined,
        });
      }
      if (artist.delta_followers_pct != null) {
        tiles.push({
          icon: Users,
          label: "Follower Delta",
          value: fmtPct(artist.delta_followers_pct),
          valueColor: artist.delta_followers_pct > 0 ? "#30D158" : "#FF453A",
        });
      }
      if (artist.velocity_posting_freq_pct != null) {
        const v = Math.round(artist.velocity_posting_freq_pct);
        tiles.push({
          icon: Activity,
          label: "Cadence Momentum",
          value: `${v > 0 ? "+" : ""}${v}%`,
          sub: "posts/week vs last 30d",
          valueColor: v > 5 ? "#30D158" : v < -5 ? "#FF453A" : undefined,
        });
      }
      break;
    }
    case "momentum": {
      // Momentum artists: save rate, hook score, viral score, format alpha
      if (artist.save_to_reach_pct != null) {
        tiles.push({
          icon: Bookmark,
          label: "Save Rate",
          value: `${artist.save_to_reach_pct.toFixed(1)}%`,
          sub: saveToReachLabel(artist.save_to_reach_pct),
          valueColor: saveToReachColor(artist.save_to_reach_pct),
        });
      }
      if (artist.avg_hook_score != null) {
        tiles.push({
          icon: Target,
          label: "Hook Score",
          value: `${Math.round(artist.avg_hook_score)}/100`,
        });
      }
      if (artist.avg_viral_score != null) {
        tiles.push({
          icon: Zap,
          label: "Viral Score",
          value: `${Math.round(artist.avg_viral_score)}/100`,
        });
      }
      if (artist.best_format) {
        const mult = artist.best_format_vs_median;
        tiles.push({
          icon: BarChart3,
          label: "Format Alpha",
          value: artist.best_format,
          sub:
            mult != null && mult > 1
              ? `${mult.toFixed(1)}x vs median`
              : undefined,
        });
      }
      if (artist.velocity_posting_freq_pct != null) {
        const v = Math.round(artist.velocity_posting_freq_pct);
        tiles.push({
          icon: Activity,
          label: "Cadence Momentum",
          value: `${v > 0 ? "+" : ""}${v}%`,
          sub: "posts/week vs last 30d",
          valueColor: v > 5 ? "#30D158" : v < -5 ? "#FF453A" : undefined,
        });
      }
      break;
    }
    case "catalog":
    default: {
      // Catalog artists: top sound (emphasis on catalog spikes), velocity, save rate
      if (artist.top_sound_title) {
        const ugc = artist.top_sound_new_ugc;
        const ugcSub =
          ugc != null && ugc > 0
            ? `+${fmtViews(ugc)} new UGC this week`
            : artist.top_sound_total_ugc
              ? `${fmtViews(artist.top_sound_total_ugc)} total UGC`
              : undefined;
        const isGaining =
          artist.sound_velocity === "up" || artist.sound_velocity === "new";
        tiles.push({
          icon: Music2,
          label: isGaining ? "Catalog Spike" : "Top Sound",
          value: artist.top_sound_title,
          sub: ugcSub,
          valueColor: isGaining ? "#30D158" : undefined,
        });
      }
      const velocityViews = artist.avg_views_30d ?? artist.avg_views_7d;
      if (velocityViews != null) {
        const roundedTrend = roundedTrendPct(trend);
        const velocitySub =
          roundedTrend != null
            ? `${roundedTrend > 0 ? "+" : ""}${roundedTrend}% vs last 7d`
            : undefined;
        tiles.push({
          icon: TrendingUp,
          label: "Velocity",
          value: fmtViews(velocityViews) + " avg",
          sub: velocitySub,
        });
      }
      if (artist.save_to_reach_pct != null) {
        tiles.push({
          icon: Bookmark,
          label: "Save Rate",
          value: `${artist.save_to_reach_pct.toFixed(1)}%`,
          sub: saveToReachLabel(artist.save_to_reach_pct),
          valueColor: saveToReachColor(artist.save_to_reach_pct),
        });
      }
      break;
    }
  }

  // Common: last post (always included)
  {
    const days = artist.days_since_last_post;
    const daysValue =
      days != null
        ? days === 0
          ? "Today"
          : days === 1
            ? "1 day ago"
            : `${days} days ago`
        : "Unknown";
    const freqSub =
      artist.posting_freq_30d != null && artist.posting_freq_30d > 0
        ? freqToLabel(artist.posting_freq_30d / 4)
        : undefined;
    tiles.push({
      icon: CalendarClock,
      label: "Last Post",
      value: daysValue,
      sub: freqSub,
    });
  }

  return tiles;
}

function ExpandedRow({
  artist,
  colSpan,
}: {
  artist: ContentArtist;
  colSpan: number;
}) {
  const reduced = useReducedMotion();
  const tierGroup = getTierGroup(artist.momentum_tier);
  const tiles = buildTierAdaptiveTiles(artist, tierGroup);

  const hasTiles = tiles.length > 0;
  const skip = !!reduced;

  return (
    <tr
      style={{
        background: "#141416",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <td colSpan={colSpan} className="p-0">
        <motion.div
          initial={skip ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={skip ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={
            skip ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT }
          }
          style={{ overflow: "hidden" }}
        >
          <div className="px-4 pt-1.5 pb-3">
            {/* AI Focus: full reason text (un-truncated) */}
            {artist.weekly_pulse?.focused_sound?.reason && (
              <motion.div
                initial={skip ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  skip ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }
                }
                className="flex items-start gap-2 rounded-md bg-white/[0.03] px-3 py-2.5 mb-2"
              >
                <Music2
                  size={13}
                  className="shrink-0 text-[#e8430a]/70 mt-0.5"
                />
                <div className="min-w-0">
                  <span
                    className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded mr-1.5"
                    style={{
                      color: "#e8430a",
                      background: "rgba(232,67,10,0.12)",
                    }}
                  >
                    FOCUS
                  </span>
                  <span className="text-[12px] font-medium text-white/87">
                    {artist.weekly_pulse.focused_sound.title}
                  </span>
                  <p className="text-[11px] text-white/55 leading-relaxed mt-1">
                    {renderBriefText(artist.weekly_pulse.focused_sound.reason)}
                  </p>
                </div>
              </motion.div>
            )}

            {/* AI Focus alert (Phase 6: catalogue alert from weekly_pulse) */}
            {artist.weekly_pulse?.catalogue_alert && (
              <motion.div
                initial={skip ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  skip ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }
                }
                className="flex items-center gap-2 rounded-md bg-[#BF5AF2]/[0.08] px-3 py-2 mb-2"
              >
                <Music2 size={13} className="shrink-0 text-[#BF5AF2]/80" />
                <p className="text-[11px] text-[#BF5AF2]/90 leading-relaxed">
                  <span className="font-semibold">Catalog alert:</span> &quot;
                  {artist.weekly_pulse.catalogue_alert.title}&quot;{" "}
                  {artist.weekly_pulse.catalogue_alert.delta} &mdash;{" "}
                  {renderBriefText(artist.weekly_pulse.catalogue_alert.reason)}
                </p>
              </motion.div>
            )}

            {/* Metric tiles */}
            {hasTiles ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-2.5">
                {tiles.map((t, i) => (
                  <MetricTile
                    key={t.label}
                    index={i}
                    skipMotion={skip}
                    {...t}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] px-4 py-4 mb-2.5">
                <BarChart3 size={15} className="text-white/20" />
                <p className="text-[12px] text-white/30">
                  No detailed metrics yet \u2014 run a content scan to populate
                </p>
              </div>
            )}

            {/* Priority action banner — skip when it would just echo the AI focus reason shown above */}
            {!(
              artist.weekly_pulse?.focused_sound?.action &&
              artist.weekly_pulse?.focused_sound?.reason
            ) && (
              <motion.div
                initial={skip ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  skip
                    ? { duration: 0 }
                    : {
                        duration: 0.25,
                        delay: hasTiles ? tiles.length * 0.06 + 0.05 : 0.1,
                        ease: EASE_OUT,
                      }
                }
                className="flex items-center gap-2 rounded-md bg-[#e8430a]/[0.06] px-3 py-2"
              >
                <Lightbulb size={13} className="shrink-0 text-[#e8430a]/70" />
                <p className="text-[11px] text-[#e8430a]/90 leading-tight">
                  {renderBriefText(derivePriorityAction(artist))}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

/* ─── Top Sound cell (Phase 6: AI focused sound) ─────────── */

function TopSoundCell({ artist }: { artist: ContentArtist }) {
  // Layer 3: AI-picked focused sound takes priority
  const focused = artist.weekly_pulse?.focused_sound;
  if (focused) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0"
            style={{ color: "#e8430a", background: "rgba(232,67,10,0.12)" }}
          >
            FOCUS
          </span>
          <span className="text-[12px] text-white/87 truncate max-w-[180px]">
            {focused.title}
          </span>
        </div>
        <p className="text-[11px] text-white/50 leading-tight line-clamp-1">
          {focused.reason?.split(/\s+/).slice(0, 5).join(" ")}
          {(focused.reason?.split(/\s+/).length ?? 0) > 5 ? "…" : ""}
        </p>
      </div>
    );
  }

  // Fallback: standard top sound display
  const title = artist.top_sound_title;
  const newUgc = artist.top_sound_new_ugc;
  const totalUgc = artist.top_sound_total_ugc;
  const velocity = artist.sound_velocity;

  if (!title) {
    return <span className="text-[12px] text-white/30">{"\u2014"}</span>;
  }

  const tierGroup = getTierGroup(artist.momentum_tier);

  const velocityColor =
    velocity === "up" || velocity === "new"
      ? "#30D158"
      : velocity === "down"
        ? "#FF453A"
        : "#FFD60A";

  const arrow =
    velocity === "up" || velocity === "new"
      ? "\u25B2"
      : velocity === "down"
        ? "\u25BC"
        : "";

  // Catalog tier: emphasize traction language
  if (tierGroup === "catalog" && (velocity === "up" || velocity === "new")) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-[12px] font-medium truncate max-w-[180px]"
            style={{ color: "#30D158" }}
          >
            {title}
          </span>
          <span className="text-[10px] font-bold" style={{ color: "#30D158" }}>
            {arrow}
          </span>
        </div>
        <p className="text-[11px] text-white/50 leading-tight">
          Gaining traction{" "}
          {newUgc != null && newUgc > 0
            ? `\u2014 +${fmtViews(newUgc)} new UGC`
            : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[12px] text-white/87 truncate max-w-[180px]">
          {title}
        </span>
        {newUgc != null && newUgc > 0 && (
          <span
            className="text-[11px] font-bold tabular-nums whitespace-nowrap"
            style={{ color: velocityColor }}
          >
            +{fmtViews(newUgc)} {arrow}
          </span>
        )}
      </div>
      {totalUgc != null && totalUgc > 0 && (
        <p className="text-[11px] text-white/40 tabular-nums leading-tight">
          {fmtViews(totalUgc)} total UGC
        </p>
      )}
    </div>
  );
}

/* ─── Sortable header ──────────────────────────────────────── */

function ColumnTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center shrink-0 cursor-help text-white/20 hover:text-white/40 transition-colors"
          >
            <HelpCircle size={11} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[220px] text-xs leading-relaxed"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SortHeader({
  label,
  sortKey: sk,
  active,
  asc,
  onSort,
  align,
  tooltip,
}: {
  label: string;
  sortKey: ContentSortKey;
  active: boolean;
  asc: boolean;
  onSort: (k: ContentSortKey) => void;
  align?: "left" | "right";
  tooltip?: string;
}) {
  return (
    <span
      className={`flex items-center gap-1 ${align === "right" ? "ml-auto" : ""}`}
    >
      <button
        onClick={() => onSort(sk)}
        className={`flex items-center gap-0.5 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
          active ? "text-white/60" : "text-white/30 hover:text-white/50"
        }`}
      >
        {label}
        <span className="flex flex-col -space-y-1">
          <ChevronUp
            size={8}
            className={active && asc ? "text-white/70" : "text-white/15"}
          />
          <ChevronDown
            size={8}
            className={active && !asc ? "text-white/70" : "text-white/15"}
          />
        </span>
      </button>
      {tooltip && <ColumnTooltip text={tooltip} />}
    </span>
  );
}

/* ─── Card view (Phase 3) ────────────────────────────────── */

function ArtistCard({
  artist,
  onNavigate,
}: {
  artist: ContentArtist;
  onNavigate: () => void;
}) {
  const trend = artist.plays_trend_pct ?? artist.velocity_views_pct;
  const roundedTrend = roundedTrendPct(trend);
  const heroViews = artist.avg_views_30d ?? artist.avg_views_7d;
  const saveRate = artist.save_to_reach_pct;
  const focused = artist.weekly_pulse?.focused_sound;
  const tierGroup = getTierGroup(artist.momentum_tier);
  const hasRisk = artist.risk_flags?.some(
    (f) => f.severity === "critical" || f.severity === "warning",
  );

  const trendColor =
    roundedTrend != null && roundedTrend > 10
      ? "#30D158"
      : roundedTrend != null && roundedTrend < -10
        ? "#FF453A"
        : "rgba(255,255,255,0.55)";

  return (
    <div
      onClick={onNavigate}
      className="group cursor-pointer rounded-xl border border-white/[0.06] p-4 transition-colors hover:bg-white/[0.03]"
      style={{ background: "#1C1C1E" }}
    >
      {/* Risk note */}
      {hasRisk && (
        <p
          className="text-[11px] mb-3 px-1"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          {artist.risk_flags?.find((f) => f.severity === "critical")?.message ||
            artist.risk_flags?.find((f) => f.severity === "warning")?.message ||
            "Needs attention"}
        </p>
      )}

      {/* Header: avatar + name + badges */}
      <div className="flex items-center gap-2.5 mb-3">
        <ArtistAvatar
          name={artist.artist_name}
          url={artist.avatar_url}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-[14px] font-semibold text-white/87 truncate leading-tight">
              {artist.artist_name}
            </p>
            <MomentumBadge tier={artist.momentum_tier} />
          </div>
          <ContentHealthPill
            cadence={artist.posting_cadence}
            daysSince={artist.days_since_last_post}
            trend={artist.performance_trend}
          />
        </div>
      </div>

      {/* Hero metric: trend % */}
      <div className="flex items-baseline gap-3 mb-3">
        {roundedTrend != null ? (
          <>
            <span
              className="text-[28px] font-bold tabular-nums leading-none"
              style={{ color: trendColor }}
            >
              {roundedTrend > 0 ? "+" : ""}
              {roundedTrend}%
            </span>
            <span className="text-[11px] text-white/40">velocity</span>
          </>
        ) : (
          <>
            <span className="text-[22px] font-semibold text-white/87 tabular-nums leading-none">
              {fmtViews(heroViews)}
            </span>
            <span className="text-[11px] text-white/40">avg views</span>
          </>
        )}
      </div>

      {/* Save-to-Reach ratio */}
      {saveRate != null && (
        <div className="flex items-center gap-2 mb-3">
          <Bookmark size={12} style={{ color: saveToReachColor(saveRate) }} />
          <span
            className="text-[12px] font-medium tabular-nums"
            style={{ color: saveToReachColor(saveRate) }}
          >
            {saveRate.toFixed(1)}% save rate
          </span>
          <span className="text-[10px] text-white/30">
            {saveToReachLabel(saveRate)}
          </span>
        </div>
      )}

      {/* Top Sound / AI Focus */}
      {focused ? (
        <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.03]">
          <span
            className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5"
            style={{ color: "#e8430a", background: "rgba(232,67,10,0.12)" }}
          >
            FOCUS
          </span>
          <div className="min-w-0">
            <p className="text-[12px] text-white/87 truncate">
              {focused.title}
            </p>
            <p className="text-[10px] text-white/45 leading-relaxed">
              {renderBriefText(focused.reason)}
            </p>
          </div>
        </div>
      ) : artist.top_sound_title ? (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03]">
          <Music2 size={12} className="text-white/30 shrink-0" />
          <div className="min-w-0">
            <p className="text-[12px] text-white/87 truncate">
              {artist.top_sound_title}
            </p>
            {artist.top_sound_new_ugc != null &&
              artist.top_sound_new_ugc > 0 && (
                <p
                  className="text-[10px] tabular-nums"
                  style={{
                    color:
                      artist.sound_velocity === "up" ||
                      artist.sound_velocity === "new"
                        ? "#30D158"
                        : "#FFD60A",
                  }}
                >
                  +{fmtViews(artist.top_sound_new_ugc)} new UGC
                </p>
              )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Table / Cards container ─────────────────────────────── */

type ViewMode = "rows" | "cards";

export default function ContentRosterTable({
  artists,
}: {
  artists: ContentArtist[];
}) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");
  const [sortKey, setSortKey] = useState<ContentSortKey>("content_health");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("rows");

  const filterCounts = useMemo(() => getFilterCounts(artists), [artists]);

  const filtered = useMemo(() => {
    const list = filterContentArtists(artists, activeFilter);
    return sortContentArtists(list, sortKey, sortAsc);
  }, [artists, activeFilter, sortKey, sortAsc]);

  const [expandedHandle, setExpandedHandle] = useState<string | null>(null);

  const toggleExpand = useCallback((handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHandle((prev) => (prev === handle ? null : handle));
  }, []);

  const handleSort = (key: ContentSortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter tabs + view toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {CONTENT_FILTER_TABS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeFilter === f.key
                  ? "bg-[#e8430a] text-white"
                  : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-50 tabular-nums">
                {filterCounts[f.key]}
              </span>
            </button>
          ))}
          <InfoPopover
            text="Filters \u2014 Posting Gap: no posts in 5+ days. Top Performers: views up 15%+ or improving. Declining: views/engagement falling or stalled. Format Shift: changed primary format. Columns \u2014 Content Health: cadence + consistency (green < 3 days, yellow 3\u20137, red 7+). Content Velocity: 30-day avg views and trend %. Top Sound: best-performing sound this week. Expand a row for more: Format Alpha, Last Post, Engagement."
            width={340}
          />
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("rows")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "rows"
                ? "bg-white/[0.08] text-white/70"
                : "text-white/30 hover:text-white/50"
            }`}
            title="Table view"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "cards"
                ? "bg-white/[0.08] text-white/70"
                : "text-white/30 hover:text-white/50"
            }`}
            title="Card view"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Card view */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((artist) => (
            <ArtistCard
              key={artist.artist_handle}
              artist={artist}
              onNavigate={() =>
                navigate(`/label/artists/${artist.artist_handle}`)
              }
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-10 text-center text-[13px] text-white/30">
              No artists match this filter.
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {viewMode === "rows" && (
        <div
          className="rounded-xl border border-white/[0.06] overflow-hidden"
          style={{ background: "#1C1C1E" }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th className="text-left pl-4 pr-2 py-2.5 w-[200px]">
                  <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-white/30">
                    Artist
                    <ColumnTooltip text="Roster artist with momentum tier badge and risk indicators." />
                  </span>
                </th>
                <th className="px-2 py-2.5 text-left">
                  <SortHeader
                    label="Content Health"
                    sortKey="content_health"
                    active={sortKey === "content_health"}
                    asc={sortAsc}
                    onSort={handleSort}
                    tooltip="How consistently the artist is posting. Based on posting frequency over the last 30 days."
                  />
                </th>
                <th className="px-2 py-2.5 text-left hidden md:table-cell">
                  <SortHeader
                    label="Content Velocity"
                    sortKey="performance"
                    active={sortKey === "performance"}
                    asc={sortAsc}
                    onSort={handleSort}
                    tooltip="How views are trending. The percentage compares last 7 days vs the prior 30-day average. Below that: average views and save rate (saves ÷ views) over 30 days."
                  />
                </th>
                <th className="px-2 py-2.5 text-left hidden md:table-cell">
                  <SortHeader
                    label="Top Sound"
                    sortKey="top_sound"
                    active={sortKey === "top_sound"}
                    asc={sortAsc}
                    onSort={handleSort}
                    tooltip="The artist's best-performing TikTok sound this week, ranked by new UGC videos in the last 7 days."
                  />
                </th>
                <th className="w-8 pr-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((artist) => {
                const isExpanded = expandedHandle === artist.artist_handle;
                return (
                  <React.Fragment key={artist.artist_handle}>
                    <tr
                      onClick={(e) => toggleExpand(artist.artist_handle, e)}
                      className="group cursor-pointer transition-colors hover:bg-white/[0.04]"
                      style={{
                        borderBottom: isExpanded
                          ? "none"
                          : "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      {/* Artist + momentum badge + risk indicator */}
                      <td className="pl-4 pr-2 py-2">
                        <div className="flex items-center gap-2.5">
                          <ArtistAvatar
                            name={artist.artist_name}
                            url={artist.avatar_url}
                          />
                          <div className="flex items-center min-w-0">
                            <p className="text-[13px] font-medium text-white/87 leading-tight truncate">
                              {artist.artist_name}
                            </p>
                            <RiskIndicator flags={artist.risk_flags} />
                            <MomentumBadge tier={artist.momentum_tier} />
                          </div>
                        </div>
                      </td>

                      {/* Content Health */}
                      <td className="px-2 py-2">
                        <ContentHealthPill
                          cadence={artist.posting_cadence}
                          daysSince={artist.days_since_last_post}
                          trend={artist.performance_trend}
                        />
                      </td>

                      {/* Performance (hero: trend %) */}
                      <td className="px-2 py-2 hidden md:table-cell">
                        <PerformanceCell artist={artist} />
                      </td>

                      {/* Top Sound / AI Focus */}
                      <td className="px-2 py-2 hidden md:table-cell">
                        <TopSoundCell artist={artist} />
                      </td>

                      {/* Navigate chevron */}
                      <td className="pr-3 py-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/label/artists/${artist.artist_handle}`);
                          }}
                          className="p-2.5 -m-1.5 rounded-lg text-white/20 hover:text-white/55 hover:bg-white/[0.05] transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <ExpandedRow artist={artist} colSpan={5} />
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-[13px] text-white/30">
              No artists match this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

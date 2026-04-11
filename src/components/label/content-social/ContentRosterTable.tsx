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
} from "lucide-react";
import InfoPopover from "@/components/sound-intelligence/InfoPopover";
import type {
  ContentArtist,
  ContentFilter,
  ContentSortKey,
} from "@/data/contentDashboardHelpers";
import {
  CONTENT_FILTER_TABS,
  filterContentArtists,
  getFilterCounts,
  sortContentArtists,
  fmtViews,
  fmtPct,
} from "@/data/contentDashboardHelpers";

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

/* ─── Content Health pill ──────────────────────────────────── */

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Hot: { color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  Healthy: { color: "#34C759", bg: "rgba(52,199,89,0.10)" },
  Stable: { color: "#A2C739", bg: "rgba(162,199,57,0.10)" },
  Inconsistent: { color: "#FF9F0A", bg: "rgba(255,159,10,0.10)" },
  "At Risk": { color: "#FF453A", bg: "rgba(255,69,58,0.10)" },
  Silent: { color: "#6B6B70", bg: "rgba(107,107,112,0.10)" },
};

function deriveStatus(
  daysSince: number | null,
  dbtCadence: string | null,
  trend: string | null,
): string {
  // Map dbt cadence + trend to status tiers
  if (dbtCadence) {
    const c = dbtCadence.toLowerCase();
    if (c === "daily") return trend === "improving" ? "Hot" : "Healthy";
    if (c === "regular") return trend === "improving" ? "Healthy" : "Stable";
    if (c === "sporadic") return "Inconsistent";
    if (c === "inactive") return "At Risk";
    if (c === "dormant") return "Silent";
  }
  // Fallback to days since last post + trend
  if (daysSince != null) {
    if (daysSince <= 2) return trend === "improving" ? "Hot" : "Healthy";
    if (daysSince <= 5) return "Stable";
    if (daysSince <= 10) return "Inconsistent";
    if (daysSince <= 21) return "At Risk";
    if (daysSince > 21) return "Silent";
  }
  return "—";
}

const STATUS_ARROWS: Record<string, string> = {
  Hot: "\u25B2", // ▲
  Inconsistent: "\u25BC", // ▼
  "At Risk": "\u25BC", // ▼
  Silent: "\u25BC", // ▼
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
  const { color, bg } = STATUS_COLORS[status] ?? {
    color: "rgba(255,255,255,0.30)",
    bg: "rgba(255,255,255,0.04)",
  };
  const arrow = STATUS_ARROWS[status] ?? "";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
      style={{ color, background: bg }}
    >
      {status}
      <span className="text-[9px]">{arrow}</span>
    </span>
  );
}

/* ─── Performance cell ─────────────────────────────────────── */

function PerformanceCell({ artist }: { artist: ContentArtist }) {
  const views = artist.avg_views_30d;
  const trend = artist.plays_trend_pct ?? artist.delta_avg_views_pct;
  const engagement = artist.avg_engagement_30d ?? artist.avg_engagement_rate;

  const trendColor =
    trend != null && trend > 10
      ? "#30D158"
      : trend != null && trend < -10
        ? "#FF453A"
        : undefined;

  const trendLabel =
    trend != null && trend !== 0
      ? ` (${trend > 0 ? "+" : ""}${trend.toFixed(0)}% last 7d)`
      : trend != null
        ? " (flat)"
        : "";

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[13px] tabular-nums leading-tight">
        <span className="font-semibold text-white/87">
          {fmtViews(views)} views
        </span>
        {trendLabel && (
          <span
            className="font-normal text-white/50"
            style={{ color: trendColor }}
          >
            {trendLabel}
          </span>
        )}
      </p>
      {engagement != null && (
        <p className="text-[11px] text-white/40 tabular-nums leading-tight">
          {Math.round(engagement)}% eng
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
        : "—"}
    </span>
  );
}

/* ─── Expanded detail row ─────────────────────────────────── */

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
  const days = artist.days_since_last_post;
  if (days != null && days >= 7) {
    return `Get ${artist.artist_name} posting again — ${days} days silent`;
  }
  const trend = artist.plays_trend_pct ?? artist.delta_avg_views_pct;
  if (trend != null && trend < -20 && artist.best_format) {
    return `Review content strategy — views down ${Math.abs(trend).toFixed(0)}%, lean into ${artist.best_format}`;
  }
  if (artist.best_format && trend != null && trend > 10) {
    return `Double down on ${artist.best_format} — momentum is building`;
  }
  if (artist.best_format) {
    return `Keep pushing ${artist.best_format} content this week`;
  }
  return "Run a content DNA scan to unlock format insights";
}

/* ease-out-quart: snappy deceleration, not springy */
const EASE_OUT: [number, number, number, number] = [0.25, 1, 0.5, 1];

function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
  index,
  skipMotion,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
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
        <p className="text-[13px] font-medium text-white/80 leading-snug truncate">
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

function ExpandedRow({
  artist,
  colSpan,
}: {
  artist: ContentArtist;
  colSpan: number;
}) {
  const reduced = useReducedMotion();
  const freq = Math.max(
    artist.posting_freq_7d ?? 0,
    artist.posting_freq_30d ?? 0,
  );
  const trend = artist.plays_trend_pct ?? artist.delta_avg_views_pct;
  const engagement = artist.avg_engagement_30d ?? artist.avg_engagement_rate;

  const velocityValue =
    artist.avg_views_30d != null
      ? fmtViews(artist.avg_views_30d) + " avg"
      : null;
  const velocitySub =
    trend != null && trend !== 0
      ? `${trend > 0 ? "+" : ""}${trend.toFixed(0)}% vs last 7d`
      : trend != null
        ? "Flat vs last 7d"
        : undefined;

  const tiles: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
  }[] = [];

  if (freq > 0) {
    tiles.push({ icon: Clock, label: "Cadence", value: freqToLabel(freq) });
  }
  if (velocityValue) {
    tiles.push({
      icon: TrendingUp,
      label: "Velocity",
      value: velocityValue,
      sub: velocitySub,
    });
  }
  if (engagement != null) {
    tiles.push({
      icon: Heart,
      label: "Engagement",
      value: `${engagement.toFixed(2)}%`,
    });
  }
  if (artist.top_sound_title) {
    const ugc = artist.top_sound_new_ugc;
    const ugcSub =
      ugc != null && ugc > 0
        ? `+${fmtViews(ugc)} new this week`
        : artist.top_sound_total_ugc
          ? `${fmtViews(artist.top_sound_total_ugc)} total UGC`
          : undefined;
    tiles.push({
      icon: Music2,
      label: "Top Sound",
      value: artist.top_sound_title,
      sub: ugcSub,
    });
  }
  if (artist.best_format) {
    const mult = artist.best_format_vs_median;
    const multSub =
      mult != null && mult > 1 ? `${mult.toFixed(1)}x vs median` : undefined;
    tiles.push({
      icon: Zap,
      label: "Format Alpha",
      value: artist.best_format,
      sub: multSub,
    });
  }
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
                  No detailed metrics yet — run a content scan to populate
                </p>
              </div>
            )}

            {/* Priority action banner */}
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
                {derivePriorityAction(artist)}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

/* ─── Format Alpha cell ───────────────────────────────────── */

function FormatAlphaCell({ artist }: { artist: ContentArtist }) {
  const format = artist.best_format;

  if (!format) {
    return <span className="text-[12px] text-white/30">—</span>;
  }

  return (
    <span className="text-[12px] text-white/87 leading-tight truncate max-w-[120px]">
      {format}
    </span>
  );
}

/* ─── Top Sound cell ──────────────────────────────────────── */

function TopSoundCell({ artist }: { artist: ContentArtist }) {
  const title = artist.top_sound_title;
  const newUgc = artist.top_sound_new_ugc;
  const totalUgc = artist.top_sound_total_ugc;
  const velocity = artist.sound_velocity;

  if (!title) {
    return <span className="text-[12px] text-white/30">—</span>;
  }

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

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[12px] text-white/87 truncate max-w-[110px]">
          {title}
        </span>
        {newUgc != null && newUgc > 0 && (
          <span
            className="text-[11px] font-semibold tabular-nums whitespace-nowrap"
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

function SortHeader({
  label,
  sortKey: sk,
  active,
  asc,
  onSort,
  align,
}: {
  label: string;
  sortKey: ContentSortKey;
  active: boolean;
  asc: boolean;
  onSort: (k: ContentSortKey) => void;
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={() => onSort(sk)}
      className={`flex items-center gap-0.5 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
        active ? "text-white/60" : "text-white/30 hover:text-white/50"
      } ${align === "right" ? "ml-auto" : ""}`}
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
  );
}

/* ─── Table ────────────────────────────────────────────────── */

export default function ContentRosterTable({
  artists,
}: {
  artists: ContentArtist[];
}) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("all");
  const [sortKey, setSortKey] = useState<ContentSortKey>("content_health");
  const [sortAsc, setSortAsc] = useState(false);

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
      {/* Filter tabs */}
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
          text="Filters — Posting Gap: no posts in 5+ days. Top Performers: views up 15%+ or improving. Declining: views/engagement falling or stalled. Format Shift: changed primary format. Columns — Content Health: cadence + consistency (green < 3 days, yellow 3–7, red 7+). Content Velocity: 30-day avg views and trend %. Top Sound: best-performing sound this week. Expand a row for more: Format Alpha, Last Post, Engagement."
          width={340}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-white/[0.06] overflow-hidden"
        style={{ background: "#1C1C1E" }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className="text-left pl-4 pr-2 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-white/30 w-[180px]">
                Artist
              </th>
              <th className="px-2 py-2.5 text-left">
                <SortHeader
                  label="Content Health"
                  sortKey="content_health"
                  active={sortKey === "content_health"}
                  asc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="px-2 py-2.5 text-left hidden md:table-cell">
                <SortHeader
                  label="Content Velocity"
                  sortKey="performance"
                  active={sortKey === "performance"}
                  asc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="px-2 py-2.5 text-left hidden md:table-cell">
                <SortHeader
                  label="Top Sound"
                  sortKey="top_sound"
                  active={sortKey === "top_sound"}
                  asc={sortAsc}
                  onSort={handleSort}
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
                    className="group cursor-pointer transition-colors hover:bg-white/[0.025]"
                    style={{
                      borderBottom: isExpanded
                        ? "none"
                        : "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    {/* Artist */}
                    <td className="pl-4 pr-2 py-2">
                      <div className="flex items-center gap-2.5">
                        <ArtistAvatar
                          name={artist.artist_name}
                          url={artist.avatar_url}
                        />
                        <p className="text-[13px] font-medium text-white/87 leading-tight">
                          {artist.artist_name}
                        </p>
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

                    {/* Performance */}
                    <td className="px-2 py-2 hidden md:table-cell">
                      <PerformanceCell artist={artist} />
                    </td>

                    {/* Top Sound */}
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
                    {isExpanded && <ExpandedRow artist={artist} colSpan={5} />}
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
    </div>
  );
}

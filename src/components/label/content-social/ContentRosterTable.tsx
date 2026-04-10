import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">
        {label}
      </span>
      <p className="text-[11px] text-white/65 leading-tight">{value}</p>
    </div>
  );
}

function ExpandedRow({
  artist,
  colSpan,
}: {
  artist: ContentArtist;
  colSpan: number;
}) {
  const freq = Math.max(
    artist.posting_freq_7d ?? 0,
    artist.posting_freq_30d ?? 0,
  );
  const trend = artist.plays_trend_pct ?? artist.delta_avg_views_pct;
  const engagement = artist.avg_engagement_30d ?? artist.avg_engagement_rate;

  const velocityDetail =
    artist.avg_views_30d != null
      ? `${fmtViews(artist.avg_views_30d)} avg views${trend != null && trend !== 0 ? ` (${trend > 0 ? "+" : ""}${trend.toFixed(0)}% last 7d)` : trend != null ? " (flat)" : ""}`
      : null;

  const hookDetail =
    artist.avg_hook_score != null
      ? `Hook score: ${(artist.avg_hook_score * 100).toFixed(0)}%`
      : null;

  return (
    <>
      <tr style={{ background: "#141416" }}>
        {/* Under Artist — empty */}
        <td className="pl-4 pr-2 pt-0 pb-2" />

        {/* Under Content Health — Cadence */}
        <td className="px-2 pt-0 pb-2 align-top">
          {freq > 0 && <DetailItem label="Cadence" value={freqToLabel(freq)} />}
        </td>

        {/* Under Content Velocity — Velocity + Engagement */}
        <td className="px-2 pt-0 pb-2 align-top hidden lg:table-cell">
          <div className="space-y-1">
            {velocityDetail && (
              <DetailItem label="Velocity" value={velocityDetail} />
            )}
            {engagement != null && (
              <DetailItem
                label="Engagement"
                value={`${engagement.toFixed(2)}%`}
              />
            )}
          </div>
        </td>

        {/* Under Format Alpha — Retention */}
        <td className="px-2 pt-0 pb-2 align-top hidden md:table-cell">
          {hookDetail && <DetailItem label="Retention" value={hookDetail} />}
        </td>

        {/* Under Activity — empty */}
        <td className="pl-2 pt-0 pb-2" />

        {/* Chevron spacer */}
        <td className="pr-2 pt-0 pb-2" />
      </tr>

      {/* Priority Action — full width */}
      <tr
        style={{
          background: "#141416",
          borderBottom: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <td colSpan={colSpan} className="px-4 pb-3 pt-0">
          <p className="text-[11px] italic text-[#e8430a]">
            {derivePriorityAction(artist)}
          </p>
        </td>
      </tr>
    </>
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
          text="Filters — Posting Gap: no posts in 5+ days. Top Performers: views up 15%+ or improving. Declining: views/engagement falling or stalled. Format Shift: changed primary format. Columns — Content Health: cadence + consistency (green < 3 days, yellow 3–7, red 7+). Performance: 30-day avg views, trend %, engagement rate. Format Alpha: top-performing format and multiplier vs median (e.g. 3.2x = 3.2 times above median views). Activity: days since last post, frequency, total videos."
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
              <th className="px-2 py-2.5 text-left hidden lg:table-cell">
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
                  label="Format Alpha"
                  sortKey="format_alpha"
                  active={sortKey === "format_alpha"}
                  asc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="pl-2 py-2.5 text-left">
                <SortHeader
                  label="Activity"
                  sortKey="activity"
                  active={sortKey === "activity"}
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
                    onClick={() =>
                      navigate(`/label/artists/${artist.artist_handle}`)
                    }
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
                    <td className="px-2 py-2 hidden lg:table-cell">
                      <PerformanceCell artist={artist} />
                    </td>

                    {/* Format Alpha */}
                    <td className="px-2 py-2 hidden md:table-cell">
                      <FormatAlphaCell artist={artist} />
                    </td>

                    {/* Activity */}
                    <td className="pl-2 py-2">
                      <ActivityCell artist={artist} />
                    </td>

                    {/* Expand chevron */}
                    <td className="pr-2 py-2 text-center">
                      <button
                        onClick={(e) => toggleExpand(artist.artist_handle, e)}
                        className="p-1 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
                      >
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && <ExpandedRow artist={artist} colSpan={6} />}
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

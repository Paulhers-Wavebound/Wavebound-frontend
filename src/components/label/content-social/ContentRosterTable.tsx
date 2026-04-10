import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  // Prefer dbt plays_trend_pct (full posting history), fall back to roster delta
  const trend = artist.plays_trend_pct ?? artist.delta_avg_views_pct;
  const engagement = artist.avg_engagement_30d ?? artist.avg_engagement_rate;

  const trendColor =
    trend != null && trend > 10
      ? "#30D158"
      : trend != null && trend < -10
        ? "#FF453A"
        : undefined;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-white/87 tabular-nums">
          {fmtViews(views)}
        </span>
        {trend != null && trend !== 0 && (
          <span
            className="text-[10px] font-semibold tabular-nums"
            style={{ color: trendColor }}
          >
            {fmtPct(trend)}
          </span>
        )}
      </div>
      {engagement != null && (
        <span className="text-[10px] text-white/30 tabular-nums">
          {engagement.toFixed(2)}% eng
        </span>
      )}
    </div>
  );
}

/* ─── Activity cell ────────────────────────────────────────── */

function ActivityCell({ artist }: { artist: ContentArtist }) {
  const days = artist.days_since_last_post;
  const freq = artist.posting_freq_7d;

  const daysColor =
    days != null && days <= 3
      ? "#30D158"
      : days != null && days <= 7
        ? "#FFD60A"
        : days != null
          ? "#FF453A"
          : undefined;

  return (
    <div className="flex items-center gap-2 text-[12px]">
      {days != null ? (
        <span className="font-medium tabular-nums" style={{ color: daysColor }}>
          {days === 0 ? "Today" : days === 1 ? "1d ago" : `${days}d ago`}
        </span>
      ) : (
        <span className="text-white/30">—</span>
      )}
      {freq != null && freq > 0 && (
        <>
          <span className="text-white/15">·</span>
          <span className="text-white/40 tabular-nums">
            {freq >= 7
              ? `${Math.round(freq / 7)}x/day`
              : `${freq.toFixed(1)}x/wk`}
          </span>
        </>
      )}
    </div>
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
                  label="Performance"
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
              <th className="pl-2 pr-4 py-2.5 text-left">
                <SortHeader
                  label="Activity"
                  sortKey="activity"
                  active={sortKey === "activity"}
                  asc={sortAsc}
                  onSort={handleSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((artist) => (
              <tr
                key={artist.artist_handle}
                onClick={() =>
                  navigate(`/label/artists/${artist.artist_handle}`)
                }
                className="group cursor-pointer transition-colors hover:bg-white/[0.025]"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              >
                {/* Artist */}
                <td className="pl-4 pr-2 py-2">
                  <p className="text-[13px] font-medium text-white/87 leading-tight">
                    {artist.artist_name}
                  </p>
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
                <td className="pl-2 pr-4 py-2">
                  <ActivityCell artist={artist} />
                </td>
              </tr>
            ))}
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

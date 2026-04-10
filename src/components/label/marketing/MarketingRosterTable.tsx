import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import type {
  MarketingArtist,
  MarketingFilter,
} from "@/data/mockMarketingData";
import {
  filterArtists,
  sortByOpportunityScore,
} from "@/data/mockMarketingData";

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}

/* ─── Momentum pill ─────────────────────────────────────────── */

function MomentumPill({
  momentum,
  trend,
  newMarkets,
}: {
  momentum: number;
  trend: string;
  newMarkets: number;
}) {
  let color: string;
  let bg: string;
  if (momentum >= 70 && trend === "accelerating") {
    color = "#30D158";
    bg = "rgba(48,209,88,0.10)";
  } else if (momentum >= 70) {
    color = "#0A84FF";
    bg = "rgba(10,132,255,0.10)";
  } else if (momentum >= 40) {
    color = "#FFD60A";
    bg = "rgba(255,214,10,0.10)";
  } else {
    color = "#FF453A";
    bg = "rgba(255,69,58,0.10)";
  }

  const arrow =
    trend === "accelerating"
      ? "\u25B2"
      : trend === "declining"
        ? "\u25BC"
        : "\u2192";

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums"
        style={{ color, background: bg }}
      >
        {momentum}
        <span className="text-[9px]">{arrow}</span>
      </span>
      {newMarkets > 0 && (
        <span className="text-[10px] font-medium text-green-400 tabular-nums">
          +{newMarkets}
        </span>
      )}
    </div>
  );
}

/* ─── Signal cell ───────────────────────────────────────────── */

function SignalCell({ artist }: { artist: MarketingArtist }) {
  const s = artist.top_signal;
  const pName = s.platform.charAt(0).toUpperCase() + s.platform.slice(1);
  const isNew = s.change === "NEW";
  const changeNum = typeof s.change === "number" ? s.change : null;

  return (
    <div className="flex items-center gap-1.5 text-[12px] text-white/60 min-w-0">
      <span className="text-white/30 shrink-0">{pName}</span>
      <span className="text-white/70 truncate">
        {s.country_name} #{s.position}
      </span>
      {isNew ? (
        <span className="text-green-400 font-medium shrink-0">NEW</span>
      ) : changeNum != null && changeNum !== 0 ? (
        <span
          className={`font-medium shrink-0 ${changeNum > 0 ? "text-green-400" : "text-red-400"}`}
        >
          {changeNum > 0 ? `+${changeNum}` : changeNum}
        </span>
      ) : null}
    </div>
  );
}

/* ─── Spend cell — single row with inline delta + ROI ─────── */

function SpendCell({ artist }: { artist: MarketingArtist }) {
  const diff = artist.suggested_monthly_spend - artist.current_monthly_spend;
  const roi = artist.top_opportunity?.roi_vs_us;
  const hasAction = diff !== 0;

  return (
    <div className="flex items-center justify-end gap-2 min-w-0">
      <span className="text-[13px] font-medium text-white/87 tabular-nums shrink-0">
        {fmt(artist.current_monthly_spend)}
      </span>
      {hasAction && (
        <>
          <span className="text-white/20 text-[10px]">&rarr;</span>
          <span
            className={`text-[11px] font-semibold tabular-nums shrink-0 ${
              diff > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {diff > 0 ? "+" : ""}
            {fmt(diff)}
          </span>
        </>
      )}
      {roi != null && roi !== 1.0 && (
        <span
          className={`text-[10px] font-semibold tabular-nums shrink-0 px-1 py-px rounded ${
            roi > 2
              ? "text-green-400 bg-green-400/10"
              : roi >= 1
                ? "text-white/40"
                : "text-red-400 bg-red-400/10"
          }`}
        >
          {roi.toFixed(1)}&times;
        </span>
      )}
    </div>
  );
}

/* ─── Filter tabs ───────────────────────────────────────────── */

const FILTER_TABS: { key: MarketingFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "breakout", label: "Breakout" },
  { key: "high_roi", label: "High-ROI" },
  { key: "under_spent", label: "Under-Spent" },
  { key: "reallocation", label: "Reallocation" },
  { key: "stalled", label: "Stalled" },
];

type SortKey = "momentum" | "new_markets" | "spend" | "opportunity";

/* ─── Sortable header ───────────────────────────────────────── */

function SortHeader({
  label,
  sortKey: sk,
  active,
  asc,
  onSort,
  align,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  asc: boolean;
  onSort: (k: SortKey) => void;
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

/* ─── Table ─────────────────────────────────────────────────── */

export default function MarketingRosterTable({
  artists,
}: {
  artists: MarketingArtist[];
}) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<MarketingFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("opportunity");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = filterArtists(artists, activeFilter);
    if (sortKey === "opportunity") {
      list = sortByOpportunityScore(list);
      if (sortAsc) list = list.reverse();
    } else {
      list = [...list].sort((a, b) => {
        let va: number, vb: number;
        switch (sortKey) {
          case "momentum":
            va = a.momentum;
            vb = b.momentum;
            break;
          case "new_markets":
            va = a.new_markets_7d;
            vb = b.new_markets_7d;
            break;
          case "spend":
            va = a.current_monthly_spend;
            vb = b.current_monthly_spend;
            break;
          default:
            va = 0;
            vb = 0;
        }
        return sortAsc ? va - vb : vb - va;
      });
    }
    return list;
  }, [artists, activeFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const filterCounts = useMemo(() => {
    const counts: Record<MarketingFilter, number> = {
      all: artists.length,
      breakout: filterArtists(artists, "breakout").length,
      high_roi: filterArtists(artists, "high_roi").length,
      under_spent: filterArtists(artists, "under_spent").length,
      reallocation: filterArtists(artists, "reallocation").length,
      stalled: filterArtists(artists, "stalled").length,
    };
    return counts;
  }, [artists]);

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTER_TABS.map((f) => (
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
                  label="Momentum"
                  sortKey="momentum"
                  active={sortKey === "momentum"}
                  asc={sortAsc}
                  onSort={handleSort}
                />
              </th>
              <th className="px-2 py-2.5 text-left hidden lg:table-cell">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-white/30">
                  Signal
                </span>
              </th>
              <th className="pl-2 pr-4 py-2.5 text-right">
                <SortHeader
                  label="Spend"
                  sortKey="spend"
                  active={sortKey === "spend"}
                  asc={sortAsc}
                  onSort={handleSort}
                  align="right"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((artist) => (
              <tr
                key={artist.entity_id}
                onClick={(e) => {
                  if (!e.isTrusted) return;
                  navigate(`/label/artist/${artist.entity_id}`);
                }}
                className="group cursor-pointer transition-colors hover:bg-white/[0.025]"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                {/* Artist */}
                <td className="pl-4 pr-2 py-2">
                  <p className="text-[13px] font-medium text-white/87 leading-tight">
                    {artist.artist_name}
                  </p>
                  <p className="text-[10px] text-white/30 leading-tight mt-0.5">
                    {artist.genre}
                  </p>
                </td>

                {/* Momentum + new markets */}
                <td className="px-2 py-2">
                  <MomentumPill
                    momentum={artist.momentum}
                    trend={artist.momentum_trend}
                    newMarkets={artist.new_markets_7d}
                  />
                </td>

                {/* Signal */}
                <td className="px-2 py-2 hidden lg:table-cell">
                  <SignalCell artist={artist} />
                </td>

                {/* Spend */}
                <td className="pl-2 pr-4 py-2">
                  <SpendCell artist={artist} />
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

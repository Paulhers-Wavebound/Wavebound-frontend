import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MarketingArtist } from "@/data/mockMarketingData";
import { getPriorityArtists } from "@/data/mockMarketingData";

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString();
}

const TYPE_STYLE: Record<
  string,
  { emoji: string; label: string; accent: string; border: string }
> = {
  breakout: {
    emoji: "\uD83D\uDD25",
    label: "BREAKOUT",
    accent: "#FF9F0A",
    border: "rgba(255,159,10,0.25)",
  },
  reallocate: {
    emoji: "\uD83D\uDD34",
    label: "REALLOCATE",
    accent: "#FF453A",
    border: "rgba(255,69,58,0.25)",
  },
  spillover_test: {
    emoji: "\uD83D\uDFE1",
    label: "SPILLOVER",
    accent: "#FFD60A",
    border: "rgba(255,214,10,0.25)",
  },
  window_closing: {
    emoji: "\u26A0\uFE0F",
    label: "CLOSING",
    accent: "#FF9F0A",
    border: "rgba(255,159,10,0.35)",
  },
};

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span
        className="text-sm font-semibold tabular-nums leading-none"
        style={{ color: color || "rgba(255,255,255,0.87)" }}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-white/30 leading-none">
        {label}
      </span>
    </div>
  );
}

function PriorityCard({ artist }: { artist: MarketingArtist }) {
  const navigate = useNavigate();
  const style =
    TYPE_STYLE[artist.priority_type || "breakout"] || TYPE_STYLE.breakout;
  const opp = artist.top_opportunity;
  const sig = artist.top_signal;
  const isReallocate = artist.priority_type === "reallocate";

  // Signal text
  const platformName =
    sig.platform.charAt(0).toUpperCase() + sig.platform.slice(1);
  const changeStr =
    typeof sig.change === "number"
      ? sig.change > 0
        ? `+${sig.change}`
        : `${sig.change}`
      : "NEW";

  // ROI color
  const roiColor =
    opp && opp.roi_vs_us > 2
      ? "#30D158"
      : opp && opp.roi_vs_us >= 1
        ? "#FFD60A"
        : "#FF453A";

  // Window bar
  const windowPct = opp?.window_days
    ? Math.min(Math.max(((21 - opp.window_days) / 21) * 100, 8), 95)
    : 0;
  const windowColor = opp?.window_days
    ? opp.window_days <= 5
      ? "#FF453A"
      : opp.window_days <= 10
        ? "#FFD60A"
        : "#30D158"
    : "#30D158";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(e) => {
        if (!(e as React.MouseEvent).isTrusted) return;
        navigate(`/label/artist/${artist.entity_id}`);
      }}
      className="rounded-xl p-4 cursor-pointer transition-all hover:brightness-110"
      style={{
        background: "#1C1C1E",
        borderLeft: `3px solid ${style.border}`,
        border: `1px solid rgba(255,255,255,0.04)`,
        borderLeftWidth: 3,
        borderLeftColor: style.accent,
      }}
    >
      {/* Row 1: type badge + artist + signal */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
          style={{ background: `${style.accent}20`, color: style.accent }}
        >
          {style.emoji} {style.label}
        </span>
        <span className="text-[13px] font-semibold text-white/87 truncate">
          {artist.artist_name}
        </span>
      </div>

      {/* Row 2: signal line — short and punchy */}
      <p className="text-xs text-white/55 mb-3 leading-snug">
        {isReallocate ? (
          <>
            {sig.country_name}{" "}
            {artist.momentum_trend === "declining" ? "declining" : "plateauing"}{" "}
            &middot; {fmt(artist.current_monthly_spend)}/mo at $
            {opp?.cpm?.toFixed(2)} CPM
          </>
        ) : (
          <>
            {platformName} {sig.country_name} #{sig.position} {changeStr}
            {opp?.spillover_markets && opp.spillover_markets.length > 0 && (
              <> &middot; Spillover: {opp.spillover_markets.join(", ")}</>
            )}
          </>
        )}
      </p>

      {/* Row 3: stat chips — the numbers that matter */}
      {opp && (
        <div
          className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg mb-3"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {isReallocate ? (
            <>
              <StatChip
                label="Current"
                value={fmt(artist.current_monthly_spend)}
              />
              <div className="w-px h-6 bg-white/[0.06]" />
              <StatChip
                label="Cut"
                value={`-${fmt(Math.abs(opp.suggested_budget))}`}
                color="#FF453A"
              />
              <div className="w-px h-6 bg-white/[0.06]" />
              <StatChip
                label="ROI"
                value={`${opp.roi_vs_us.toFixed(1)}x`}
                color={roiColor}
              />
            </>
          ) : (
            <>
              <StatChip
                label="Spend"
                value={
                  opp.suggested_budget > 0
                    ? fmt(opp.suggested_budget)
                    : fmt(artist.current_monthly_spend)
                }
                color={opp.suggested_budget > 0 ? "#30D158" : undefined}
              />
              <div className="w-px h-6 bg-white/[0.06]" />
              <StatChip
                label="ROI"
                value={`${opp.roi_vs_us.toFixed(1)}x`}
                color={roiColor}
              />
              <div className="w-px h-6 bg-white/[0.06]" />
              {opp.projected_reach ? (
                <StatChip label="Reach" value={fmtNum(opp.projected_reach)} />
              ) : (
                <StatChip label="CPM" value={`$${opp.cpm.toFixed(2)}`} />
              )}
              <div className="w-px h-6 bg-white/[0.06]" />
              <StatChip label="CPM" value={`$${opp.cpm.toFixed(2)}`} />
            </>
          )}
        </div>
      )}

      {/* Row 4: platform + cities (one line) */}
      {opp && !isReallocate && (
        <p className="text-[11px] text-white/35 mb-2 truncate">
          {opp.platform}
          {opp.cities.length > 0 && <> &mdash; {opp.cities.join(", ")}</>}
        </p>
      )}

      {/* Row 5: window + action */}
      <div className="flex items-center gap-3">
        {opp?.window_days && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${windowPct}%`, background: windowColor }}
              />
            </div>
            <span className="text-[10px] text-white/40 tabular-nums shrink-0">
              {opp.window_days}d
            </span>
          </div>
        )}
        {!opp?.window_days && <div className="flex-1" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/label/artist/${artist.entity_id}`);
          }}
          className="text-[11px] font-medium text-[#e8430a] hover:text-[#ff5a1f] transition-colors shrink-0"
        >
          {isReallocate ? "Reallocate \u2192" : "Launch Play \u2192"}
        </button>
      </div>
    </motion.div>
  );
}

export default function MarketingPriorityCards({
  artists,
}: {
  artists: MarketingArtist[];
}) {
  const priorityArtists = getPriorityArtists(artists);
  const [expanded, setExpanded] = useState(false);

  if (priorityArtists.length === 0) return null;

  const total = priorityArtists.length;

  return (
    <div className="space-y-3">
      {/* Collapsed: compact summary bar */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full rounded-xl border border-white/[0.06] px-4 py-3 flex items-center gap-3 text-left hover:border-white/10 transition-colors"
          style={{ background: "#1C1C1E" }}
        >
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40 shrink-0">
            Needs Attention
          </span>
          <span className="text-[12px] text-white/60 truncate flex-1">
            {priorityArtists[0].artist_name} &mdash;{" "}
            {priorityArtists[0].top_signal.platform.charAt(0).toUpperCase() +
              priorityArtists[0].top_signal.platform.slice(1)}{" "}
            {priorityArtists[0].top_signal.country_name} #
            {priorityArtists[0].top_signal.position}
            {total > 1 && (
              <span className="text-white/30"> +{total - 1} more</span>
            )}
          </span>
          <ChevronDown size={14} className="text-white/30 shrink-0" />
        </button>
      )}

      {/* Expanded: all cards */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Needs Your Attention Now
              </h2>
              <button
                onClick={() => setExpanded(false)}
                className="text-[11px] text-white/30 hover:text-white/50 transition-colors"
              >
                Collapse
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {priorityArtists.map((artist) => (
                <PriorityCard key={artist.entity_id} artist={artist} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

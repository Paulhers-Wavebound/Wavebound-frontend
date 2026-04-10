import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InfoPopover from "@/components/sound-intelligence/InfoPopover";
import type {
  ContentPriorityItem,
  ContentPriorityType,
} from "@/data/contentDashboardHelpers";

const TYPE_STYLE: Record<
  ContentPriorityType,
  { emoji: string; label: string; accent: string; border: string }
> = {
  POSTING_DROUGHT: {
    emoji: "\uD83D\uDCF5",
    label: "DROUGHT",
    accent: "#FF453A",
    border: "rgba(255,69,58,0.25)",
  },
  CONTENT_SPIKE: {
    emoji: "\uD83D\uDD25",
    label: "SPIKE",
    accent: "#30D158",
    border: "rgba(48,209,88,0.25)",
  },
  ENGAGEMENT_DROP: {
    emoji: "\uD83D\uDCC9",
    label: "DROP",
    accent: "#FF9F0A",
    border: "rgba(255,159,10,0.25)",
  },
  FORMAT_SHIFT: {
    emoji: "\uD83D\uDD04",
    label: "SHIFT",
    accent: "#0A84FF",
    border: "rgba(10,132,255,0.25)",
  },
  UGC_SURGE: {
    emoji: "\uD83D\uDC65",
    label: "UGC",
    accent: "#BF5AF2",
    border: "rgba(191,90,242,0.25)",
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
        className="text-sm font-semibold tabular-nums leading-none truncate max-w-[80px]"
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

function PriorityCard({ item }: { item: ContentPriorityItem }) {
  const navigate = useNavigate();
  const style = TYPE_STYLE[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/label/artists/${item.artist_handle}`)}
      className="rounded-xl p-4 cursor-pointer transition-all hover:brightness-110"
      style={{
        background: "#1C1C1E",
        border: "1px solid rgba(255,255,255,0.04)",
        borderLeftWidth: 3,
        borderLeftColor: style.accent,
      }}
    >
      {/* Row 1: type badge + artist */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
          style={{ background: `${style.accent}20`, color: style.accent }}
        >
          {style.emoji} {style.label}
        </span>
        <span className="text-[13px] font-semibold text-white/87 truncate">
          {item.artist_name}
        </span>
      </div>

      {/* Row 2: headline */}
      <p className="text-xs text-white/55 mb-1 leading-snug">{item.headline}</p>

      {/* Row 3: detail */}
      <p className="text-[11px] text-white/35 mb-3 leading-snug line-clamp-2">
        {item.detail}
      </p>

      {/* Row 4: stat chips */}
      <div
        className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg mb-3"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {item.stats.map((s, i) => (
          <div key={s.label} className="contents">
            {i > 0 && <div className="w-px h-6 bg-white/[0.06]" />}
            <StatChip label={s.label} value={s.value} color={s.color} />
          </div>
        ))}
      </div>

      {/* Row 5: action */}
      <div className="flex items-center justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/label/artists/${item.artist_handle}`);
          }}
          className="text-[11px] font-medium text-[#e8430a] hover:text-[#ff5a1f] transition-colors"
        >
          View Profile &rarr;
        </button>
      </div>
    </motion.div>
  );
}

export default function ContentPriorityCards({
  items,
}: {
  items: ContentPriorityItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const total = items.length;

  return (
    <div className="space-y-3">
      {/* Collapsed: compact summary bar */}
      {!expanded && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 min-w-0 rounded-xl border border-white/[0.06] px-4 py-3 flex items-center gap-3 text-left hover:border-white/10 transition-colors"
            style={{ background: "#1C1C1E" }}
          >
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40 shrink-0">
              Needs Attention
            </span>
            <span className="text-[12px] text-white/60 truncate flex-1">
              {items[0].artist_name} &mdash; {items[0].headline}
              {total > 1 && (
                <span className="text-white/30"> +{total - 1} more</span>
              )}
            </span>
            <ChevronDown size={14} className="text-white/30 shrink-0" />
          </button>
          <InfoPopover
            text="Priority alerts triggered by your roster data. Drought: no posts in 7+ days. Spike: viral video at 2x+ above median. Drop: engagement falling significantly. Shift: primary content format changed. UGC: fan-created content surging for a sound."
            width={300}
          />
        </div>
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
              <div className="flex items-center gap-2">
                <h2
                  className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                >
                  Needs Your Attention Now
                </h2>
                <InfoPopover
                  text="Priority alerts triggered by your roster data. Drought: no posts in 7+ days. Spike: viral video at 2x+ above median. Drop: engagement falling significantly. Shift: primary content format changed. UGC: fan-created content surging for a sound."
                  width={300}
                />
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-[11px] text-white/30 hover:text-white/50 transition-colors"
              >
                Collapse
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((item, i) => (
                <PriorityCard
                  key={`${item.type}-${item.artist_handle}-${i}`}
                  item={item}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

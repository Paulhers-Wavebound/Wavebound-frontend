/**
 * A&R Council Brief — mirrors SignalReportCard.tsx pattern
 *
 * "Good morning, Council." greeting + pipeline pulse + 5 decision point rows
 * with collapsible section and evidence chips.
 */
import { useRef, useState } from "react";
import {
  TrendingUp,
  Compass,
  FlaskConical,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ARDecisionCategory,
  ARDecisionPoint,
  ARProspect,
} from "@/types/arTypes";
import { getPipelineDistribution } from "@/hooks/useARData";

interface BriefData {
  headline: string;
  decision_points: ARDecisionPoint[];
  roster_pulse: string;
  pipeline_distribution: Record<string, number>;
  generated_at: string | null;
  empty?: boolean;
}

/* ─── Category config ─────────────────────────────────────── */

const CATEGORY_CONFIG: Record<
  ARDecisionCategory,
  { label: string; icon: typeof TrendingUp; color: string }
> = {
  SCALE_NOW: { label: "Scale Now", icon: TrendingUp, color: "#30D158" },
  REALLOCATE: { label: "Reallocate", icon: Compass, color: "#FFD60A" },
  PIPELINE: { label: "Pipeline", icon: FlaskConical, color: "#0A84FF" },
  GREENLIGHT_READY: {
    label: "Greenlight Ready",
    icon: CheckCircle2,
    color: "#BF5AF2",
  },
  RISK: { label: "Risk", icon: ShieldAlert, color: "#FF453A" },
};

const URGENCY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  now: { label: "NOW", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  today: { label: "TODAY", color: "#FF9F0A", bg: "rgba(255,159,10,0.10)" },
  this_week: {
    label: "THIS WEEK",
    color: "rgba(255,255,255,0.40)",
    bg: "rgba(255,255,255,0.04)",
  },
};

/* ─── Decision Point Row ──────────────────────────────────── */

function DecisionPointRow({
  dp,
  index,
}: {
  dp: ARDecisionPoint;
  index: number;
}) {
  const cat = CATEGORY_CONFIG[dp.category];
  const urg = URGENCY_CONFIG[dp.urgency];
  const Icon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="flex gap-3 py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Category icon */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${cat.color}15` }}
      >
        <Icon size={15} style={{ color: cat.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: category + urgency + artist */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: cat.color }}
          >
            {cat.label}
          </span>
          <span
            className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{ color: urg.color, background: urg.bg }}
          >
            {urg.label}
          </span>
          {dp.artist_name && (
            <span className="text-[11px] text-white/40 truncate">
              {dp.artist_name}
            </span>
          )}
        </div>

        {/* Signal */}
        <p
          className="text-[13px] leading-relaxed mb-1"
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            color: "rgba(255,255,255,0.80)",
          }}
        >
          {dp.signal}
        </p>

        {/* Decision */}
        <p
          className="text-[13px] leading-relaxed mb-2"
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            color: "rgba(255,255,255,0.60)",
          }}
        >
          <ArrowRight
            size={11}
            className="inline -mt-0.5 mr-1"
            style={{ color: cat.color }}
          />
          {dp.decision}
        </p>

        {/* Evidence chips */}
        {dp.evidence.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {dp.evidence.map((e, i) => (
              <span
                key={i}
                className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]"
                style={{ color: e.color || "rgba(255,255,255,0.50)" }}
              >
                {e.label}: {e.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Collapsible Decision Points ────────────────────────── */

const PEEK_HEIGHT = 120;

function DecisionPointsSection({
  isOpen,
  onToggle,
  decisionPoints,
}: {
  isOpen: boolean;
  onToggle: () => void;
  decisionPoints: ARDecisionPoint[];
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-7 pb-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full pt-3 pb-2 border-t border-white/[0.06]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/30">
            Decision Points
          </span>
          <span className="text-[10px] text-white/20 tabular-nums">
            {decisionPoints.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.30)" }} />
        </motion.div>
      </button>

      <motion.div
        animate={{
          height: isOpen
            ? (contentRef.current?.scrollHeight ?? "auto")
            : PEEK_HEIGHT,
        }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        style={{ overflow: "hidden", position: "relative" }}
        onClick={!isOpen ? onToggle : undefined}
        className={!isOpen ? "cursor-pointer" : undefined}
      >
        {/* Fade mask when collapsed */}
        <motion.div
          animate={{ opacity: isOpen ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            background:
              "linear-gradient(to bottom, transparent 15%, #1C1C1E 95%)",
          }}
        />
        <div ref={contentRef}>
          {decisionPoints.map((dp, i) => (
            <DecisionPointRow key={i} dp={dp} index={i} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Card ───────────────────────────────────────────── */

export default function ARSignalReportCard({
  prospects,
  brief,
}: {
  prospects: ARProspect[];
  brief: BriefData | null;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [decisionsOpen, setDecisionsOpen] = useState(false);

  const decisionPoints = brief?.decision_points ?? [];
  const dist = brief?.pipeline_distribution ?? getPipelineDistribution(prospects);
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const avgRiseProb =
    prospects.length > 0
      ? (
          prospects.reduce((s, p) => s + p.rise_probability, 0) /
          prospects.length
        ).toFixed(1)
      : "0";

  const greenlightReady = prospects.filter(
    (p) => p.deal_status !== null,
  ).length;
  const botFlags = prospects.filter((p) =>
    p.risk_flags.some((f) => f.toLowerCase().includes("bot")),
  ).length;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-white/[0.06]"
          style={{ background: "#1C1C1E" }}
        >
          {/* Header */}
          <div className="px-7 pt-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2
                  className="text-[13px] font-medium tracking-wide"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: "rgba(255,255,255,0.50)",
                    letterSpacing: "0.04em",
                  }}
                >
                  A&R Council Brief
                </h2>
                <span
                  className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: "#e8430a",
                    background: "rgba(232,67,10,0.12)",
                  }}
                >
                  {today}
                </span>
              </div>

              {/* Metric pills */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]">
                  <span className="text-white/30 mr-1">Pipeline</span>
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>
                    {prospects.length}
                  </span>
                </span>
                <span className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]">
                  <span className="text-white/30 mr-1">Avg Rise</span>
                  <span style={{ color: "#0A84FF" }}>{avgRiseProb}</span>
                </span>
                <span className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]">
                  <span className="text-white/30 mr-1">Greenlight</span>
                  <span style={{ color: "#30D158" }}>{greenlightReady}</span>
                </span>
                {botFlags > 0 && (
                  <span className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]">
                    <span className="text-white/30 mr-1">Bot Flags</span>
                    <span style={{ color: "#FF453A" }}>{botFlags}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-[28px] md:text-[32px] leading-tight mb-3"
              style={{
                fontFamily: '"Playfair Display", serif',
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {brief?.headline || "Good morning, Council."}
            </h1>

            {/* Roster Pulse */}
            <p
              className="text-[14px] leading-[1.7] mb-4"
              style={{
                fontFamily: '"Tiempos Text", Georgia, serif',
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {brief?.roster_pulse ||
                prospects.length + " prospects in pipeline. Enrichment in progress."}
            </p>

            {/* Pipeline stage distribution */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {Object.entries(dist).map(([stage, count]) => {
                const colors: Record<string, string> = {
                  flagging: "#8E8E93",
                  deep_dive: "#0A84FF",
                  assessment: "#FFD60A",
                  validation: "#BF5AF2",
                  execution: "#30D158",
                };
                const labels: Record<string, string> = {
                  flagging: "Flagging",
                  deep_dive: "Deep Dive",
                  assessment: "Assessment",
                  validation: "Validation",
                  execution: "Execution",
                };
                return (
                  <span
                    key={stage}
                    className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded"
                    style={{
                      color: colors[stage] || "rgba(255,255,255,0.50)",
                      background: `${colors[stage] || "rgba(255,255,255,0.50)"}12`,
                    }}
                  >
                    {labels[stage] || stage} {count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Decision Points */}
          {decisionPoints.length > 0 && (
            <DecisionPointsSection
              isOpen={decisionsOpen}
              onToggle={() => setDecisionsOpen(!decisionsOpen)}
              decisionPoints={decisionPoints}
            />
          )}

          {/* Footer */}
          <div className="px-7 py-3 flex items-center justify-between border-t border-white/[0.04]">
            <button
              onClick={() => setDismissed(true)}
              className="text-[12px] text-white/30 hover:text-white/50 transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Signability Scorecard — 4 horizontal pills with score circles + expandable factors.
 * Creative | Commercial | Legal Pulse | 360 Upside
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SignabilityScore } from "@/types/arTypes";

/* ─── Score circle (SVG ring) ─────────────────────────────── */

function ScoreRing({
  score,
  color,
  size = 44,
}: {
  score: number;
  color: string;
  size?: number;
}) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[12px] font-bold tabular-nums"
        style={{ fontFamily: '"JetBrains Mono", monospace', color }}
      >
        {score}
      </span>
    </div>
  );
}

/* ─── Pill card ───────────────────────────────────────────── */

function ScorePill({
  label,
  score,
  factors,
  color,
  extra,
}: {
  label: string;
  score: number;
  factors: string[];
  color: string;
  extra?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex-1 min-w-[200px] rounded-xl border border-white/[0.06] p-4 cursor-pointer transition-colors hover:bg-white/[0.02]"
      style={{ background: "#1C1C1E" }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <ScoreRing score={score} color={color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-white/70">
              {label}
            </span>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={12} className="text-white/25" />
            </motion.div>
          </div>
          {extra}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1.5">
              {factors.map((f, i) => (
                <p key={i} className="text-[11px] text-white/45 leading-snug">
                  {f}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Scorecard ───────────────────────────────────────────── */

export default function SignabilityScorecard({
  signability,
}: {
  signability: SignabilityScore;
}) {
  const scoreColor = (s: number) =>
    s >= 80 ? "#30D158" : s >= 60 ? "#0A84FF" : s >= 40 ? "#FFD60A" : "#FF453A";

  return (
    <div className="flex gap-3 flex-wrap">
      <ScorePill
        label="Creative"
        score={signability.creative.score}
        factors={signability.creative.factors}
        color={scoreColor(signability.creative.score)}
      />
      <ScorePill
        label="Commercial"
        score={signability.commercial.score}
        factors={signability.commercial.factors}
        color={scoreColor(signability.commercial.score)}
      />
      <ScorePill
        label="Legal Pulse"
        score={signability.legal_pulse.score}
        factors={signability.legal_pulse.factors}
        color={scoreColor(signability.legal_pulse.score)}
      />
      <ScorePill
        label="360 Upside"
        score={signability.three_sixty_upside.score}
        factors={[
          `Live: ${signability.three_sixty_upside.live_pct}%`,
          `Merch: ${signability.three_sixty_upside.merch_pct}%`,
          `Endorsements: ${signability.three_sixty_upside.endorsement_pct}%`,
        ]}
        color={scoreColor(signability.three_sixty_upside.score)}
        extra={
          <div className="flex items-center gap-2 mt-1">
            {[
              { label: "Live", pct: signability.three_sixty_upside.live_pct },
              { label: "Merch", pct: signability.three_sixty_upside.merch_pct },
              {
                label: "Endorse",
                pct: signability.three_sixty_upside.endorsement_pct,
              },
            ].map((item) => (
              <span
                key={item.label}
                className="text-[9px] text-white/30 tabular-nums"
              >
                {item.label} {item.pct}%
              </span>
            ))}
          </div>
        }
      />
    </div>
  );
}

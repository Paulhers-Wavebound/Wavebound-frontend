/**
 * Scout Dossier Panel — slide-in right panel showing AI-generated dossier
 * for a prospect. Opens on click from the Scout Radar.
 *
 * Sections: Narrative Summary, Unreleased Test, Threshold Check,
 * Trigger Markets, Comment Intent, Cross-Platform Funnel, Competitive Flags.
 */
import { X, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ARProspect } from "@/types/arTypes";
import {
  getRiseProbabilityColor,
  PIPELINE_STAGE_CONFIG,
} from "@/types/arTypes";

/* ─── Threshold checks from Bible §2 ─────────────────────── */

interface ThresholdCheck {
  label: string;
  value: string;
  passed: boolean;
}

function getThresholdChecks(p: ARProspect): ThresholdCheck[] {
  const m = p.metrics;
  return [
    {
      label: "Spotify ML",
      value: `${(m.spotify_monthly_listeners / 1000).toFixed(0)}K`,
      passed: m.spotify_monthly_listeners >= 50000,
    },
    {
      label: "Follower Growth MoM",
      value: `${m.spotify_follower_growth_mom}%`,
      passed: m.spotify_follower_growth_mom >= 15,
    },
    {
      label: "Social Engagement",
      value: `${m.social_engagement_rate}%`,
      passed: m.social_engagement_rate >= 5,
    },
    {
      label: "Save Rate",
      value: `${m.spotify_save_rate}%`,
      passed: m.spotify_save_rate >= 10,
    },
    {
      label: "Track Completion (30s)",
      value: `${m.track_completion_rate_30s}%`,
      passed: m.track_completion_rate_30s >= 60,
    },
    {
      label: "Live Capacity",
      value: m.live_ticket_capacity ? `${m.live_ticket_capacity} cap` : "N/A",
      passed: m.live_ticket_capacity != null && m.live_ticket_capacity >= 100,
    },
  ];
}

/* ─── Country flag helper ─────────────────────────────────── */

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/* ─── Comment Intent Bar ──────────────────────────────────── */

function IntentBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-20 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-white/40 w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

/* ─── Panel ───────────────────────────────────────────────── */

export default function ScoutDossierPanel({
  prospect,
  onClose,
}: {
  prospect: ARProspect | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {prospect && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[420px] max-w-[90vw] overflow-y-auto border-l border-white/[0.06]"
            style={{ background: "#1C1C1E" }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]"
              style={{ background: "#1C1C1E" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] text-white/50 font-semibold text-[14px]">
                  {prospect.artist_name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white/87">
                    {prospect.artist_name}
                  </h2>
                  <span className="text-[11px] text-white/40">
                    {countryFlag(prospect.origin_country)} {prospect.genre}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X size={16} className="text-white/40" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Rise Probability + Stage */}
              <div className="flex items-center gap-3">
                <span
                  className="text-[28px] font-bold tabular-nums"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color: getRiseProbabilityColor(prospect.rise_probability),
                  }}
                >
                  {prospect.rise_probability.toFixed(1)}
                </span>
                <div>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider block">
                    Rise Probability
                  </span>
                  <span
                    className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded inline-block mt-0.5"
                    style={{
                      color:
                        PIPELINE_STAGE_CONFIG[prospect.pipeline_stage].color,
                      background:
                        PIPELINE_STAGE_CONFIG[prospect.pipeline_stage].bg,
                    }}
                  >
                    {PIPELINE_STAGE_CONFIG[prospect.pipeline_stage].label}
                  </span>
                </div>
                {prospect.ghost_curve_match && (
                  <div className="ml-auto text-right">
                    <span className="text-[10px] text-white/30 block">
                      Ghost Curve
                    </span>
                    <span className="text-[12px] text-white/60">
                      {prospect.ghost_curve_match.artist_name}{" "}
                      <span
                        className="font-semibold tabular-nums"
                        style={{
                          color:
                            prospect.ghost_curve_match.match_pct >= 75
                              ? "#30D158"
                              : "#0A84FF",
                        }}
                      >
                        {prospect.ghost_curve_match.match_pct}%
                      </span>{" "}
                      <span className="text-white/25">
                        wk {prospect.ghost_curve_match.week_offset}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* ── Narrative Summary ─────────────────────────── */}
              <div>
                <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
                  AI Narrative
                </h3>
                <p
                  className="text-[13px] leading-[1.7]"
                  style={{
                    fontFamily: '"Tiempos Text", Georgia, serif',
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  {prospect.ai_narrative}
                </p>
              </div>

              {/* ── Unreleased Test ───────────────────────────── */}
              {prospect.unreleased_test && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/[0.06]"
                  style={{ background: "rgba(48,209,88,0.06)" }}
                >
                  <CheckCircle2 size={16} style={{ color: "#30D158" }} />
                  <div>
                    <span className="text-[12px] font-medium text-white/70">
                      Unreleased Test: {prospect.unreleased_test.label}
                    </span>
                    <span className="text-[11px] text-white/40 ml-2 tabular-nums">
                      Score {prospect.unreleased_test.score}/100
                    </span>
                  </div>
                </div>
              )}

              {/* ── Scouting Threshold Check ──────────────────── */}
              <div>
                <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
                  Scouting Thresholds
                </h3>
                <div className="space-y-1.5">
                  {getThresholdChecks(prospect).map((check) => (
                    <div key={check.label} className="flex items-center gap-2">
                      {check.passed ? (
                        <CheckCircle2 size={12} style={{ color: "#30D158" }} />
                      ) : (
                        <XCircle size={12} style={{ color: "#FF453A" }} />
                      )}
                      <span className="text-[11px] text-white/55 flex-1">
                        {check.label}
                      </span>
                      <span
                        className="text-[11px] tabular-nums font-medium"
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: check.passed
                            ? "rgba(255,255,255,0.55)"
                            : "#FF453A",
                        }}
                      >
                        {check.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Trigger Markets ───────────────────────────── */}
              {prospect.trigger_markets.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
                    Trigger Markets
                  </h3>
                  <div className="space-y-1.5">
                    {prospect.trigger_markets.map((m) => (
                      <div
                        key={`${m.country_code}-${m.platform}`}
                        className="flex items-center gap-2"
                      >
                        <span className="text-[13px]">
                          {countryFlag(m.country_code)}
                        </span>
                        <span className="text-[11px] text-white/60 flex-1 truncate">
                          {m.country_name}
                        </span>
                        <span className="text-[10px] text-white/35">
                          {m.platform}
                        </span>
                        {m.position != null && (
                          <span
                            className="text-[11px] tabular-nums font-medium"
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              color: "rgba(255,255,255,0.55)",
                            }}
                          >
                            #{m.position}
                          </span>
                        )}
                        {m.is_early_adopter && (
                          <span
                            className="text-[8px] font-semibold tracking-wider uppercase px-1 py-0.5 rounded"
                            style={{
                              color: "#e8430a",
                              background: "rgba(232,67,10,0.12)",
                            }}
                          >
                            Early
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Comment Intent ────────────────────────────── */}
              <div>
                <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
                  Comment Intent
                  <span className="ml-2 text-white/20 normal-case tabular-nums">
                    {prospect.comment_intent.total_analyzed.toLocaleString()}{" "}
                    analyzed
                  </span>
                </h3>
                <div className="space-y-1.5">
                  <IntentBar
                    label="Emoji Only"
                    pct={prospect.comment_intent.distribution.emoji_only}
                    color="#8E8E93"
                  />
                  <IntentBar
                    label="Casual"
                    pct={prospect.comment_intent.distribution.casual_praise}
                    color="rgba(255,255,255,0.35)"
                  />
                  <IntentBar
                    label="Recognition"
                    pct={
                      prospect.comment_intent.distribution.artist_recognition
                    }
                    color="#0A84FF"
                  />
                  <IntentBar
                    label="Event Intent"
                    pct={prospect.comment_intent.distribution.event_intent}
                    color="#30D158"
                  />
                  <IntentBar
                    label="Purchase"
                    pct={prospect.comment_intent.distribution.purchase_intent}
                    color="#e8430a"
                  />
                  <IntentBar
                    label="Collab"
                    pct={prospect.comment_intent.distribution.collab_request}
                    color="#BF5AF2"
                  />
                </div>
                {prospect.comment_intent.top_signals.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {prospect.comment_intent.top_signals
                      .slice(0, 3)
                      .map((sig, i) => (
                        <p
                          key={i}
                          className="text-[11px] pl-3 border-l-2 border-white/[0.06]"
                          style={{
                            fontFamily: '"Tiempos Text", Georgia, serif',
                            color: "rgba(255,255,255,0.50)",
                            fontStyle: "italic",
                          }}
                        >
                          "{sig}"
                        </p>
                      ))}
                  </div>
                )}
              </div>

              {/* ── Cross-Platform Migration ──────────────────── */}
              <div>
                <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
                  Cross-Platform Migration
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      label: "TikTok → Spotify",
                      value: prospect.cross_platform.tiktok_to_spotify,
                    },
                    {
                      label: "Spotify → IG Follow",
                      value: prospect.cross_platform.spotify_to_ig_follow,
                    },
                    ...(prospect.cross_platform.ig_to_merch != null
                      ? [
                          {
                            label: "IG → Merch/Ticket",
                            value: prospect.cross_platform.ig_to_merch,
                          },
                        ]
                      : []),
                  ].map((step) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <ArrowRight
                        size={10}
                        className="text-white/20 shrink-0"
                      />
                      <span className="text-[11px] text-white/50 flex-1">
                        {step.label}
                      </span>
                      <span
                        className="text-[11px] tabular-nums font-medium"
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color:
                            step.value >= 3
                              ? "#30D158"
                              : step.value >= 1
                                ? "#0A84FF"
                                : "#FF453A",
                        }}
                      >
                        {step.value.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/30">
                      Funnel Health:
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        color:
                          prospect.cross_platform.funnel_health === "strong"
                            ? "#30D158"
                            : prospect.cross_platform.funnel_health ===
                                "moderate"
                              ? "#FFD60A"
                              : "#FF453A",
                      }}
                    >
                      {prospect.cross_platform.funnel_health}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Risk Flags ────────────────────────────────── */}
              {prospect.risk_flags.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
                    Risk Flags
                  </h3>
                  <div className="space-y-1.5">
                    {prospect.risk_flags.map((flag, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg"
                        style={{
                          background: "rgba(255,69,58,0.06)",
                          border: "1px solid rgba(255,69,58,0.12)",
                        }}
                      >
                        <XCircle
                          size={12}
                          className="shrink-0 mt-0.5"
                          style={{ color: "#FF453A" }}
                        />
                        <span className="text-[11px] text-white/60">
                          {flag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

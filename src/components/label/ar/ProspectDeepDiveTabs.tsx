/**
 * Prospect Deep Dive Tabs — tabbed content for the drill-down page.
 * Threshold Check | Geography | Format Trends | Comment Intent |
 * Cross-Platform | Ghost Curve | Development Roadmap
 */
import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Music2,
  Users,
  Play,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Clock,
  ChevronDown,
  ExternalLink,
  Sparkles,
  Dna,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { ARProspect, EnrichedVideo } from "@/types/arTypes";
import { getRiseProbabilityColor } from "@/types/arTypes";

/* ─── Helpers ─────────────────────────────────────────────── */

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/* ─── Tab definitions ─────────────────────────────────────── */

const TABS = [
  "Threshold Check",
  "Geography",
  "Format Trends",
  "Comment Intent",
  "Cross-Platform",
  "Ghost Curve",
  "Videos",
  "Content DNA",
  "Development",
] as const;

type Tab = (typeof TABS)[number];

/* ─── Threshold Check ─────────────────────────────────────── */

function ThresholdCheckTab({ prospect }: { prospect: ARProspect }) {
  const m = prospect.metrics;
  const checks = [
    {
      label: "Spotify Monthly Listeners",
      value: `${(m.spotify_monthly_listeners / 1000).toFixed(0)}K`,
      threshold: "50K-100K+",
      passed: m.spotify_monthly_listeners >= 50000,
    },
    {
      label: "Spotify Follower Growth MoM",
      value: `${m.spotify_follower_growth_mom}%`,
      threshold: ">15%",
      passed: m.spotify_follower_growth_mom >= 15,
    },
    {
      label: "TikTok + IG Followers",
      value: `${((m.tiktok_followers + m.instagram_followers) / 1000).toFixed(0)}K`,
      threshold: "10K+ combined",
      passed: m.tiktok_followers + m.instagram_followers >= 10000,
    },
    {
      label: "Social Engagement Rate",
      value: `${m.social_engagement_rate}%`,
      threshold: ">5%",
      passed: m.social_engagement_rate >= 5,
    },
    {
      label: "Spotify Save Rate",
      value: `${m.spotify_save_rate}%`,
      threshold: ">10%",
      passed: m.spotify_save_rate >= 10,
    },
    {
      label: "Track Completion (30s)",
      value: `${m.track_completion_rate_30s}%`,
      threshold: ">60%",
      passed: m.track_completion_rate_30s >= 60,
    },
    {
      label: "Live Ticket Sales",
      value: m.live_ticket_capacity
        ? `${m.live_ticket_capacity} cap, ${m.live_sellout_pct}% sold`
        : "No data",
      threshold: "100-250 cap sell-outs",
      passed: m.live_ticket_capacity != null && m.live_ticket_capacity >= 100,
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[12px] text-white/55">
          {passedCount}/{checks.length} thresholds met
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(passedCount / checks.length) * 100}%`,
              background:
                passedCount >= 5
                  ? "#30D158"
                  : passedCount >= 3
                    ? "#FFD60A"
                    : "#FF453A",
            }}
          />
        </div>
      </div>

      {checks.map((check) => (
        <div
          key={check.label}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/[0.04]"
          style={{
            background: check.passed
              ? "rgba(48,209,88,0.03)"
              : "rgba(255,69,58,0.03)",
          }}
        >
          {check.passed ? (
            <CheckCircle2 size={16} style={{ color: "#30D158" }} />
          ) : (
            <XCircle size={16} style={{ color: "#FF453A" }} />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[12px] text-white/70">{check.label}</span>
            <span className="text-[10px] text-white/30 ml-2">
              ({check.threshold})
            </span>
          </div>
          <span
            className="text-[13px] tabular-nums font-semibold"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: check.passed ? "#30D158" : "#FF453A",
            }}
          >
            {check.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Geography ───────────────────────────────────────────── */

function GeographyTab({ prospect }: { prospect: ARProspect }) {
  return (
    <div className="space-y-2">
      {prospect.trigger_markets.map((m) => (
        <div
          key={`${m.country_code}-${m.platform}`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/[0.04]"
        >
          <span className="text-[16px]">{countryFlag(m.country_code)}</span>
          <div className="flex-1 min-w-0">
            <span className="text-[12px] text-white/70">{m.country_name}</span>
            <span className="text-[10px] text-white/30 ml-2">{m.region}</span>
          </div>
          <span className="text-[10px] text-white/40">{m.platform}</span>
          {m.position != null && (
            <span
              className="text-[12px] tabular-nums font-semibold"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(255,255,255,0.60)",
              }}
            >
              #{m.position}
            </span>
          )}
          <div className="w-16 h-2 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${m.velocity_score}%`,
                background: m.is_early_adopter ? "#e8430a" : "#0A84FF",
              }}
            />
          </div>
          {m.is_early_adopter && (
            <span
              className="text-[8px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0"
              style={{ color: "#e8430a", background: "rgba(232,67,10,0.12)" }}
            >
              Early Adopter
            </span>
          )}
        </div>
      ))}

      {prospect.trigger_markets.length === 0 && (
        <div className="py-8 text-center text-[13px] text-white/30">
          No trigger markets detected yet.
        </div>
      )}
    </div>
  );
}

/* ─── Format Trends ───────────────────────────────────────── */

const FORMAT_COLORS: Record<string, string> = {
  Original: "#8E8E93",
  "Sped Up": "#FF453A",
  Slowed: "#0A84FF",
  Acoustic: "#FFD60A",
  Live: "#30D158",
};

function FormatTrendsTab({ prospect }: { prospect: ARProspect }) {
  const data = prospect.format_alpha.formats_tested.map((f) => ({
    ...f,
    fill: FORMAT_COLORS[f.format] || "#8E8E93",
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Music2 size={14} className="text-white/30" />
        <span className="text-[12px] text-white/55">
          Best format:{" "}
          <span
            style={{
              color:
                FORMAT_COLORS[prospect.format_alpha.best_format] || "#e8430a",
            }}
          >
            {prospect.format_alpha.best_format}
          </span>
          {prospect.format_alpha.best_format_engagement_lift > 0 && (
            <span className="ml-1 text-[11px]" style={{ color: "#30D158" }}>
              +{prospect.format_alpha.best_format_engagement_lift}% lift
            </span>
          )}
        </span>
      </div>

      {/* Engagement rate chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="20%">
          <XAxis
            dataKey="format"
            tick={{ fill: "rgba(255,255,255,0.40)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.30)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#1C1C1E",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              fontSize: 11,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.60)" }}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />
          <Bar
            dataKey="engagement_rate"
            name="Engagement"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Detail table */}
      <div className="space-y-1.5">
        {data.map((f) => (
          <div key={f.format} className="flex items-center gap-3 text-[11px]">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: f.fill }}
            />
            <span className="text-white/55 w-20">{f.format}</span>
            <span className="text-white/40 tabular-nums">
              Eng {f.engagement_rate}%
            </span>
            <span className="text-white/40 tabular-nums">
              Save {f.save_rate}%
            </span>
            <span className="text-white/40 tabular-nums">
              Comp {f.completion_rate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comment Intent ──────────────────────────────────────── */

function CommentIntentTab({ prospect }: { prospect: ARProspect }) {
  const d = prospect.comment_intent.distribution;
  const segments = [
    { label: "Emoji Only", pct: d.emoji_only, color: "#8E8E93" },
    {
      label: "Casual Praise",
      pct: d.casual_praise,
      color: "rgba(255,255,255,0.40)",
    },
    {
      label: "Artist Recognition",
      pct: d.artist_recognition,
      color: "#0A84FF",
    },
    { label: "Event Intent", pct: d.event_intent, color: "#30D158" },
    { label: "Purchase Intent", pct: d.purchase_intent, color: "#e8430a" },
    { label: "Collab Request", pct: d.collab_request, color: "#BF5AF2" },
  ];

  const highIntent = d.event_intent + d.purchase_intent + d.collab_request;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Users size={14} className="text-white/30" />
        <span className="text-[12px] text-white/55">
          {prospect.comment_intent.total_analyzed.toLocaleString()} comments
          analyzed
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: highIntent >= 25 ? "#30D158" : "#FFD60A" }}
        >
          {highIntent}% high-intent
        </span>
      </div>

      {/* Stacked horizontal bar */}
      <div className="h-6 rounded-full overflow-hidden flex">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${seg.pct}%`, background: seg.color }}
            title={`${seg.label}: ${seg.pct}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: seg.color }}
            />
            <span className="text-[11px] text-white/50 flex-1">
              {seg.label}
            </span>
            <div className="w-24 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${seg.pct}%`, background: seg.color }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-white/40 w-8 text-right">
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Top signals */}
      {prospect.comment_intent.top_signals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/25 block mb-2">
            Top Signals
          </span>
          {prospect.comment_intent.top_signals.map((sig, i) => (
            <p
              key={i}
              className="text-[12px] pl-3 py-1 border-l-2 border-white/[0.06] mb-1.5"
              style={{
                fontFamily: '"Tiempos Text", Georgia, serif',
                color: "rgba(255,255,255,0.55)",
                fontStyle: "italic",
              }}
            >
              "{sig}"
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Cross-Platform Migration ────────────────────────────── */

function CrossPlatformTab({ prospect }: { prospect: ARProspect }) {
  const cp = prospect.cross_platform;
  const steps = [
    {
      from: "TikTok Discovery",
      to: "Spotify Stream",
      rate: cp.tiktok_to_spotify,
    },
    { from: "Spotify Stream", to: "IG Follow", rate: cp.spotify_to_ig_follow },
    ...(cp.ig_to_merch != null
      ? [{ from: "IG Follow", to: "Merch / Ticket", rate: cp.ig_to_merch }]
      : []),
  ];

  const healthColor =
    cp.funnel_health === "strong"
      ? "#30D158"
      : cp.funnel_health === "moderate"
        ? "#FFD60A"
        : "#FF453A";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-white/55">Funnel Health:</span>
        <span
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: healthColor }}
        >
          {cp.funnel_health}
        </span>
        <span className="text-[10px] text-white/30">
          Trend: {cp.migration_trend}
        </span>
      </div>

      {/* Funnel visualization */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1 text-right">
              <span className="text-[11px] text-white/50">{step.from}</span>
            </div>
            <div className="w-24 flex items-center gap-2">
              <ArrowRight size={12} className="text-white/20 shrink-0" />
              <div className="flex-1 h-6 rounded bg-white/[0.04] overflow-hidden relative">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${Math.min(step.rate * 15, 100)}%`,
                    background:
                      step.rate >= 3
                        ? "#30D158"
                        : step.rate >= 1
                          ? "#0A84FF"
                          : "#FF453A",
                  }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-white/70"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {step.rate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-white/50">{step.to}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Alpha */}
      <div className="px-4 py-3 rounded-lg border border-white/[0.04] mt-4">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">
          Conversion Alpha
        </span>
        <span
          className="text-[18px] font-bold tabular-nums block mt-1"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            color:
              prospect.metrics.conversion_alpha >= 3
                ? "#30D158"
                : prospect.metrics.conversion_alpha >= 1.5
                  ? "#0A84FF"
                  : "#FF453A",
          }}
        >
          {prospect.metrics.conversion_alpha.toFixed(1)}%
        </span>
        <span className="text-[10px] text-white/30">
          Casual listener → superfan ratio
        </span>
      </div>
    </div>
  );
}

/* ─── Ghost Curve ─────────────────────────────────────────── */

function GhostCurveTab({ prospect }: { prospect: ARProspect }) {
  if (!prospect.ghost_curve_match) {
    return (
      <div className="py-12 text-center text-[13px] text-white/30">
        No Ghost Curve match above 50% found for this prospect.
      </div>
    );
  }

  const gc = prospect.ghost_curve_match;
  // Build chart data from sparkline
  const chartData = prospect.sparkline_data.map((val, i) => ({
    week: i + 1,
    prospect: val,
    // Simulate the reference curve slightly offset
    reference:
      val * (1 + (100 - gc.match_pct) / 200) + (Math.random() - 0.5) * 4,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[12px] text-white/55">
          Comparing to{" "}
          <span className="font-medium text-white/70">{gc.artist_name}</span> at
          week {gc.week_offset}
        </span>
        <span
          className="text-[14px] font-bold tabular-nums"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            color: gc.match_pct >= 75 ? "#30D158" : "#0A84FF",
          }}
        >
          {gc.match_pct}% match
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="prospectGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={getRiseProbabilityColor(prospect.rise_probability)}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={getRiseProbabilityColor(prospect.rise_probability)}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fill: "rgba(255,255,255,0.30)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `W${v}`}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#1C1C1E",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="reference"
            name={gc.artist_name}
            stroke="rgba(255,255,255,0.20)"
            strokeDasharray="4 3"
            fill="none"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="prospect"
            name={prospect.artist_name}
            stroke={getRiseProbabilityColor(prospect.rise_probability)}
            fill="url(#prospectGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 justify-center text-[10px]">
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-0.5 rounded"
            style={{
              background: getRiseProbabilityColor(prospect.rise_probability),
            }}
          />
          <span className="text-white/40">{prospect.artist_name}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.20)" }}
          />
          <span className="text-white/25">
            {gc.artist_name} (wk {gc.week_offset})
          </span>
        </span>
      </div>
    </div>
  );
}

/* ─── Development Roadmap ─────────────────────────────────── */

function DevelopmentTab({ prospect }: { prospect: ARProspect }) {
  // Mock producer matches based on genre
  const producerMatches = [
    { name: "Disclosure", sonic_dna: 88, available: "May 2-9" },
    { name: "Kaytranada", sonic_dna: 82, available: "May 12-18" },
    { name: "P2J", sonic_dna: 76, available: "June 1-7" },
  ];

  return (
    <div className="space-y-6">
      {/* Producer Matches */}
      <div>
        <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
          Producer Matches (Sonic DNA)
        </h4>
        <div className="space-y-2">
          {producerMatches.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/[0.04]"
            >
              <span className="text-[12px] font-medium text-white/70 flex-1">
                {p.name}
              </span>
              <span
                className="text-[12px] tabular-nums font-semibold"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  color: p.sonic_dna >= 85 ? "#30D158" : "#0A84FF",
                }}
              >
                {p.sonic_dna}%
              </span>
              <span className="text-[10px] text-white/30">
                Available {p.available}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Format Strategy */}
      <div>
        <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
          Format Strategy
        </h4>
        <p
          className="text-[13px] leading-[1.7]"
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            color: "rgba(255,255,255,0.60)",
          }}
        >
          Based on Format Alpha data, the{" "}
          <span
            style={{
              color:
                FORMAT_COLORS[prospect.format_alpha.best_format] || "#e8430a",
            }}
          >
            {prospect.format_alpha.best_format}
          </span>{" "}
          version outperforms by{" "}
          {prospect.format_alpha.best_format_engagement_lift}%. Recommended
          release strategy: lead with {prospect.format_alpha.best_format} for
          UGC seeding, follow with Original for streaming, and test Acoustic for
          sync placement.
        </p>
      </div>

      {/* Release Window */}
      <div>
        <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
          Suggested Release Window
        </h4>
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-white/[0.04]">
          <div>
            <span className="text-[14px] font-semibold text-white/70">
              May 16, 2026
            </span>
            <span className="text-[10px] text-white/30 block mt-0.5">
              Optimal based on trigger market velocity + studio availability
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function viralColor(score: number): string {
  if (score >= 80) return "#30D158";
  if (score >= 50) return "#FFD60A";
  if (score >= 25) return "#FF9F0A";
  return "#FF453A";
}

function formatDuration(s: number | null): string | null {
  if (!s || s <= 0) return null;
  const secs = Math.round(s);
  const m = Math.floor(secs / 60);
  const sec = secs % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const MONO = "'JetBrains Mono', monospace";

/* ─── Enriched Videos Tab ────────────────────────────────── */

function VideosTab({ videos }: { videos: EnrichedVideo[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!videos.length) {
    return (
      <div className="py-12 text-center text-[13px] text-white/30">
        No recent videos available yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-3">
        <Play size={14} className="text-white/30" />
        <span className="text-[12px] text-white/55">
          {videos.length} recent videos
        </span>
        <span className="text-[10px] text-white/25">Sorted by play count</span>
      </div>

      {videos.map((v, i) => {
        const id = v.video_id || String(i);
        const isExpanded = expandedId === id;
        const hasGemini = !!v.gemini_analysis;
        const dur = formatDuration(v.duration_seconds);
        const medianX =
          v.creator_median_views && v.creator_median_views > 0
            ? Math.round(v.play_count / v.creator_median_views)
            : null;
        const hashtags = v.hashtags
          ? v.hashtags
              .split(/[,\s]+/)
              .filter(Boolean)
              .slice(0, 4)
          : [];

        return (
          <div key={id}>
            <div
              role={hasGemini ? "button" : undefined}
              tabIndex={hasGemini ? 0 : undefined}
              onClick={() => hasGemini && setExpandedId(isExpanded ? null : id)}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border border-white/[0.04] transition-colors ${hasGemini ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-md bg-white/[0.04] shrink-0 flex items-center justify-center overflow-hidden relative mt-0.5">
                {v.video_cover_url ? (
                  <>
                    <img
                      src={v.video_cover_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play size={14} fill="white" className="text-white" />
                    </div>
                  </>
                ) : (
                  <Play size={14} className="text-white/20" />
                )}
              </div>

              {/* Content column */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/55 truncate">
                  {v.caption || "Untitled video"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-white/25">
                    {new Date(v.date_posted).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {dur && (
                    <span className="flex items-center gap-0.5 text-[9px] text-white/20">
                      <Clock size={8} /> {dur}
                    </span>
                  )}
                  {v.location && (
                    <span className="text-[9px] text-white/20">
                      {v.location}
                    </span>
                  )}
                </div>
                {v.music_name && (
                  <span className="text-[9px] text-white/25 truncate block mt-0.5">
                    {v.music_name}
                    {v.music_author ? ` — ${v.music_author}` : ""}
                  </span>
                )}
                {hashtags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[8px] px-1 py-0.5 rounded text-white/25"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        #{tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats column */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1 text-[10px] text-white/35">
                  <Eye size={10} />
                  <span className="tabular-nums" style={{ fontFamily: MONO }}>
                    {formatK(v.play_count)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/35">
                  <Heart size={10} />
                  <span className="tabular-nums" style={{ fontFamily: MONO }}>
                    {formatK(v.like_count)}
                  </span>
                </div>
                {v.collect_count > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-white/35">
                    <Bookmark size={10} />
                    <span className="tabular-nums" style={{ fontFamily: MONO }}>
                      {formatK(v.collect_count)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-white/35">
                  <Share2 size={10} />
                  <span className="tabular-nums" style={{ fontFamily: MONO }}>
                    {formatK(v.share_count)}
                  </span>
                </div>
              </div>

              {/* Viral + multiplier */}
              <div className="flex flex-col items-center shrink-0 w-14">
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ fontFamily: MONO, color: viralColor(v.viral_score) }}
                >
                  {v.viral_score.toFixed(0)}
                </span>
                {medianX != null && medianX > 1 && (
                  <span
                    className="text-[8px] text-white/25 tabular-nums"
                    style={{ fontFamily: MONO }}
                  >
                    {medianX}x median
                  </span>
                )}
              </div>

              {/* Expand indicator + external link */}
              <div className="flex items-center gap-1 shrink-0">
                {hasGemini && (
                  <ChevronDown
                    size={12}
                    className="text-white/20 transition-transform"
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                    }}
                  />
                )}
                {v.web_url && (
                  <a
                    href={v.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                    title="Open video"
                  >
                    <ExternalLink size={11} className="text-white/20" />
                  </a>
                )}
              </div>
            </div>

            {/* Expanded Gemini analysis */}
            <AnimatePresence>
              {isExpanded && v.gemini_analysis && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <GeminiPanel
                    analysis={v.gemini_analysis}
                    reasoning={v.reasoning}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Gemini Analysis Panel (per-video expandable) ──────── */

function GeminiPanel({
  analysis,
  reasoning,
}: {
  analysis: NonNullable<EnrichedVideo["gemini_analysis"]>;
  reasoning: string | null;
}) {
  const aa = analysis.audio_analysis;
  const va = analysis.visual_analysis;
  const topMoods = aa?.mood
    ? Object.entries(aa.mood)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
    : [];
  const topGenres = [
    ...Object.entries(aa?.genre ?? {}),
    ...Object.entries(aa?.sub_genre ?? {}),
  ]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  const bpm = aa?.technical_feedback?.tempo_bpm;
  const key = aa?.technical_feedback?.key;

  return (
    <div
      className="mx-3 mb-2 px-3 py-3 rounded-lg space-y-2.5"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      {/* Row 1: Style + Hook + Virality */}
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles size={11} style={{ color: "#e8430a" }} />
        {analysis.content_style && (
          <span className="text-[10px] text-white/50">
            {analysis.content_style}
          </span>
        )}
        {analysis.hook_type && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded text-white/35"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {analysis.hook_type}
          </span>
        )}
        {analysis.virality_type && (
          <span
            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color:
                analysis.virality_type === "REPLICABLE" ? "#30D158" : "#FFD60A",
              background:
                analysis.virality_type === "REPLICABLE"
                  ? "rgba(48,209,88,0.10)"
                  : "rgba(255,214,10,0.10)",
            }}
          >
            {analysis.virality_type}
          </span>
        )}
      </div>

      {/* Row 2: Audio profile */}
      {(topMoods.length > 0 || topGenres.length > 0 || bpm || key) && (
        <div className="flex items-center gap-2 flex-wrap">
          <Music2 size={10} className="text-white/20" />
          {topGenres.map(([genre, score]) => (
            <span
              key={genre}
              className="text-[9px] px-1.5 py-0.5 rounded text-white/40"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {genre} <span className="text-white/20">{score}%</span>
            </span>
          ))}
          {topMoods.map(([mood, score]) => (
            <span key={mood} className="text-[9px] text-white/30">
              {mood} {score}%
            </span>
          ))}
          {bpm && (
            <span
              className="text-[9px] tabular-nums text-white/25"
              style={{ fontFamily: MONO }}
            >
              {bpm} BPM
            </span>
          )}
          {key && <span className="text-[9px] text-white/25">{key}</span>}
        </div>
      )}

      {/* Row 3: Visual categories */}
      {va?.main_categories && va.main_categories.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Eye size={10} className="text-white/20" />
          {va.main_categories.map((cat) => (
            <span
              key={cat}
              className="text-[9px] px-1.5 py-0.5 rounded text-white/35"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {cat}
            </span>
          ))}
          {va.effort && (
            <span className="text-[9px] text-white/20">
              Effort: {va.effort}
            </span>
          )}
        </div>
      )}

      {/* Row 4: Replicable elements */}
      {analysis.replicable_elements && (
        <p
          className="text-[11px] pl-3 border-l-2 border-white/[0.06] leading-relaxed"
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            color: "rgba(255,255,255,0.45)",
            fontStyle: "italic",
          }}
        >
          {analysis.replicable_elements}
        </p>
      )}

      {/* Row 5: AI reasoning */}
      {reasoning && (
        <p className="text-[9px] text-white/25 leading-relaxed">{reasoning}</p>
      )}
    </div>
  );
}

/* ─── Content DNA Tab ────────────────────────────────────── */

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] || 0) + 1;
}

function ContentDNATab({ videos }: { videos: EnrichedVideo[] }) {
  const analyzed = videos.filter((v) => v.gemini_analysis);

  if (analyzed.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-white/30">
        <Dna size={20} className="mx-auto mb-2 text-white/15" />
        No Gemini analysis available for this prospect's videos.
      </div>
    );
  }

  // Aggregate across all analyzed videos
  const styleCounts: Record<string, number> = {};
  const hookCounts: Record<string, number> = {};
  const viralityCounts: Record<string, number> = {};
  const genreCounts: Record<string, number> = {};
  const moodTotals: Record<string, number[]> = {};
  const instrumentCounts: Record<string, number> = {};
  const bpms: number[] = [];
  const keyCounts: Record<string, number> = {};
  const visualCats: Record<string, number> = {};
  const replicableTexts: string[] = [];

  for (const v of analyzed) {
    const ga = v.gemini_analysis!;
    if (ga.content_style) increment(styleCounts, ga.content_style);
    if (ga.hook_type) increment(hookCounts, ga.hook_type);
    const vt = ga.virality_type;
    if (vt) increment(viralityCounts, vt);

    const aa = ga.audio_analysis;
    if (aa) {
      if (aa.genre)
        for (const [g, s] of Object.entries(aa.genre)) {
          increment(genreCounts, g);
        }
      if (aa.sub_genre)
        for (const [g, s] of Object.entries(aa.sub_genre)) {
          increment(genreCounts, g);
        }
      if (aa.mood)
        for (const [m, s] of Object.entries(aa.mood)) {
          (moodTotals[m] ||= []).push(s);
        }
      if (aa.instruments)
        for (const [inst] of Object.entries(aa.instruments)) {
          increment(instrumentCounts, inst);
        }
      if (aa.technical_feedback?.tempo_bpm)
        bpms.push(aa.technical_feedback.tempo_bpm);
      if (aa.technical_feedback?.key)
        increment(keyCounts, aa.technical_feedback.key);
    }

    if (ga.visual_analysis?.main_categories) {
      for (const cat of ga.visual_analysis.main_categories)
        increment(visualCats, cat);
    }

    if (ga.replicable_elements) replicableTexts.push(ga.replicable_elements);
  }

  const sortedEntries = (m: Record<string, number>) =>
    Object.entries(m).sort(([, a], [, b]) => b - a);

  const topStyles = sortedEntries(styleCounts).slice(0, 4);
  const topHooks = sortedEntries(hookCounts).slice(0, 4);
  const topGenres = sortedEntries(genreCounts).slice(0, 5);
  const topMoods = Object.entries(moodTotals)
    .map(
      ([mood, scores]) =>
        [
          mood,
          Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        ] as const,
    )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const topInstruments = sortedEntries(instrumentCounts).slice(0, 5);
  const topKeys = sortedEntries(keyCounts).slice(0, 3);
  const topVisual = sortedEntries(visualCats).slice(0, 5);
  const bpmRange =
    bpms.length > 0 ? { min: Math.min(...bpms), max: Math.max(...bpms) } : null;
  const uniqueReplicable = [...new Set(replicableTexts)].slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Coverage */}
      <div className="flex items-center gap-3">
        <Dna size={14} className="text-white/30" />
        <span className="text-[12px] text-white/55">
          {analyzed.length} of {videos.length} videos analyzed
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden max-w-[120px]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(analyzed.length / Math.max(videos.length, 1)) * 100}%`,
              background: "#e8430a",
            }}
          />
        </div>
      </div>

      {/* Content Styles + Hooks */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/25 mb-2">
            Content Styles
          </h4>
          <div className="space-y-1.5">
            {topStyles.map(([style, count]) => (
              <div
                key={style}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/[0.04]"
              >
                <span className="text-[11px] text-white/55 flex-1 truncate">
                  {style}
                </span>
                <span
                  className="text-[10px] tabular-nums text-white/25"
                  style={{ fontFamily: MONO }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/25 mb-2">
            Hook Types
          </h4>
          <div className="space-y-1.5">
            {topHooks.map(([hook, count]) => (
              <div
                key={hook}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/[0.04]"
              >
                <span className="text-[11px] text-white/55 flex-1 truncate">
                  {hook}
                </span>
                <span
                  className="text-[10px] tabular-nums text-white/25"
                  style={{ fontFamily: MONO }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Profile */}
      {(topGenres.length > 0 || topMoods.length > 0) && (
        <div>
          <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/25 mb-2">
            Audio Profile
          </h4>
          <div className="px-4 py-3 rounded-lg border border-white/[0.04] space-y-3">
            {/* Genres */}
            {topGenres.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] text-white/25 w-12 shrink-0">
                  Genre
                </span>
                {topGenres.map(([genre, count]) => (
                  <span
                    key={genre}
                    className="text-[10px] px-2 py-0.5 rounded font-medium"
                    style={{
                      color: "#e8430a",
                      background: "rgba(232,67,10,0.08)",
                    }}
                  >
                    {genre}
                    {count > 1 && (
                      <span className="text-white/20 ml-1">x{count}</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Mood spectrum */}
            {topMoods.length > 0 && (
              <div>
                <span className="text-[9px] text-white/25 block mb-1.5">
                  Mood Spectrum
                </span>
                <div className="space-y-1">
                  {topMoods.map(([mood, avg]) => (
                    <div key={mood} className="flex items-center gap-2">
                      <span className="text-[9px] text-white/35 w-[70px] text-right shrink-0">
                        {mood}
                      </span>
                      <div
                        className="flex-1 h-[5px] rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${avg}%`, background: "#e8430a" }}
                        />
                      </div>
                      <span
                        className="text-[9px] tabular-nums text-white/25 w-8 text-right"
                        style={{ fontFamily: MONO }}
                      >
                        {avg}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BPM + Key + Instruments */}
            <div className="flex items-center gap-3 flex-wrap">
              {bpmRange && (
                <span
                  className="text-[10px] tabular-nums text-white/40"
                  style={{ fontFamily: MONO }}
                >
                  {bpmRange.min === bpmRange.max
                    ? `${bpmRange.min} BPM`
                    : `${bpmRange.min}–${bpmRange.max} BPM`}
                </span>
              )}
              {topKeys.map(([k, count]) => (
                <span
                  key={k}
                  className="text-[10px] px-1.5 py-0.5 rounded text-white/35"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  {k}
                </span>
              ))}
              {topInstruments.map(([inst]) => (
                <span key={inst} className="text-[9px] text-white/25">
                  {inst}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Categories */}
      {topVisual.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/25 mb-2">
            Visual Patterns
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {topVisual.map(([cat, count]) => (
              <span
                key={cat}
                className="text-[10px] px-2 py-1 rounded border border-white/[0.04] text-white/45"
              >
                {cat}{" "}
                <span
                  className="tabular-nums text-white/20"
                  style={{ fontFamily: MONO }}
                >
                  x{count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Virality Types */}
      {Object.keys(viralityCounts).length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/25 mb-2">
            Virality Types
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {sortedEntries(viralityCounts).map(([vtype, count]) => (
              <span
                key={vtype}
                className="text-[10px] font-semibold px-2 py-1 rounded"
                style={{
                  color: vtype === "REPLICABLE" ? "#30D158" : "#FFD60A",
                  background:
                    vtype === "REPLICABLE"
                      ? "rgba(48,209,88,0.08)"
                      : "rgba(255,214,10,0.08)",
                }}
              >
                {vtype} <span className="font-normal opacity-60">x{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What Makes Their Content Work */}
      {uniqueReplicable.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/25 mb-2">
            What Makes Their Content Work
          </h4>
          <div className="space-y-2">
            {uniqueReplicable.map((text, i) => (
              <p
                key={i}
                className="text-[12px] pl-3 py-1 border-l-2 border-white/[0.06] leading-relaxed"
                style={{
                  fontFamily: '"Tiempos Text", Georgia, serif',
                  color: "rgba(255,255,255,0.55)",
                  fontStyle: "italic",
                }}
              >
                "{text}"
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Tabbed Component ───────────────────────────────── */

export default function ProspectDeepDiveTabs({
  prospect,
  recentVideos = [],
}: {
  prospect: ARProspect;
  recentVideos?: EnrichedVideo[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Threshold Check");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-xl border border-white/[0.06]"
      style={{ background: "#1C1C1E" }}
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-3 border-b border-white/[0.06] overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                active
                  ? "bg-white/[0.08] text-white/87"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === "Threshold Check" && (
          <ThresholdCheckTab prospect={prospect} />
        )}
        {activeTab === "Geography" && <GeographyTab prospect={prospect} />}
        {activeTab === "Format Trends" && (
          <FormatTrendsTab prospect={prospect} />
        )}
        {activeTab === "Comment Intent" && (
          <CommentIntentTab prospect={prospect} />
        )}
        {activeTab === "Cross-Platform" && (
          <CrossPlatformTab prospect={prospect} />
        )}
        {activeTab === "Ghost Curve" && <GhostCurveTab prospect={prospect} />}
        {activeTab === "Videos" && <VideosTab videos={recentVideos} />}
        {activeTab === "Content DNA" && <ContentDNATab videos={recentVideos} />}
        {activeTab === "Development" && <DevelopmentTab prospect={prospect} />}
      </div>
    </motion.div>
  );
}

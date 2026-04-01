import { useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  LineChart,
} from "recharts";

/* ────────── Confidence Gauge (SVG arc) ────────── */

function ConfidenceGauge({
  value,
  size = 80,
}: {
  value: number;
  size?: number;
}) {
  const strokeW = size >= 70 ? 6 : 4;
  const radius = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcPct = 0.75; // 270 degree arc
  const arcLength = circumference * arcPct;
  const filled = (value / 100) * arcLength;
  const color = value >= 70 ? "#22C55E" : value >= 30 ? "#F59E0B" : "#EF4444";

  // Rotate so the gap is at the bottom
  const startAngle = 135; // degrees

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size, height: size + 16 }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: `rotate(${startAngle}deg)` }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeW}
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{
          color,
          fontSize: size * 0.26,
          lineHeight: 1,
          top: "42%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {value}%
      </span>
      <span
        className="text-[9px] font-medium tracking-wide"
        style={{
          color: "#8E8E93",
          marginTop: -6,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        Causation
        <br />
        Confidence
      </span>
    </div>
  );
}

/* ────────── Hardcoded chart data ────────── */

const FEATURED_DATA = [
  { date: "Feb 10", listeners: 11200, views: 800 },
  { date: "Feb 12", listeners: 11300, views: 900 },
  { date: "Feb 14", listeners: 11400, views: 1100 },
  { date: "Feb 16", listeners: 11500, views: 1400 },
  { date: "Feb 18", listeners: 11600, views: 18500 },
  { date: "Feb 20", listeners: 12100, views: 42000 },
  { date: "Feb 22", listeners: 14800, views: 31000 },
  { date: "Feb 24", listeners: 16500, views: 22000 },
  { date: "Feb 26", listeners: 18300, views: 15000 },
  { date: "Feb 28", listeners: 19100, views: 11000 },
  { date: "Mar 2", listeners: 18700, views: 8500 },
  { date: "Mar 4", listeners: 18400, views: 7200 },
  { date: "Mar 6", listeners: 18100, views: 6800 },
  { date: "Mar 8", listeners: 18300, views: 6200 },
  { date: "Mar 10", listeners: 18200, views: 5800 },
];

const SPARKLINE_HIGH = [
  { v: 4200 },
  { v: 4300 },
  { v: 4500 },
  { v: 4600 },
  { v: 5100 },
  { v: 5800 },
  { v: 6200 },
  { v: 6500 },
  { v: 6600 },
];

const SPARKLINE_LOW = [
  { v: 17000 },
  { v: 17200 },
  { v: 17800 },
  { v: 19500 },
  { v: 24000 },
  { v: 28000 },
  { v: 31000 },
  { v: 32200 },
  { v: 32100 },
];

/* ────────── Confounding factor row ────────── */

function FactorRow({
  color,
  text,
  tag,
}: {
  color: string;
  text: string;
  tag: string;
}) {
  const isNegative = tag.startsWith("−") || tag.startsWith("-");
  const isNoImpact = tag.toLowerCase() === "no impact";
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <span
        className="text-[13px] flex-1"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        {text}
      </span>
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded-md flex-shrink-0"
        style={{
          background: isNegative
            ? "rgba(239,68,68,0.10)"
            : "rgba(34,197,94,0.10)",
          color: isNegative ? "#EF4444" : isNoImpact ? "#22C55E" : "#8E8E93",
        }}
      >
        {tag}
      </span>
    </div>
  );
}

/* ────────── Custom tooltip ────────── */

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs"
      style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="font-semibold mb-1.5" style={{ color: "#fff" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-0.5 rounded-full"
            style={{ background: p.color }}
          />
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.name}:</span>
          <span className="font-medium" style={{ color: "#fff" }}>
            {p.value >= 1000 ? (p.value / 1000).toFixed(1) + "K" : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ────────── Small campaign card ────────── */

function SmallCampaignCard({
  handle,
  confidence,
  sparklineData,
  summary,
  factors,
  avatarUrl,
}: {
  handle: string;
  confidence: number;
  sparklineData: { v: number }[];
  summary: string;
  factors: { color: string; text: string; tag: string }[];
  avatarUrl?: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  const lineColor =
    confidence >= 70 ? "#22C55E" : confidence >= 30 ? "#F59E0B" : "#EF4444";

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "#1C1C1E",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={handle}
              className="w-8 h-8 rounded-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "#3A3A3C", color: "#fff" }}
            >
              {handle[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold" style={{ color: "#fff" }}>
            @{handle?.replace(/^@+/, "")}
          </span>
        </div>
        <ConfidenceGauge value={confidence} size={60} />
      </div>

      {/* Sparkline */}
      <div style={{ height: 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line
              type="monotone"
              dataKey="v"
              dot={false}
              stroke={lineColor}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <p
        className="text-[13px] leading-relaxed"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {summary}
      </p>

      {/* Factors */}
      <div
        className="border-t pt-3"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {factors.map((f, i) => (
          <FactorRow key={i} {...f} />
        ))}
      </div>
    </div>
  );
}

/* ────────── Main section ────────── */

export default function AdImpactSection({
  avatarMap,
}: {
  avatarMap?: Map<string, string | null>;
}) {
  const tobiasAvatar = avatarMap?.get("tobiassten") ?? null;
  const lillecaesarAvatar = avatarMap?.get("lillecaesar") ?? null;
  const [featuredImgError, setFeaturedImgError] = useState(false);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "#fff" }}>
          Ad Impact Attribution
        </h2>
        <p className="text-xs mt-1" style={{ color: "#8E8E93" }}>
          Beta — Launching Q2 2026
        </p>
      </div>

      {/* Featured campaign card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#1C1C1E",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {tobiasAvatar && !featuredImgError ? (
              <img
                src={tobiasAvatar}
                alt="tobiassten"
                className="w-11 h-11 rounded-full object-cover"
                onError={() => setFeaturedImgError(true)}
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "#3A3A3C", color: "#fff" }}
              >
                T
              </div>
            )}
            <div>
              <span className="text-sm font-semibold" style={{ color: "#fff" }}>
                @tobiassten
              </span>
              <p
                className="text-xs mt-0.5 max-w-xs"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                "Eg e så takknemlig for at dåke forsatt høyre..."
              </p>
            </div>
          </div>
          <ConfidenceGauge value={35} size={80} />
        </div>

        {/* Chart */}
        <div className="px-2" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={FEATURED_DATA}
              margin={{ top: 24, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#8E8E93", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: "#8E8E93", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v / 1000).toFixed(0) + "K"}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#8E8E93", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v / 1000).toFixed(0) + "K"}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine
                x="Feb 18"
                yAxisId="left"
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "Ad Started — Feb 18",
                  position: "insideTopLeft",
                  fill: "#F59E0B",
                  fontSize: 10,
                  dy: -16,
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="listeners"
                name="Spotify Listeners"
                stroke="#22C55E"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="views"
                name="TikTok Views"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-6 px-6 pt-2 pb-4 text-[11px]"
          style={{ color: "#8E8E93" }}
        >
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-[2px] rounded-full inline-block"
              style={{ background: "#22C55E" }}
            />{" "}
            Spotify Monthly Listeners
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-[2px] rounded-full inline-block"
              style={{ background: "#3B82F6" }}
            />{" "}
            TikTok Views (boosted post)
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.06)",
            margin: "0 24px",
          }}
        />

        {/* Confounding factors */}
        <div className="px-6 py-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: "#8E8E93" }}
          >
            Why not 100%?
          </p>
          <FactorRow
            color="#F59E0B"
            text="Artist posted new video on Feb 20"
            tag="−20% confidence"
          />
          <FactorRow
            color="#F59E0B"
            text="UGC spike: ~340 fan videos detected Feb 17-19"
            tag="−25% confidence"
          />
          <FactorRow
            color="#22C55E"
            text="No new playlist placements detected"
            tag="No impact"
          />
          <FactorRow
            color="#22C55E"
            text="No concert/event in period"
            tag="No impact"
          />
        </div>

        {/* Summary */}
        <div className="px-6 pb-6">
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Spotify listeners increased{" "}
            <span className="font-bold" style={{ color: "#fff" }}>
              +7.1K (+63%)
            </span>{" "}
            during campaign window. Estimated{" "}
            <span className="font-bold" style={{ color: "#fff" }}>
              35%
            </span>{" "}
            attributable to paid boost.
          </p>
        </div>
      </div>

      {/* Two smaller cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmallCampaignCard
          handle="lillecaesar"
          confidence={82}
          sparklineData={SPARKLINE_HIGH}
          avatarUrl={lillecaesarAvatar}
          summary="Listeners +2.4K (+18%). High confidence — no competing signals detected."
          factors={[
            {
              color: "#22C55E",
              text: "No new playlist placements detected",
              tag: "No impact",
            },
            {
              color: "#22C55E",
              text: "No concert/event in period",
              tag: "No impact",
            },
            {
              color: "#22C55E",
              text: "No viral UGC activity",
              tag: "No impact",
            },
          ]}
        />
        <SmallCampaignCard
          handle="tobiassten"
          confidence={12}
          sparklineData={SPARKLINE_LOW}
          avatarUrl={tobiasAvatar}
          summary="Listeners +15.2K (+89%). Low confidence — viral UGC wave likely primary driver."
          factors={[
            {
              color: "#EF4444",
              text: "Viral fan video (2.1M views)",
              tag: "−60% confidence",
            },
            {
              color: "#F59E0B",
              text: "Song added to Discover Weekly",
              tag: "−20% confidence",
            },
          ]}
        />
      </div>
    </section>
  );
}

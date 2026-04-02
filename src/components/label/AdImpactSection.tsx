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
  const arcPct = 0.75;
  const arcLength = circumference * arcPct;
  const filled = (value / 100) * arcLength;
  const color = value >= 70 ? "#22C55E" : value >= 30 ? "#F59E0B" : "#EF4444";
  const startAngle = 135;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: size,
        height: size + 16,
      }}
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
        style={{
          position: "absolute",
          fontWeight: 700,
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
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.04em",
          color: "var(--ink-faint, rgba(255,255,255,0.35))",
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
  const isNegative = tag.startsWith("\u2212") || tag.startsWith("-");
  const isNoImpact = tag.toLowerCase() === "no impact";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: color,
        }}
      />
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          flex: 1,
          color: "var(--ink-secondary, rgba(255,255,255,0.7))",
        }}
      >
        {text}
      </span>
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: 6,
          flexShrink: 0,
          background: isNegative
            ? "rgba(239,68,68,0.10)"
            : "rgba(48,209,88,0.10)",
          color: isNegative
            ? "#EF4444"
            : isNoImpact
              ? "var(--green, #30D158)"
              : "var(--ink-faint, rgba(255,255,255,0.35))",
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
      style={{
        background: "var(--chart-tooltip-bg, rgba(0,0,0,0.92))",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--chart-tooltip-border, rgba(255,255,255,0.08))",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
      }}
    >
      <p
        style={{
          fontWeight: 600,
          marginBottom: 6,
          margin: "0 0 6px",
          color: "var(--ink, rgba(255,255,255,0.87))",
        }}
      >
        {label}
      </p>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "2px 0",
          }}
        >
          <span
            style={{
              width: 8,
              height: 2,
              borderRadius: 1,
              background: p.color,
            }}
          />
          <span style={{ color: "var(--ink-tertiary, rgba(255,255,255,0.5))" }}>
            {p.name}:
          </span>
          <span
            style={{
              fontWeight: 600,
              color: "var(--ink, rgba(255,255,255,0.87))",
            }}
          >
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
      style={{
        background: "var(--surface, #1C1C1E)",
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={handle}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                objectFit: "cover",
              }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                background: "var(--overlay-active, rgba(255,255,255,0.06))",
                color: "var(--ink, rgba(255,255,255,0.87))",
              }}
            >
              {handle[0]?.toUpperCase()}
            </div>
          )}
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink, rgba(255,255,255,0.87))",
            }}
          >
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
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--ink-secondary, rgba(255,255,255,0.55))",
          margin: 0,
        }}
      >
        {summary}
      </p>

      {/* Factors */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          paddingTop: 12,
        }}
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
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: "var(--ink-faint, rgba(255,255,255,0.3))",
          letterSpacing: "0.04em",
        }}
      >
        Beta \u2014 Launching Q2 2026
      </span>

      {/* Featured campaign card */}
      <div
        style={{
          background: "var(--surface, #1C1C1E)",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 16px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {tobiasAvatar && !featuredImgError ? (
              <img
                src={tobiasAvatar}
                alt="tobiassten"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                onError={() => setFeaturedImgError(true)}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  background: "var(--overlay-active, rgba(255,255,255,0.06))",
                  color: "var(--ink, rgba(255,255,255,0.87))",
                }}
              >
                T
              </div>
            )}
            <div>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink, rgba(255,255,255,0.87))",
                }}
              >
                @tobiassten
              </span>
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-faint, rgba(255,255,255,0.4))",
                  margin: "2px 0 0",
                  maxWidth: 300,
                }}
              >
                "Eg e s\u00e5 takknemlig for at d\u00e5ke forsatt h\u00f8yre..."
              </p>
            </div>
          </div>
          <ConfidenceGauge value={35} size={80} />
        </div>

        {/* Chart */}
        <div style={{ padding: "0 8px", height: 240 }}>
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
                tick={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fill: "rgba(255,255,255,0.35)",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fill: "rgba(255,255,255,0.35)",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v / 1000).toFixed(0) + "K"}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fill: "rgba(255,255,255,0.35)",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v / 1000).toFixed(0) + "K"}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine
                x="Feb 18"
                yAxisId="left"
                stroke="#FF9F0A"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "Ad Started \u2014 Feb 18",
                  position: "insideTopLeft",
                  fill: "#FF9F0A",
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
                stroke="#0A84FF"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "8px 24px 16px",
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "var(--ink-faint, rgba(255,255,255,0.35))",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 2,
                borderRadius: 1,
                display: "inline-block",
                background: "#22C55E",
              }}
            />
            Spotify Monthly Listeners
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 2,
                borderRadius: 1,
                display: "inline-block",
                background: "#0A84FF",
              }}
            />
            TikTok Views (boosted post)
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--border-subtle, rgba(255,255,255,0.06))",
            margin: "0 24px",
          }}
        />

        {/* Confounding factors */}
        <div style={{ padding: "16px 24px" }}>
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-faint, rgba(255,255,255,0.35))",
              margin: "0 0 8px",
            }}
          >
            Why not 100%?
          </p>
          <FactorRow
            color="#FF9F0A"
            text="Artist posted new video on Feb 20"
            tag="\u221220% confidence"
          />
          <FactorRow
            color="#FF9F0A"
            text="UGC spike: ~340 fan videos detected Feb 17-19"
            tag="\u221225% confidence"
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
        <div style={{ padding: "0 24px 24px" }}>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--ink-secondary, rgba(255,255,255,0.55))",
              margin: 0,
            }}
          >
            Spotify listeners increased{" "}
            <span
              style={{
                fontWeight: 700,
                color: "var(--ink, rgba(255,255,255,0.87))",
              }}
            >
              +7.1K (+63%)
            </span>{" "}
            during campaign window. Estimated{" "}
            <span
              style={{
                fontWeight: 700,
                color: "var(--ink, rgba(255,255,255,0.87))",
              }}
            >
              35%
            </span>{" "}
            attributable to paid boost.
          </p>
        </div>
      </div>

      {/* Two smaller cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <SmallCampaignCard
          handle="lillecaesar"
          confidence={82}
          sparklineData={SPARKLINE_HIGH}
          avatarUrl={lillecaesarAvatar}
          summary="Listeners +2.4K (+18%). High confidence \u2014 no competing signals detected."
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
          summary="Listeners +15.2K (+89%). Low confidence \u2014 viral UGC wave likely primary driver."
          factors={[
            {
              color: "#EF4444",
              text: "Viral fan video (2.1M views)",
              tag: "\u221260% confidence",
            },
            {
              color: "#FF9F0A",
              text: "Song added to Discover Weekly",
              tag: "\u221220% confidence",
            },
          ]}
        />
      </div>
    </section>
  );
}

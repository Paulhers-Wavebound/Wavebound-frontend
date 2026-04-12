import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChartDataPoint {
  date_posted: string;
  timestamp: number;
  views: number;
  performance_ratio: number;
  momentum_tier: string;
  caption: string | null;
  video_url?: string | null;
}

interface PerformanceChartProps {
  chartData: ChartDataPoint[];
  organicOnly: boolean;
  onOrganicToggle: (organic: boolean) => void;
  currentPR: number | null;
  avg7PR: number | null;
  avg30PR: number | null;
  medianBaseline: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Clickable dot — every post is a dot, colored by tier ──────────────

function RmmDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const pr = payload?.performance_ratio ?? 0;
  const url = payload?.video_url;

  // Color by performance tier
  let fill: string;
  let glowR: number;
  let dotR: number;
  let glowOpacity: number;

  if (pr >= 10) {
    fill = "#e8430a";
    glowR = 9;
    dotR = 4.5;
    glowOpacity = 0.25;
  } else if (pr >= 4) {
    fill = "#30D158";
    glowR = 7;
    dotR = 3.5;
    glowOpacity = 0.2;
  } else if (pr >= 1.5) {
    fill = "#0A84FF";
    glowR = 0;
    dotR = 3;
    glowOpacity = 0;
  } else if (pr >= 0.5) {
    fill = "rgba(255,255,255,0.35)";
    glowR = 0;
    dotR = 2.5;
    glowOpacity = 0;
  } else {
    fill = "#FF453A";
    glowR = 0;
    dotR = 3;
    glowOpacity = 0;
  }

  const handleClick = () => {
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <g
      onClick={handleClick}
      style={{ cursor: url ? "pointer" : "default" }}
    >
      {/* Invisible hit area for easier clicking */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      {/* Glow for breakout/viral */}
      {glowR > 0 && (
        <circle cx={cx} cy={cy} r={glowR} fill={fill} opacity={glowOpacity} />
      )}
      {/* Dot */}
      <circle cx={cx} cy={cy} r={dotR} fill={fill} />
    </g>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const dateStr = d.date_posted
    ? format(new Date(d.date_posted), "MMM d, yyyy")
    : "";
  const caption = d.caption
    ? d.caption.length > 60
      ? d.caption.slice(0, 60) + "…"
      : d.caption
    : null;

  const pr = d.performance_ratio ?? 0;
  const tierLabel =
    pr >= 10 ? "Viral" : pr >= 4 ? "Breakout" : pr >= 1.5 ? "Momentum" : pr >= 0.5 ? "Stable" : "Stalled";
  const tierColor =
    pr >= 10 ? "#e8430a" : pr >= 4 ? "#30D158" : pr >= 1.5 ? "#0A84FF" : pr >= 0.5 ? "rgba(255,255,255,0.55)" : "#FF453A";

  return (
    <div
      style={{
        background: "#1C1C1E",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 180,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          color: "rgba(255,255,255,0.30)",
          marginBottom: 6,
        }}
      >
        {dateStr}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 18,
            fontWeight: 700,
            color: "rgba(255,255,255,0.87)",
          }}
        >
          {pr.toFixed(1)}x
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: 600,
            color: tierColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {tierLabel}
        </span>
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {fmtNum(d.views)} views
      </div>
      {caption && (
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "rgba(255,255,255,0.30)",
            marginTop: 4,
            fontStyle: "italic",
            lineHeight: 1.4,
          }}
        >
          {caption}
        </div>
      )}
      {d.video_url && (
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 10,
            color: "#e8430a",
            marginTop: 6,
            paddingTop: 6,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Click dot to watch video
        </div>
      )}
    </div>
  );
}

// ── Stat pill ───────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
  accent,
}: {
  label: string;
  value: string;
  color?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 min-w-[80px] text-center">
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          fontWeight: 500,
          color: "rgba(255,255,255,0.30)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 15,
          fontWeight: 700,
          color: color ?? (accent ? "#e8430a" : "rgba(255,255,255,0.87)"),
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

export default function PerformanceChart({
  chartData,
  organicOnly,
  onOrganicToggle,
  currentPR,
  avg7PR,
  avg30PR,
  medianBaseline,
}: PerformanceChartProps) {
  const isMobile = useIsMobile();
  const tickSeenMonths = new Set<string>();

  const prColor = (v: number | null) => {
    if (v == null) return undefined;
    if (v >= 1.5) return "#30D158";
    if (v < 0.5) return "#FF453A";
    return undefined;
  };

  return (
    <div
      className="rounded-xl border border-white/[0.06] overflow-hidden"
      style={{ background: "#1C1C1E" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 0",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            RMM PERFORMANCE
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="What is RMM?"
                className="inline-flex items-center justify-center rounded-full transition-colors hover:text-white/55"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="max-w-xs text-xs space-y-2"
              style={{
                background: "#2C2C2E",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="font-semibold text-white/87">
                Rolling Momentum Model
              </p>
              <p className="text-white/55">
                Each dot = one video. Score = Video Views ÷ Your Median Views.
                1.0x = your normal.
              </p>
              <div className="space-y-0.5 text-white/40" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>
                <div>Stalled &lt;0.5x · Stable 0.5-1.5x</div>
                <div>Momentum 1.5-4x · Breakout 4-10x · Viral 10x+</div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Organic / All toggle */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            padding: 2,
          }}
        >
          {([true, false] as const).map((isOrganic) => (
            <button
              key={String(isOrganic)}
              type="button"
              onClick={() => onOrganicToggle(isOrganic)}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: (organicOnly === isOrganic) ? 600 : 400,
                color: (organicOnly === isOrganic)
                  ? "rgba(255,255,255,0.87)"
                  : "rgba(255,255,255,0.30)",
                background: (organicOnly === isOrganic)
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                border: "none",
                borderRadius: 6,
                padding: "4px 12px",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {isOrganic ? "Organic" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Limited data note */}
      {chartData.length > 0 && chartData.length < 5 && (
        <div style={{ padding: "8px 20px 0" }}>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Limited data ({chartData.length} video{chartData.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div style={{ padding: "12px 8px 0 0" }}>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
            <AreaChart
              data={chartData}
              margin={{
                top: 12,
                right: 20,
                bottom: 4,
                left: isMobile ? 0 : 8,
              }}
            >
              <defs>
                <linearGradient id="rmmAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8430a" stopOpacity={0.15} />
                  <stop offset="60%" stopColor="#e8430a" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="#e8430a" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tick={{
                  fontSize: 10,
                  fill: "rgba(255,255,255,0.25)",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                tickFormatter={(ts) => {
                  const label = format(new Date(ts), "MMM");
                  if (!tickSeenMonths.has(label)) {
                    tickSeenMonths.add(label);
                    return label;
                  }
                  return "";
                }}
              />
              {!isMobile && (
                <YAxis
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{
                    fontSize: 10,
                    fill: "rgba(255,255,255,0.20)",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                  width={28}
                />
              )}

              <RechartsTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.08)", strokeDasharray: "4 4" }}
              />

              <ReferenceLine
                y={1.0}
                strokeDasharray="6 4"
                stroke="rgba(255,255,255,0.10)"
                label={{
                  value: "Baseline",
                  position: "right",
                  fontSize: 9,
                  fill: "rgba(255,255,255,0.20)",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              />

              <Area
                type="monotone"
                dataKey="performance_ratio"
                stroke="#e8430a"
                strokeWidth={2}
                fill="url(#rmmAreaGrad)"
                dot={<RmmDot />}
                activeDot={{
                  r: 4,
                  fill: "#e8430a",
                  stroke: "#1C1C1E",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Video performance data not yet available
        </div>
      )}

      {/* Stats strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        <StatPill
          label="Current PR"
          value={currentPR != null ? `${currentPR.toFixed(1)}x` : "—"}
          color={prColor(currentPR)}
          accent={currentPR != null && currentPR >= 1.5}
        />
        <StatPill
          label="7d Avg"
          value={avg7PR != null ? `${avg7PR.toFixed(1)}x` : "—"}
          color={prColor(avg7PR)}
        />
        <StatPill
          label="30d Avg"
          value={avg30PR != null ? `${avg30PR.toFixed(1)}x` : "—"}
          color={prColor(avg30PR)}
        />
        <StatPill
          label="Median Baseline"
          value={fmtNum(medianBaseline)}
        />
      </div>
    </div>
  );
}

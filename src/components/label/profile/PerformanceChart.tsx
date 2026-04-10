import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle, ArrowUp, ArrowDown } from "lucide-react";
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

// ── Custom dot renderer (only breakout & viral) ─────────────────────────

function RmmDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const pr = payload?.performance_ratio ?? 0;

  if (pr >= 10) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="#FFD60A" opacity={0.25} />
        <circle cx={cx} cy={cy} r={5} fill="#FFD60A" />
      </g>
    );
  }
  if (pr >= 4) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#30D158" opacity={0.2} />
        <circle cx={cx} cy={cy} r={4} fill="#30D158" />
      </g>
    );
  }
  return null;
}

// ── Premium tooltip ─────────────────────────────────────────────────────

function PremiumChartTooltip({ active, payload }: any) {
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

  return (
    <div className="rounded-lg border border-white/10 bg-[#1E1E1E] px-3.5 py-2.5 text-xs shadow-xl min-w-[180px]">
      <p className="text-[#6B7280] mb-1">{dateStr}</p>
      <p className="text-white text-sm font-semibold">
        {d.performance_ratio?.toFixed(1)}x performance
      </p>
      <p className="text-[#6B7280] mt-1">Views: {fmtNum(d.views)}</p>
      {caption && <p className="text-[#6B7280] mt-1 italic">{caption}</p>}
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
    if (v == null) return "text-foreground";
    if (v > 1.5) return "text-green-400";
    if (v < 0.5) return "text-red-400";
    return "text-foreground";
  };

  const trendArrow =
    currentPR != null && avg30PR != null ? (
      currentPR > avg30PR ? (
        <ArrowUp className="w-3 h-3 text-green-400 inline" />
      ) : currentPR < avg30PR ? (
        <ArrowDown className="w-3 h-3 text-red-400 inline" />
      ) : null
    ) : null;

  const stats = [
    {
      label: "Current PR",
      value: currentPR != null ? `${currentPR.toFixed(1)}x` : "—",
      color: prColor(currentPR),
      arrow: trendArrow,
    },
    {
      label: "7d avg",
      value: avg7PR != null ? `${avg7PR.toFixed(1)}x` : "—",
      color: prColor(avg7PR),
      arrow: null,
    },
    {
      label: "30d avg",
      value: avg30PR != null ? `${avg30PR.toFixed(1)}x` : "—",
      color: prColor(avg30PR),
      arrow: null,
    },
    {
      label: "Median baseline",
      value: fmtNum(medianBaseline),
      color: "text-foreground",
      arrow: null,
    },
  ];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground">
          RMM Performance Trend
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="What is RMM Performance Trend?"
              className="inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="max-w-xs text-xs space-y-2"
          >
            <p className="font-semibold">Rolling Momentum Model (RMM)</p>
            <p>
              Each dot = one video. The score is calculated as: Video Views ÷
              Your Median Views (last 30 videos).
            </p>
            <p>
              1.0x = your normal. Above = outperforming, below =
              underperforming.
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>· Stalled: below 0.5x</li>
              <li>· Stable: 0.5x – 1.5x</li>
              <li>· Momentum: 1.5x – 4x</li>
              <li>· Breakout: 4x – 10x</li>
              <li>· Viral: 10x+</li>
            </ul>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex rounded-md bg-muted p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => onOrganicToggle(true)}
            className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors ${
              organicOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Organic
          </button>
          <button
            type="button"
            onClick={() => onOrganicToggle(false)}
            className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors ${
              !organicOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All (incl. Promoted)
          </button>
        </div>
      </div>

      {chartData.length > 0 && chartData.length < 5 && (
        <p className="text-xs text-muted-foreground mb-2">
          Limited video data available ({chartData.length} video
          {chartData.length !== 1 ? "s" : ""})
        </p>
      )}

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              bottom: 10,
              left: isMobile ? 0 : 10,
            }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(139,92,246,0.2)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tick={{ fontSize: 11, fill: "#6B7280" }}
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
                tick={{ fontSize: 11, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                domain={[0, "auto"]}
              />
            )}

            <RechartsTooltip
              content={<PremiumChartTooltip />}
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            />

            <ReferenceLine
              y={1.0}
              strokeDasharray="6 4"
              stroke="rgba(255,255,255,0.15)"
              label={{
                value: "Baseline",
                position: "right",
                fontSize: 10,
                fill: "#6B7280",
              }}
            />

            <Area
              type="monotone"
              dataKey="performance_ratio"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={<RmmDot />}
              activeDot={{ r: 4, fill: "#8B5CF6", stroke: "#8B5CF6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Video performance data not yet available — will populate after next
          pipeline run
        </p>
      )}

      {/* Stats pills */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border flex-wrap">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 min-w-[80px] text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {s.label}
            </p>
            <p
              className={`text-sm font-bold ${s.color} flex items-center justify-center gap-0.5`}
            >
              {s.value} {s.arrow}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

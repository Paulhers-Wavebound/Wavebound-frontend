import { VelocityDay, LifecycleInfo } from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import InfoPopover from "./InfoPopover";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMemo, useState } from "react";

type TimeRange = "7d" | "14d" | "30d" | "3m" | "6m" | "9m" | "all";
const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "14d", label: "14D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "9m", label: "9M" },
  { value: "all", label: "ALL" },
];

interface VelocityChartProps {
  velocity: VelocityDay[];
  lifecycle: LifecycleInfo;
}

function CustomTooltip({ active, payload, peakDate }: any) {
  if (!active || !payload?.[0]) return null;
  const day = payload[0].payload as VelocityDay;
  const isPeak = day.date === peakDate;

  return (
    <div
      style={{
        background: "var(--chart-tooltip-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--chart-tooltip-border)",
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 4,
        }}
      >
        {day.date}
        {isPeak ? " — Peak" : ""}
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          fontSize: 12,
          color: "var(--ink-secondary)",
        }}
      >
        <span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            {day.videos}
          </span>{" "}
          videos
        </span>
        <span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>
            {formatNumber(day.avg_views)}
          </span>{" "}
          avg views
        </span>
      </div>
    </div>
  );
}

export default function VelocityChart({
  velocity,
  lifecycle,
}: VelocityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const filteredVelocity = useMemo(() => {
    if (timeRange === "all") return velocity;

    const monthMap: Record<string, number> = { "3m": 90, "6m": 180, "9m": 270 };
    const days = monthMap[timeRange] ?? parseInt(timeRange);
    const isMonthly = timeRange in monthMap;
    const now = new Date();

    const dateMap = new Map<string, VelocityDay>();
    velocity.forEach((v) => {
      // Handle both ISO dates (2026-03-22) and short dates (Mar 22)
      let parsed: Date;
      if (/^\d{4}-\d{2}-\d{2}/.test(v.date)) {
        parsed = new Date(v.date);
      } else {
        parsed = new Date(v.date + " " + now.getFullYear());
        if (parsed > now) parsed.setFullYear(now.getFullYear() - 1);
      }
      if (!isNaN(parsed.getTime())) {
        dateMap.set(parsed.toISOString().slice(0, 10), v);
      }
    });

    const dailySeries: VelocityDay[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = dateMap.get(key);
      dailySeries.push(
        existing
          ? { ...existing, date: label }
          : { date: label, videos: 0, avg_views: 0 },
      );
    }

    if (!isMonthly) return dailySeries;

    const chunkSize = timeRange === "3m" ? 3 : 7;
    const weekly: VelocityDay[] = [];
    for (let i = 0; i < dailySeries.length; i += chunkSize) {
      const chunk = dailySeries.slice(i, i + chunkSize);
      const totalVideos = chunk.reduce((s, d) => s + d.videos, 0);
      const avgViews = chunk.filter((d) => d.avg_views > 0);
      weekly.push({
        date: chunk[0].date,
        videos: totalVideos,
        avg_views: avgViews.length
          ? Math.round(
              avgViews.reduce((s, d) => s + d.avg_views, 0) / avgViews.length,
            )
          : 0,
      });
    }
    return weekly;
  }, [velocity, timeRange]);

  const { peakIndex, currentVelocity, avg7d, peakValue } = useMemo(() => {
    if (filteredVelocity.length === 0)
      return { peakIndex: 0, currentVelocity: 0, avg7d: 0, peakValue: 0 };
    let pi = 0;
    filteredVelocity.forEach((d, i) => {
      if (d.videos > filteredVelocity[pi].videos) pi = i;
    });
    const last7 = filteredVelocity.slice(-7);
    return {
      peakIndex: pi,
      currentVelocity:
        filteredVelocity[filteredVelocity.length - 1]?.videos ?? 0,
      avg7d: Math.round(
        last7.reduce((s, d) => s + d.videos, 0) / Math.max(last7.length, 1),
      ),
      peakValue: filteredVelocity[pi]?.videos ?? 0,
    };
  }, [filteredVelocity]);

  const peakDate = filteredVelocity[peakIndex]?.date;

  // Bar opacity: full at peak, fades toward edges. Keeps one color, uses opacity for recency/intensity.
  const barOpacities = useMemo(() => {
    if (peakValue === 0) return filteredVelocity.map(() => 0.4);
    return filteredVelocity.map((d) => {
      const ratio = d.videos / peakValue;
      return 0.35 + ratio * 0.65; // range: 0.35 to 1.0
    });
  }, [filteredVelocity, peakValue]);

  const xInterval =
    filteredVelocity.length <= 7
      ? 0
      : filteredVelocity.length <= 14
        ? 1
        : Math.floor(filteredVelocity.length / 8);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 20,
        borderTop: "0.5px solid var(--card-edge)",
        flex: "1 1 60%",
      }}
    >
      {/* Header row with title + toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 14,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
            }}
          >
            Sound Velocity
          </div>
          <InfoPopover text="How many new videos are being made with your sound each day. Rising bars mean growing momentum, falling bars mean interest is slowing down." />
        </div>

        <div
          data-pdf-hide
          style={{
            display: "flex",
            gap: 4,
            background: "var(--surface-hover)",
            borderRadius: 8,
            padding: 3,
          }}
        >
          {TIME_OPTIONS.map((opt) => {
            const active = timeRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#fff" : "var(--ink-secondary)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={filteredVelocity}
          margin={{ top: 20, right: 8, bottom: 0, left: -20 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }}
            axisLine={false}
            tickLine={false}
            interval={xInterval}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--overlay-hover)" }}
            content={<CustomTooltip peakDate={peakDate} />}
          />
          <ReferenceLine
            x={peakDate}
            stroke="var(--ink-tertiary)"
            strokeDasharray="4 4"
            label={{
              value: "PEAK",
              position: "top",
              fill: "var(--ink-tertiary)",
              fontSize: 9,
              fontWeight: 600,
              dy: -4,
            }}
          />
          <Bar dataKey="videos" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {filteredVelocity.map((_, i) => (
              <Cell key={i} fill="#e8430a" fillOpacity={barOpacities[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Mini stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
        {[
          {
            label: "Current",
            value: String(currentVelocity),
            sub: "videos/day",
          },
          { label: "7D Average", value: String(avg7d), sub: "videos/day" },
          { label: "Peak", value: String(peakValue), sub: peakDate ?? "—" },
          {
            label: "Since Peak",
            value: `${lifecycle.days_since_peak}d`,
            sub: "ago",
          },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-tertiary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ink)",
                marginTop: 4,
                letterSpacing: "-0.03em",
              }}
            >
              {s.value}
            </div>
            <div
              style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

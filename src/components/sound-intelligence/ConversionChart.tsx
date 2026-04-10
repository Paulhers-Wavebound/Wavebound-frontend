import { useMemo, useState } from "react";
import {
  VelocityDay,
  SpotifySnapshot,
  LifecycleInfo,
} from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import InfoPopover from "./InfoPopover";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

type TimeRange = "7d" | "14d" | "30d" | "3m" | "all";
const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "14d", label: "14D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "all", label: "ALL" },
];

interface Props {
  velocity: VelocityDay[];
  lifecycle: LifecycleInfo;
  spotifySnapshots?: SpotifySnapshot[];
}

interface MergedDay {
  date: string;
  videos: number;
  avg_views: number;
  monthly_listeners?: number;
}

function CustomTooltip({ active, payload, peakDate }: any) {
  if (!active || !payload?.length) return null;
  const day = payload[0]?.payload as MergedDay;
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
          flexDirection: "column",
          gap: 3,
          fontSize: 12,
          color: "var(--ink-secondary)",
        }}
      >
        <span>
          <span style={{ color: "#e8430a", fontWeight: 600 }}>
            {day.videos}
          </span>{" "}
          videos/day
        </span>
        {day.monthly_listeners != null && (
          <span>
            <span style={{ color: "#1DB954", fontWeight: 600 }}>
              {formatNumber(day.monthly_listeners)}
            </span>{" "}
            monthly listeners
          </span>
        )}
      </div>
    </div>
  );
}

export default function ConversionChart({
  velocity,
  lifecycle,
  spotifySnapshots,
}: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const hasSpotify = spotifySnapshots && spotifySnapshots.length > 0;

  const { data, peakDate, peakValue } = useMemo(() => {
    // Filter velocity by time range
    let filtered = velocity;
    if (timeRange !== "all") {
      const monthMap: Record<string, number> = { "3m": 90 };
      const days = monthMap[timeRange] ?? parseInt(timeRange);
      const now = new Date();

      const dateMap = new Map<string, VelocityDay>();
      velocity.forEach((v) => {
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
      filtered = dailySeries;
    }

    // Build spotify lookup by date label
    const spotifyMap = new Map<string, number>();
    if (hasSpotify) {
      spotifySnapshots!.forEach((s) => {
        const d = new Date(s.date);
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        spotifyMap.set(label, s.monthly_listeners);
        // Also keep ISO date
        spotifyMap.set(s.date, s.monthly_listeners);
      });
    }

    // Merge
    const merged: MergedDay[] = filtered.map((v) => ({
      ...v,
      monthly_listeners: spotifyMap.get(v.date) ?? undefined,
    }));

    // Find peak
    let pi = 0;
    merged.forEach((d, i) => {
      if (d.videos > merged[pi].videos) pi = i;
    });

    return {
      data: merged,
      peakDate: merged[pi]?.date,
      peakValue: merged[pi]?.videos ?? 0,
    };
  }, [velocity, timeRange, spotifySnapshots, hasSpotify]);

  const barOpacities = useMemo(() => {
    if (peakValue === 0) return data.map(() => 0.4);
    return data.map((d) => 0.35 + (d.videos / peakValue) * 0.65);
  }, [data, peakValue]);

  const xInterval =
    data.length <= 7 ? 0 : data.length <= 14 ? 1 : Math.floor(data.length / 8);

  // Compute mini stats
  const last7 = data.slice(-7);
  const currentVelocity = data[data.length - 1]?.videos ?? 0;
  const avg7d = last7.length
    ? Math.round(last7.reduce((s, d) => s + d.videos, 0) / last7.length)
    : 0;

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
      {/* Header */}
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
              color: "var(--ink-tertiary)",
            }}
          >
            TikTok Velocity{hasSpotify ? " + Spotify Listeners" : ""}
          </div>
          <InfoPopover text="TikTok video creation velocity (orange bars) overlaid with Spotify monthly listeners (green line) to spot conversion from social to streaming." />
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

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          color: "var(--ink-tertiary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "#e8430a",
              opacity: 0.7,
            }}
          />
          Videos/day
        </span>
        {hasSpotify && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 2,
                borderRadius: 1,
                background: "#1DB954",
              }}
            />
            Monthly Listeners
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart
          data={data}
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
            yAxisId="left"
            tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }}
            axisLine={false}
            tickLine={false}
          />
          {hasSpotify && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#1DB954" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatNumber(v)}
            />
          )}
          <Tooltip
            cursor={{ fill: "var(--overlay-hover)" }}
            content={<CustomTooltip peakDate={peakDate} />}
          />
          <ReferenceLine
            yAxisId="left"
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
          <Bar
            yAxisId="left"
            dataKey="videos"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          >
            {data.map((_, i) => (
              <Cell key={i} fill="#e8430a" fillOpacity={barOpacities[i]} />
            ))}
          </Bar>
          {hasSpotify && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="monthly_listeners"
              stroke="#1DB954"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          )}
        </ComposedChart>
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
          {
            label: "Peak",
            value: String(peakValue),
            sub: peakDate ?? "—",
          },
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

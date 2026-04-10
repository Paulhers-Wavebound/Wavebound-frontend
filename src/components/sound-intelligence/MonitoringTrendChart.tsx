import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MonitoringSnapshot,
  MonitoringHistorySummary,
  SoundMonitoring,
  FORMAT_COLORS,
  INTENT_COLORS,
} from "@/types/soundIntelligence";
import {
  getSoundMonitoringHistory,
  formatNumber,
  timeAgo,
} from "@/utils/soundIntelligenceApi";
import { Loader2, Activity, Zap } from "lucide-react";

interface MonitoringTrendChartProps {
  jobId: string;
  monitoring?: SoundMonitoring | null;
}

type ChartMode = "format" | "niche" | "intent";

interface ChartPoint {
  time: string;
  label: string;
  total_views: number;
  [key: string]: string | number;
}

function buildChartData(
  snapshots: MonitoringSnapshot[],
  mode: ChartMode,
): {
  data: ChartPoint[];
  keys: string[];
} {
  const keySet = new Set<string>();
  for (const s of snapshots) {
    const stats =
      mode === "niche"
        ? s.niche_stats
        : mode === "intent"
          ? s.intent_stats
          : s.format_stats;
    if (stats) {
      for (const name of Object.keys(stats)) {
        keySet.add(name);
      }
    }
  }
  const allKeys = Array.from(keySet).sort();

  const data: ChartPoint[] = snapshots.map((s) => {
    const stats =
      mode === "niche"
        ? s.niche_stats
        : mode === "intent"
          ? s.intent_stats
          : s.format_stats;
    const point: ChartPoint = {
      time: s.captured_at,
      label: new Date(s.captured_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      total_views: s.total_views,
    };
    for (const name of allKeys) {
      point[name] = stats?.[name]?.views ?? 0;
    }
    return point;
  });

  // Only keep keys whose peak value is at least 5% of the max total_views.
  // This keeps the chart clean with 3-5 lines instead of 10+.
  const maxTotal = Math.max(...data.map((d) => d.total_views as number), 1);
  const threshold = maxTotal * 0.05;
  const keys = allKeys.filter((name) => {
    const peak = Math.max(...data.map((d) => (d[name] as number) || 0));
    return peak >= threshold;
  });

  return { data, keys };
}

// Known niche overrides — covers the most common niches
const NICHE_COLOR_OVERRIDES: Record<string, string> = {
  Casual: "#0A84FF",
  Music: "#e8430a",
  Cars: "#FF9F0A",
  Humor: "#FFD60A",
  Fashion: "#BF5AF2",
  Nightlife: "#FF453A",
  Dating: "#FF6482",
  Fitness: "#34C759",
  Travel: "#64D2FF",
  Food: "#AC8E68",
  Beauty: "#FF6482",
  Sports: "#FF9F0A",
  Family: "#30D158",
  School: "#0A84FF",
  Career: "#5AC8FA",
  Politics: "#8E8E93",
  "Mental Health": "#BF5AF2",
  Pets: "#FFCA28",
  Nature: "#34C759",
  Home: "#AC8E68",
  Tech: "#64D2FF",
  Art: "#DA70D6",
  ASMR: "#8E8E93",
  // Legacy backwards-compat
  "Casual / Social": "#0A84FF",
  "Music / Song": "#e8430a",
  "Car Culture": "#FF9F0A",
  "Comedy / Humor": "#FFD60A",
  "Fashion / Style": "#BF5AF2",
  "Party / Nightlife": "#FF453A",
  "Relationships / Dating": "#FF6482",
  "Fitness / Health": "#34C759",
  "Travel / Adventure": "#64D2FF",
  "Food / Cooking": "#AC8E68",
};

const NICHE_PALETTE = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F0B27A",
  "#76D7C4",
  "#F1948A",
  "#AED6F1",
  "#A3E4D7",
  "#FAD7A0",
  "#D2B4DE",
  "#A9DFBF",
  "#F5B7B1",
  "#AEB6BF",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getNicheColor(niche: string): string {
  if (NICHE_COLOR_OVERRIDES[niche]) return NICHE_COLOR_OVERRIDES[niche];
  return NICHE_PALETTE[hashString(niche) % NICHE_PALETTE.length];
}

function getKeyColor(key: string, mode: ChartMode): string {
  if (mode === "intent") return INTENT_COLORS[key] ?? "#8E8E93";
  if (mode === "niche") return getNicheColor(key);
  return FORMAT_COLORS[key] ?? "#8E8E93";
}

export default function MonitoringTrendChart({
  jobId,
  monitoring,
}: MonitoringTrendChartProps) {
  const [snapshots, setSnapshots] = useState<MonitoringSnapshot[]>([]);
  const [summary, setSummary] = useState<MonitoringHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<ChartMode>("format");

  const fetchData = useCallback(async () => {
    try {
      const res = await getSoundMonitoringHistory(jobId, 24);
      setSnapshots(res.snapshots);
      setSummary(res.summary);
    } catch {
      // Non-critical — silently fail
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: "40px 20px",
          borderTop: "0.5px solid var(--card-edge)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Loader2
          size={18}
          color="var(--ink-tertiary)"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-tertiary)",
          }}
        >
          Loading monitoring data...
        </span>
      </div>
    );
  }

  const hasNicheStats = snapshots.some(
    (s) => s.niche_stats && Object.keys(s.niche_stats).length > 0,
  );
  const hasIntentStats = snapshots.some(
    (s) => s.intent_stats && Object.keys(s.intent_stats).length > 0,
  );

  if (snapshots.length < 2) return null;

  // Compute deltas from first to last snapshot
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const viewDelta = last.total_views - first.total_views;
  const videoDelta = last.total_videos - first.total_videos;
  const creatorCount = last.user_count;
  const newVideosTotal = snapshots.reduce(
    (s, snap) => s + (snap.new_videos_count || 0),
    0,
  );

  const isIntensive = monitoring?.monitoring_interval === "intensive";
  const intervalLabel = isIntensive ? "15min" : "3h";

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 20,
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      {/* Header line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
          }}
        >
          {isIntensive ? (
            <Zap size={14} color="#FF453A" style={{ flexShrink: 0 }} />
          ) : (
            <Activity
              size={14}
              color="var(--accent)"
              style={{ flexShrink: 0 }}
            />
          )}
          <span
            style={{
              color: isIntensive ? "#FF453A" : "var(--ink-tertiary)",
            }}
          >
            {isIntensive ? "Intensive Monitoring" : "Live Monitoring"}
          </span>
          <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>·</span>
          <span
            style={{
              color: "var(--ink-faint)",
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: "normal",
            }}
          >
            Scanning every {intervalLabel}
          </span>
          {monitoring?.last_monitored_at && (
            <>
              <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>
                ·
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: "normal",
                }}
              >
                Last checked {timeAgo(monitoring.last_monitored_at)}
              </span>
            </>
          )}
          {isIntensive && monitoring?.spike_format && (
            <>
              <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>
                ·
              </span>
              <span
                style={{
                  color: "#FF453A",
                  fontWeight: 500,
                  textTransform: "none",
                  letterSpacing: "normal",
                }}
              >
                Tracking {monitoring.spike_format} spike
              </span>
            </>
          )}
        </div>

        {/* Total delta context */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-secondary)",
          }}
        >
          {viewDelta > 0 && (
            <span style={{ fontWeight: 600, color: "#30D158" }}>
              +{formatNumber(viewDelta)} views
            </span>
          )}
          {(newVideosTotal > 0 || videoDelta > 0) && (
            <>
              <span style={{ color: "var(--ink-faint)" }}>·</span>
              <span>+{newVideosTotal || videoDelta} new videos</span>
            </>
          )}
          {creatorCount > 0 && (
            <>
              <span style={{ color: "var(--ink-faint)" }}>·</span>
              <span>{formatNumber(creatorCount)} creators</span>
            </>
          )}
        </div>
      </div>

      {/* Spike badges — capped at 3 */}
      {chartMode === "format" &&
        summary?.format_growth &&
        Object.keys(summary.format_growth).length > 0 &&
        (() => {
          const spikes = Object.entries(summary.format_growth)
            .filter(([, g]) => g.growth_pct > 0)
            .sort(([, a], [, b]) => b.growth_pct - a.growth_pct);
          const shown = spikes.slice(0, 3);
          const remaining = spikes.length - shown.length;
          if (shown.length === 0) return null;
          return (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 14,
                alignItems: "center",
              }}
            >
              {shown.map(([name, g]) => (
                <span
                  key={name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 100,
                    background: `${FORMAT_COLORS[name] || "#8E8E93"}14`,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    color: FORMAT_COLORS[name] || "var(--ink-secondary)",
                  }}
                >
                  {name}
                  <span style={{ fontWeight: 700 }}>+{g.growth_pct}%</span>
                  <span
                    style={{
                      color: "var(--ink-faint)",
                      fontWeight: 400,
                      fontSize: 10,
                    }}
                  >
                    {g.views_delta > 0 ? `↑${formatNumber(g.views_delta)}` : ""}
                  </span>
                </span>
              ))}
              {remaining > 0 && (
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  +{remaining} more
                </span>
              )}
            </div>
          );
        })()}

      {/* Mode tabs */}
      {(hasNicheStats || hasIntentStats) && (
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 12,
            padding: 2,
            background: "var(--overlay-subtle)",
            borderRadius: 8,
            width: "fit-content",
          }}
        >
          {(
            [
              { key: "format" as ChartMode, label: "Format" },
              ...(hasNicheStats
                ? [{ key: "niche" as ChartMode, label: "Niche" }]
                : []),
              ...(hasIntentStats
                ? [{ key: "intent" as ChartMode, label: "Intent" }]
                : []),
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setChartMode(tab.key)}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background:
                  chartMode === tab.key ? "var(--surface)" : "transparent",
                color:
                  chartMode === tab.key ? "var(--ink)" : "var(--ink-tertiary)",
                transition: "all 150ms",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <MonitoringChart snapshots={snapshots} chartMode={chartMode} />
    </div>
  );
}

function MonitoringChart({
  snapshots,
  chartMode,
}: {
  snapshots: MonitoringSnapshot[];
  chartMode: ChartMode;
}) {
  const { data, keys } = buildChartData(snapshots, chartMode);

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              fill: "rgba(255,255,255,0.4)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              fill: "rgba(255,255,255,0.4)",
            }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              const nonZero = payload
                .filter((p) => Number(p.value) > 0)
                .sort((a, b) => Number(b.value) - Number(a.value));
              const shown = nonZero.slice(0, 5);
              const remaining = nonZero.length - shown.length;
              if (shown.length === 0) return null;

              return (
                <div
                  style={{
                    background: "var(--surface, #1C1C1E)",
                    border: "1px solid var(--border, rgba(255,255,255,0.06))",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    maxWidth: 260,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  {shown.map((p) => (
                    <div
                      key={String(p.dataKey)}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        color: "rgba(255,255,255,0.55)",
                        padding: "2px 0",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: String(p.color),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
                      <b style={{ color: "rgba(255,255,255,0.87)" }}>
                        {formatNumber(Number(p.value))}
                      </b>
                    </div>
                  ))}
                  {remaining > 0 && (
                    <div
                      style={{
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 11,
                        marginTop: 4,
                        paddingTop: 4,
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      +{remaining} more
                    </div>
                  )}
                </div>
              );
            }}
          />
          {/* Total views line — thicker, semi-transparent */}
          <Line
            type="monotone"
            dataKey="total_views"
            name="Total Views"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={2.5}
            dot={false}
            strokeDasharray="4 4"
          />
          {/* Per-key lines */}
          {keys.map((name) => {
            const color = getKeyColor(name, chartMode);
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: color }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Custom grid legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "4px 12px",
          marginTop: 10,
          maxHeight: 80,
          overflow: "hidden",
        }}
      >
        {[
          { name: "Total Views", color: "rgba(255,255,255,0.25)" },
          ...keys.map((name) => ({
            name,
            color: getKeyColor(name, chartMode),
          })),
        ].map((item) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 0",
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

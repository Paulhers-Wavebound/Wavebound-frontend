import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  SoundComparisonResponse,
  FORMAT_COLORS,
} from "@/types/soundIntelligence";
import { getSoundComparison, formatNumber } from "@/utils/soundIntelligenceApi";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Minus,
  Music,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLOR_A = "#e8430a";
const COLOR_B = "#0A84FF";

export default function SoundComparison() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobIdA = searchParams.get("a");
  const jobIdB = searchParams.get("b");

  const [data, setData] = useState<SoundComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobIdA || !jobIdB) {
      setError("Two sound IDs required for comparison.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const result = await getSoundComparison(jobIdA, jobIdB);
        setData(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Comparison failed";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [jobIdA, jobIdB]);

  if (loading) {
    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "120px 0",
          }}
        >
          <Loader2
            size={32}
            color="var(--accent)"
            style={{ animation: "spin 1s linear infinite" }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            color: "var(--ink-secondary)",
            marginBottom: 16,
          }}
        >
          {error ?? "No comparison data available."}
        </div>
        <button
          onClick={() => navigate("/label/sound-intelligence")}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to My Sounds
        </button>
      </div>
    );
  }

  const { sound_a, sound_b, deltas } = data;
  const analysisA = sound_a.analysis;
  const analysisB = sound_b.analysis;

  // Merge velocity timelines for overlay chart
  const velocityMap = new Map<
    string,
    { date: string; a_videos: number; b_videos: number }
  >();
  if (analysisA?.velocity) {
    for (const v of analysisA.velocity) {
      velocityMap.set(v.date, {
        date: v.date,
        a_videos: v.videos,
        b_videos: 0,
      });
    }
  }
  if (analysisB?.velocity) {
    for (const v of analysisB.velocity) {
      const existing = velocityMap.get(v.date);
      if (existing) {
        existing.b_videos = v.videos;
      } else {
        velocityMap.set(v.date, {
          date: v.date,
          a_videos: 0,
          b_videos: v.videos,
        });
      }
    }
  }
  const velocityData = Array.from(velocityMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Format comparison — get all format names
  const allFormats = Object.keys(deltas.format_comparison).sort(
    (a, b) =>
      deltas.format_comparison[b].count_a +
      deltas.format_comparison[b].count_b -
      (deltas.format_comparison[a].count_a +
        deltas.format_comparison[a].count_b),
  );
  const formatMaxCount = Math.max(
    ...allFormats.map((f) =>
      Math.max(
        deltas.format_comparison[f].count_a,
        deltas.format_comparison[f].count_b,
      ),
    ),
    1,
  );

  // Creator tier comparison
  const tierNames = Object.keys(deltas.creator_tier_comparison);
  const tierMaxPct = Math.max(
    ...tierNames.map((t) =>
      Math.max(
        deltas.creator_tier_comparison[t].pct_a,
        deltas.creator_tier_comparison[t].pct_b,
      ),
    ),
    1,
  );

  return (
    <>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px 80px",
        }}
      >
        {/* Back nav */}
        <button
          onClick={() => navigate("/label/sound-intelligence")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
            cursor: "pointer",
            padding: 0,
            marginBottom: 24,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--ink-tertiary)")
          }
        >
          <ArrowLeft size={16} />
          Back to My Sounds
        </button>

        {/* Header: Sound A vs Sound B */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <SoundHeaderCard
            trackName={sound_a.track_name}
            artistName={sound_a.artist_name}
            coverUrl={sound_a.cover_url}
            color={COLOR_A}
            label="A"
            status={deltas.lifecycle_comparison.phase_a}
          />
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ink-tertiary)",
            }}
          >
            vs
          </div>
          <SoundHeaderCard
            trackName={sound_b.track_name}
            artistName={sound_b.artist_name}
            coverUrl={sound_b.cover_url}
            color={COLOR_B}
            label="B"
            status={deltas.lifecycle_comparison.phase_b}
          />
        </div>

        {/* Delta Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <DeltaCard
            label="Velocity"
            valueA={deltas.velocity_a}
            valueB={deltas.velocity_b}
            diff={deltas.velocity_diff}
            format={(v) => `${v > 0 ? "+" : ""}${v}`}
          />
          <DeltaCard
            label="Creators"
            valueA={deltas.creator_count_a}
            valueB={deltas.creator_count_b}
            diff={deltas.creator_count_diff}
            format={formatNumber}
          />
          <DeltaCard
            label="Total Views"
            valueA={deltas.total_views_a}
            valueB={deltas.total_views_b}
            diff={deltas.total_views_diff}
            format={formatNumber}
          />
          <DeltaCard
            label="Avg Spark Score"
            valueA={deltas.avg_spark_score_a}
            valueB={deltas.avg_spark_score_b}
            diff={deltas.avg_spark_score_diff}
            format={(v) => v.toFixed(1)}
          />
        </div>

        {/* Velocity Overlay Chart */}
        {velocityData.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              borderTop: "0.5px solid var(--card-edge)",
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-secondary)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Velocity Curves
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={velocityData}>
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 11,
                    fill: "var(--ink-faint)",
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickFormatter={(d: string) => {
                    const dt = new Date(d);
                    return `${dt.getMonth() + 1}/${dt.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "var(--ink-faint)",
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface, #1C1C1E)",
                    border: "1px solid var(--border, rgba(255,255,255,0.06))",
                    borderRadius: 10,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                  }}
                  labelFormatter={(d: string) =>
                    new Date(d).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                  }}
                />
                <Line
                  name={sound_a.track_name}
                  dataKey="a_videos"
                  stroke={COLOR_A}
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
                <Line
                  name={sound_b.track_name}
                  dataKey="b_videos"
                  stroke={COLOR_B}
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Format Breakdown Comparison */}
        {allFormats.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              borderTop: "0.5px solid var(--card-edge)",
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-secondary)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Format Breakdown
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {/* Sound A column */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLOR_A,
                    marginBottom: 10,
                  }}
                >
                  {sound_a.track_name}
                </div>
                {allFormats.slice(0, 10).map((fmt) => {
                  const d = deltas.format_comparison[fmt];
                  return (
                    <FormatBar
                      key={fmt}
                      name={fmt}
                      count={d.count_a}
                      views={d.views_a}
                      maxCount={formatMaxCount}
                      color={FORMAT_COLORS[fmt] ?? "var(--ink-tertiary)"}
                    />
                  );
                })}
              </div>
              {/* Sound B column */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLOR_B,
                    marginBottom: 10,
                  }}
                >
                  {sound_b.track_name}
                </div>
                {allFormats.slice(0, 10).map((fmt) => {
                  const d = deltas.format_comparison[fmt];
                  return (
                    <FormatBar
                      key={fmt}
                      name={fmt}
                      count={d.count_b}
                      views={d.views_b}
                      maxCount={formatMaxCount}
                      color={FORMAT_COLORS[fmt] ?? "var(--ink-tertiary)"}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Geographic Spread */}
        {deltas.geographic_overlap && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              borderTop: "0.5px solid var(--card-edge)",
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-secondary)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Geographic Spread
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {/* Shared */}
              {deltas.geographic_overlap.shared_countries.length > 0 && (
                <GeoColumn
                  label="Shared"
                  countries={deltas.geographic_overlap.shared_countries}
                  color="var(--ink-secondary)"
                  highlight
                />
              )}
              {/* Unique to A */}
              {deltas.geographic_overlap.unique_a.length > 0 && (
                <GeoColumn
                  label={`Only ${sound_a.track_name}`}
                  countries={deltas.geographic_overlap.unique_a}
                  color={COLOR_A}
                />
              )}
              {/* Unique to B */}
              {deltas.geographic_overlap.unique_b.length > 0 && (
                <GeoColumn
                  label={`Only ${sound_b.track_name}`}
                  countries={deltas.geographic_overlap.unique_b}
                  color={COLOR_B}
                />
              )}
            </div>
          </div>
        )}

        {/* Creator Tier Comparison */}
        {tierNames.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              borderTop: "0.5px solid var(--card-edge)",
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-secondary)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Creator Tier Comparison
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tierNames.map((tier) => {
                const d = deltas.creator_tier_comparison[tier];
                return (
                  <div key={tier}>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--ink-secondary)",
                        marginBottom: 4,
                      }}
                    >
                      {tier}
                    </div>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      {/* Bar A */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.04)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${tierMaxPct > 0 ? (d.pct_a / tierMaxPct) * 100 : 0}%`,
                              height: "100%",
                              borderRadius: 4,
                              background: COLOR_A,
                              transition: "width 300ms ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            color: COLOR_A,
                            fontWeight: 600,
                            minWidth: 36,
                            textAlign: "right",
                          }}
                        >
                          {d.pct_a.toFixed(0)}%
                        </span>
                      </div>
                      {/* Bar B */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.04)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${tierMaxPct > 0 ? (d.pct_b / tierMaxPct) * 100 : 0}%`,
                              height: "100%",
                              borderRadius: 4,
                              background: COLOR_B,
                              transition: "width 300ms ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            color: COLOR_B,
                            fontWeight: 600,
                            minWidth: 36,
                            textAlign: "right",
                          }}
                        >
                          {d.pct_b.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// --- Sub-components ---

function SoundHeaderCard({
  trackName,
  artistName,
  coverUrl,
  color,
  label,
  status,
}: {
  trackName: string;
  artistName: string;
  coverUrl: string | null;
  color: string;
  label: string;
  status: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        padding: "14px 18px",
        flex: 1,
        minWidth: 240,
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={trackName}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "var(--overlay-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Music size={20} color="var(--ink-tertiary)" />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {trackName}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-tertiary)",
          }}
        >
          {artistName}
        </div>
      </div>
      {status && (
        <span
          style={{
            marginLeft: "auto",
            padding: "3px 8px",
            borderRadius: 6,
            background: `${color}15`,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color,
            textTransform: "capitalize",
            flexShrink: 0,
          }}
        >
          {status}
        </span>
      )}
    </div>
  );
}

function DeltaCard({
  label,
  valueA,
  valueB,
  diff,
  format,
}: {
  label: string;
  valueA: number;
  valueB: number;
  diff: number;
  format: (v: number) => string;
}) {
  const positive = diff > 0;
  const neutral = diff === 0;
  const diffColor = neutral
    ? "var(--ink-tertiary)"
    : positive
      ? "#30D158"
      : "#FF453A";
  const DiffIcon = neutral ? Minus : positive ? ArrowUp : ArrowDown;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        borderTop: "0.5px solid var(--card-edge)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            fontWeight: 600,
            color: COLOR_A,
          }}
        >
          {format(valueA)}
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            fontWeight: 600,
            color: COLOR_B,
          }}
        >
          {format(valueB)}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          justifyContent: "center",
        }}
      >
        <DiffIcon size={12} color={diffColor} />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: diffColor,
          }}
        >
          {format(Math.abs(diff))}
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 10,
            color: "var(--ink-faint)",
          }}
        >
          {neutral ? "tied" : positive ? "A leads" : "B leads"}
        </span>
      </div>
    </div>
  );
}

function FormatBar({
  name,
  count,
  views,
  maxCount,
  color,
}: {
  name: string;
  count: number;
  views: number;
  maxCount: number;
  color: string;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-secondary)",
            fontWeight: 500,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-faint)",
          }}
        >
          {count} vid{count !== 1 ? "s" : ""} / {formatNumber(views)} views
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            background: color,
            transition: "width 300ms ease",
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
}

function GeoColumn({
  label,
  countries,
  color,
  highlight,
}: {
  label: string;
  countries: string[];
  color: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ minWidth: 140 }}>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {countries.map((c) => (
          <span
            key={c}
            style={{
              padding: "3px 8px",
              borderRadius: 6,
              background: highlight ? "rgba(255,255,255,0.08)" : `${color}15`,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              color: highlight ? "var(--ink)" : color,
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

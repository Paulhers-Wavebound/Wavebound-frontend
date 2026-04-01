import { FormatBreakdown, getFormatColor } from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { ChevronDown, ChevronUp, ExternalLink, TrendingUp } from "lucide-react";
import SongTimestampHeatmap from "./SongTimestampHeatmap";
import { useState, useMemo } from "react";

interface Props {
  formats: FormatBreakdown[];
  expandedFormat: number | null;
  onToggle: (i: number) => void;
  songDuration?: number;
  spikeFormat?: string | null;
}

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  SCALE: { bg: "rgba(48,209,88,0.15)", text: "#30D158" },
  SATURATED: { bg: "rgba(255,159,10,0.15)", text: "#FF9F0A" },
  EMERGING: { bg: "rgba(10,132,255,0.15)", text: "#0A84FF" },
  DECLINING: { bg: "rgba(255,69,58,0.15)", text: "#FF453A" },
};

function computeVerdict(
  f: FormatBreakdown,
): "SCALE" | "SATURATED" | "EMERGING" | "DECLINING" {
  const daily = f.daily;
  if (daily.length < 2) return "EMERGING";
  const mid = Math.floor(daily.length / 2);
  const recentHalf = daily.slice(mid);
  const earlyHalf = daily.slice(0, mid);
  const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
  const earlyAvg = earlyHalf.reduce((a, b) => a + b, 0) / earlyHalf.length;
  const trend =
    earlyAvg > 0 ? (recentAvg - earlyAvg) / earlyAvg : recentAvg > 0 ? 1 : 0;

  if (f.video_count < 10 && trend > -0.1) return "EMERGING";
  if (trend < -0.3) return "DECLINING";
  if (trend < 0 && f.share_rate < 2) return "SATURATED";
  return "SCALE";
}

type SortKey =
  | "name"
  | "video_count"
  | "pct_of_total"
  | "avg_views"
  | "share_rate"
  | "actual_share_rate"
  | "verdict";
type SortDir = "asc" | "desc";

const VERDICT_ORDER: Record<string, number> = {
  SCALE: 0,
  EMERGING: 1,
  SATURATED: 2,
  DECLINING: 3,
};

const SORT_HEADERS_BASE: { key: SortKey; label: string }[] = [
  { key: "name", label: "Format" },
  { key: "video_count", label: "Videos" },
  { key: "pct_of_total", label: "% Total" },
  { key: "avg_views", label: "Avg Views" },
  { key: "share_rate", label: "Engagement Rate" },
  { key: "verdict", label: "Verdict" },
];

export default function FormatBreakdownTable({
  formats,
  expandedFormat,
  onToggle,
  songDuration,
  spikeFormat,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const hasActualShareRate = formats.some((f) => f.actual_share_rate != null);

  const SORT_HEADERS = hasActualShareRate
    ? [
        ...SORT_HEADERS_BASE.slice(0, 5),
        { key: "actual_share_rate" as SortKey, label: "Share Rate" },
        ...SORT_HEADERS_BASE.slice(5),
      ]
    : SORT_HEADERS_BASE;

  const gridCols = hasActualShareRate
    ? "1.8fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr 0.7fr 36px"
    : "1.8fr 0.7fr 0.7fr 0.8fr 1fr 0.7fr 36px";

  // PDF-friendly grid without the chevron column — give engagement rate more room
  const pdfGridCols = hasActualShareRate
    ? "1.6fr 0.55fr 0.55fr 0.7fr 1.2fr 0.7fr 0.7fr"
    : "1.6fr 0.55fr 0.55fr 0.7fr 1.3fr 0.7fr";

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "desc") setSortDir("asc");
      else {
        setSortKey(null);
        setSortDir("desc");
      } // third click resets
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedFormats = useMemo(() => {
    const indexed = formats.map((f, i) => ({ f, origIndex: i }));
    if (!sortKey) return indexed;
    return [...indexed].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.f.name.localeCompare(b.f.name);
          break;
        case "video_count":
          cmp = a.f.video_count - b.f.video_count;
          break;
        case "pct_of_total":
          cmp = a.f.pct_of_total - b.f.pct_of_total;
          break;
        case "avg_views":
          cmp = a.f.avg_views - b.f.avg_views;
          break;
        case "share_rate":
          cmp = a.f.share_rate - b.f.share_rate;
          break;
        case "actual_share_rate":
          cmp = (a.f.actual_share_rate ?? 0) - (b.f.actual_share_rate ?? 0);
          break;
        case "verdict":
          cmp =
            (VERDICT_ORDER[computeVerdict(a.f)] ?? 4) -
            (VERDICT_ORDER[computeVerdict(b.f)] ?? 4);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [formats, sortKey, sortDir]);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 20,
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 16,
        }}
      >
        Format Breakdown
      </div>

      {/* Header */}
      <div
        data-pdf-grid-template={pdfGridCols}
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          gap: 8,
          padding: "0 8px 10px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {SORT_HEADERS.map((h) => {
          const isActive = sortKey === h.key;
          return (
            <button
              key={h.key}
              onClick={() => handleSort(h.key)}
              aria-sort={
                isActive
                  ? sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : undefined
              }
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? "var(--accent)" : "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 3,
                textAlign: "left",
                transition: "color 150ms",
              }}
            >
              {h.label}
              {isActive && (
                <span data-pdf-hide>
                  {sortDir === "desc" ? (
                    <ChevronDown size={12} color="var(--accent)" />
                  ) : (
                    <ChevronUp size={12} color="var(--accent)" />
                  )}
                </span>
              )}
            </button>
          );
        })}
        <div />
      </div>

      {sortedFormats.map(({ f, origIndex }, rowIdx) => {
        const isOpen = expandedFormat === origIndex;
        const color = getFormatColor(f.name, origIndex);
        const verdict = computeVerdict(f);
        const vc = VERDICT_COLORS[verdict];
        const zebra = rowIdx % 2 === 1 ? "var(--overlay-subtle)" : "none";
        const isSpiking = spikeFormat != null && f.name === spikeFormat;

        return (
          <div key={f.name}>
            {/* Row */}
            <button
              onClick={() => onToggle(origIndex)}
              aria-expanded={isOpen}
              aria-label={`${f.name} format — ${isOpen ? "collapse" : "expand"} details`}
              data-pdf-grid-template={pdfGridCols}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 8,
                width: "100%",
                padding: "12px 8px",
                background: isSpiking
                  ? "rgba(255,69,58,0.06)"
                  : isOpen
                    ? "var(--overlay-hover)"
                    : zebra,
                border: "none",
                borderBottom: "1px solid var(--border)",
                borderLeft: isSpiking
                  ? "3px solid #FF453A"
                  : "3px solid transparent",
                cursor: "pointer",
                alignItems: "center",
                textAlign: "left",
                transition: "background 150ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {f.name}
                </span>
                {isSpiking && (
                  <TrendingUp
                    size={14}
                    color="#FF453A"
                    style={{
                      flexShrink: 0,
                      animation: "monitorPulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              >
                {f.video_count}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              >
                {f.pct_of_total}%
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              >
                {formatNumber(f.avg_views)}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(f.share_rate * 10, 100)}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: color,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "var(--ink-secondary)",
                    minWidth: 36,
                  }}
                >
                  {f.share_rate}%
                </span>
              </div>
              {hasActualShareRate && (
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  {f.actual_share_rate != null
                    ? `${f.actual_share_rate}%`
                    : "—"}
                </span>
              )}
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 99,
                  background: vc.bg,
                  color: vc.text,
                  letterSpacing: "0.3px",
                }}
              >
                {verdict}
              </span>
              <span data-pdf-hide>
                <ChevronDown
                  size={16}
                  color="var(--ink-tertiary)"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 200ms",
                  }}
                />
              </span>
            </button>

            {/* Drilldown */}
            {isOpen && (
              <div
                style={{
                  padding: 16,
                  background: "var(--overlay-subtle)",
                  borderBottom: "1px solid var(--border)",
                  animation: "fadeInUp 0.25s ease both",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  {/* Song Timestamp Heatmap */}
                  <SongTimestampHeatmap
                    songBars={f.songBars}
                    hooks={f.hooks}
                    videoCount={f.video_count}
                    color={color}
                    songDuration={songDuration}
                  />

                  {/* Hook Patterns */}
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--ink-tertiary)",
                        marginBottom: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Hook Patterns
                    </div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                      <div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: "var(--ink)",
                          }}
                        >
                          {f.hooks.face_pct}%
                        </div>
                        <div
                          style={{ fontSize: 11, color: "var(--ink-tertiary)" }}
                        >
                          Face in 2s
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: "var(--ink)",
                          }}
                        >
                          {f.hooks.snippet_pct}%
                        </div>
                        <div
                          style={{ fontSize: 11, color: "var(--ink-tertiary)" }}
                        >
                          Snippet
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {f.hooks.top_hooks.map((h) => (
                        <span
                          key={h}
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            padding: "3px 8px",
                            borderRadius: 99,
                            background: "var(--border-subtle)",
                            color: "var(--ink-secondary)",
                          }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Daily Velocity */}
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--ink-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Videos Posted Per Day
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          color: "var(--ink-faint)",
                        }}
                      >
                        {f.daily.length} days
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={56}>
                      <BarChart
                        data={f.daily.map((v, di) => ({
                          videos: v,
                          day: `Day ${di + 1}`,
                        }))}
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      >
                        <Tooltip
                          cursor={{ fill: "var(--overlay-hover)" }}
                          contentStyle={{
                            background: "var(--chart-tooltip-bg)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid var(--chart-tooltip-border)",
                            borderRadius: 8,
                            padding: "6px 10px",
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 12,
                          }}
                          labelStyle={{
                            color: "var(--ink)",
                            fontWeight: 600,
                            marginBottom: 2,
                          }}
                          itemStyle={{ color: "var(--ink-secondary)" }}
                          formatter={(value: number) => [`${value} videos`, ""]}
                        />
                        <Bar
                          dataKey="videos"
                          radius={[2, 2, 0, 0]}
                          maxBarSize={12}
                        >
                          {f.daily.map((_, di) => (
                            <Cell key={di} fill={color} fillOpacity={0.7} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 10,
                          color: "var(--ink-faint)",
                        }}
                      >
                        Oldest
                      </span>
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 10,
                          color: "var(--ink-faint)",
                        }}
                      >
                        Latest
                      </span>
                    </div>
                  </div>

                  {/* Insight + Quick Stats */}
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--ink-tertiary)",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Insight
                    </div>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        color: "var(--ink-secondary)",
                        lineHeight: 1.5,
                        marginBottom: 12,
                      }}
                    >
                      {f.insight}
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { label: "Videos", value: String(f.video_count) },
                        {
                          label: "Avg Views",
                          value: formatNumber(f.avg_views),
                        },
                        { label: "Engagement", value: `${f.share_rate}%` },
                        ...(f.actual_share_rate != null
                          ? [
                              {
                                label: "Share Rate",
                                value: `${f.actual_share_rate}%`,
                              },
                            ]
                          : []),
                      ].map((s) => (
                        <div key={s.label}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {s.value}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Per-format Posting Hours */}
                {f.posting_hours &&
                  f.posting_hours.some((v) => v > 0) &&
                  (() => {
                    const ph = f.posting_hours!;
                    const phMax = Math.max(...ph, 1);
                    const phPeak = ph.indexOf(Math.max(...ph));
                    const phLabels = [
                      "12a",
                      "1a",
                      "2a",
                      "3a",
                      "4a",
                      "5a",
                      "6a",
                      "7a",
                      "8a",
                      "9a",
                      "10a",
                      "11a",
                      "12p",
                      "1p",
                      "2p",
                      "3p",
                      "4p",
                      "5p",
                      "6p",
                      "7p",
                      "8p",
                      "9p",
                      "10p",
                      "11p",
                    ];
                    return (
                      <div
                        style={{
                          background: "var(--surface)",
                          borderRadius: 12,
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--ink-tertiary)",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Posting Hours
                          </div>
                          <div
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 11,
                              color: "var(--ink-faint)",
                            }}
                          >
                            Peak: {phLabels[phPeak]}
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={48}>
                          <BarChart
                            data={ph.map((c, hi) => ({
                              count: c,
                              hour: phLabels[hi],
                            }))}
                            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                          >
                            <Tooltip
                              cursor={{ fill: "var(--overlay-hover)" }}
                              contentStyle={{
                                background: "var(--chart-tooltip-bg)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid var(--chart-tooltip-border)",
                                borderRadius: 8,
                                padding: "6px 10px",
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 12,
                              }}
                              labelStyle={{
                                color: "var(--ink)",
                                fontWeight: 600,
                                marginBottom: 2,
                              }}
                              itemStyle={{ color: "var(--ink-secondary)" }}
                              formatter={(value: number) => [
                                `${value} videos`,
                                "",
                              ]}
                            />
                            <Bar
                              dataKey="count"
                              radius={[2, 2, 0, 0]}
                              maxBarSize={8}
                            >
                              {ph.map((c, hi) => (
                                <Cell
                                  key={hi}
                                  fill={color}
                                  fillOpacity={
                                    hi === phPeak ? 1 : 0.2 + (c / phMax) * 0.5
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 2,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 9,
                              color: "var(--ink-faint)",
                            }}
                          >
                            12am
                          </span>
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 9,
                              color: "var(--ink-faint)",
                            }}
                          >
                            12pm
                          </span>
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 9,
                              color: "var(--ink-faint)",
                            }}
                          >
                            12am
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                {/* Top Videos */}
                {f.topVideos.length > 0 && (
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--ink-tertiary)",
                        marginBottom: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Top Videos
                    </div>
                    {f.topVideos.map((tv, ti) => {
                      const cleanHandle = tv.handle.replace(/^@+/, "");
                      const handle = `@${cleanHandle}`;
                      const profileUrl = `https://www.tiktok.com/@${cleanHandle}`;
                      return (
                        <a
                          key={ti}
                          href={tv.video_url || profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            padding: "8px 4px",
                            borderBottom:
                              ti < f.topVideos.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                            textDecoration: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            transition: "background 150ms",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--overlay-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <span
                            className="group-hover:underline"
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--ink-tertiary)",
                              minWidth: 24,
                              transition: "color 150ms",
                            }}
                          >
                            {tv.handle}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              color: "var(--ink-secondary)",
                            }}
                          >
                            {tv.why}
                          </span>
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              color: "var(--ink)",
                            }}
                          >
                            {tv.views}
                          </span>
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            {tv.share}
                          </span>
                          <ExternalLink
                            size={14}
                            color="var(--ink-tertiary)"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ flexShrink: 0 }}
                          />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

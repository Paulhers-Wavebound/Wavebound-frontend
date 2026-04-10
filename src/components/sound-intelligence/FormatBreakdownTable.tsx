import {
  FormatBreakdown,
  getFormatColor,
  INTENT_COLORS,
  VIBE_COLORS,
} from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { ChevronDown, ChevronUp, ExternalLink, TrendingUp } from "lucide-react";
import InfoPopover from "./InfoPopover";
import { useState, useMemo } from "react";

interface Props {
  formats: FormatBreakdown[];
  expandedFormat: number | null;
  onToggle: (i: number) => void;
  songDuration?: number;
  spikeFormat?: string | null;
  formatSparkScores?: Record<string, number>;
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
  | "spark_score"
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
  { key: "spark_score", label: "Spark" },
  { key: "verdict", label: "Verdict" },
];

export default function FormatBreakdownTable({
  formats,
  expandedFormat,
  onToggle,
  songDuration,
  spikeFormat,
  formatSparkScores,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const hasActualShareRate = formats.some((f) => f.actual_share_rate != null);

  // Spark scores: prefer per-format from the API map, fall back to per-row field
  const getSparkScore = (f: FormatBreakdown): number | null => {
    if (formatSparkScores && f.name in formatSparkScores) {
      return Math.round(formatSparkScores[f.name]);
    }
    return f.spark_score ?? null;
  };
  const hasSparkScore =
    formats.some((f) => f.spark_score != null) ||
    (formatSparkScores != null && Object.keys(formatSparkScores).length > 0);

  const SORT_HEADERS = (() => {
    let headers = [...SORT_HEADERS_BASE];
    if (hasActualShareRate) {
      const erIdx = headers.findIndex((h) => h.key === "share_rate");
      headers.splice(erIdx + 1, 0, {
        key: "actual_share_rate" as SortKey,
        label: "Share Rate",
      });
    }
    if (!hasSparkScore) {
      headers = headers.filter((h) => h.key !== "spark_score");
    }
    return headers;
  })();

  const colCount = SORT_HEADERS.length;
  const gridCols = (() => {
    const base = ["1.8fr", "0.7fr", "0.7fr", "0.8fr", "1fr"];
    if (hasActualShareRate) base.push("0.7fr");
    if (hasSparkScore) base.push("0.6fr");
    base.push("0.7fr", "36px"); // verdict + chevron
    return base.join(" ");
  })();

  const pdfGridCols = (() => {
    const base = ["1.6fr", "0.55fr", "0.55fr", "0.7fr", "1.2fr"];
    if (hasActualShareRate) base.push("0.6fr");
    if (hasSparkScore) base.push("0.5fr");
    base.push("0.7fr");
    return base.join(" ");
  })();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "desc") setSortDir("asc");
      else {
        setSortKey(null);
        setSortDir("desc");
      }
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
        case "spark_score":
          cmp = (getSparkScore(a.f) ?? 0) - (getSparkScore(b.f) ?? 0);
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
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 1,
            background:
              "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
          }}
        />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
          }}
        >
          Format Breakdown
        </span>
        <InfoPopover text="Every video format using your sound, ranked by performance. The verdict tells you what to do: SCALE it, watch it EMERGE, or avoid it if SATURATED. Click a row for deeper analysis." />
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
                letterSpacing: "0.10em",
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
              {hasSparkScore &&
                (() => {
                  const score = getSparkScore(f);
                  return (
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          (score ?? 0) >= 70
                            ? "#30D158"
                            : (score ?? 0) >= 40
                              ? "#FFD60A"
                              : "var(--ink-tertiary)",
                      }}
                    >
                      {score != null ? score : "—"}
                    </span>
                  );
                })()}
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

            {/* Redesigned Drilldown */}
            {isOpen && (
              <FormatDrilldown
                f={f}
                color={color}
                verdict={verdict}
                songDuration={songDuration}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Redesigned Format Drilldown ─── */
function FormatDrilldown({
  f,
  color,
  verdict,
  songDuration,
}: {
  f: FormatBreakdown;
  color: string;
  verdict: string;
  songDuration?: number;
}) {
  const vc = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.EMERGING;

  // Build intent one-liner
  const intentLine = f.top_intents?.length
    ? f.top_intents
        .map((i) => {
          const total = f.top_intents!.reduce((s, x) => s + x.count, 0);
          const pct = total > 0 ? Math.round((i.count / total) * 100) : 0;
          const label =
            i.name === "artist_official"
              ? "Official"
              : i.name.charAt(0).toUpperCase() + i.name.slice(1);
          return `${pct}% ${label}`;
        })
        .join(" · ")
    : null;

  // Compute timestamp range label
  const snippetLabel = f.hooks.snippet
    ? `${f.hooks.snippet_pct}% use ${f.hooks.snippet}`
    : null;

  return (
    <div
      style={{
        padding: "16px 16px 20px",
        background: "var(--overlay-subtle)",
        borderBottom: "1px solid var(--border)",
        animation: "fadeInUp 0.25s ease both",
      }}
    >
      {/* Top line: format summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          color: "var(--ink-secondary)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{f.name}</span>
        <span>·</span>
        <span>{f.video_count} videos</span>
        <span>·</span>
        <span>{f.pct_of_total}% of total</span>
        <span>·</span>
        <span>{formatNumber(f.avg_views)} avg views</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: 99,
            background: vc.bg,
            color: vc.text,
            letterSpacing: "0.3px",
            marginLeft: 4,
          }}
        >
          {verdict}
        </span>
      </div>

      {/* WHO'S MAKING THESE — pills row */}
      {(f.top_niches?.length || f.dominant_vibe || intentLine) && (
        <div style={{ marginBottom: 14 }}>
          <div style={drilldownLabel}>Who's making these</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {/* Niche pills */}
            {f.top_niches?.map((n) => (
              <span key={n.name} style={pillStyle}>
                {n.name}
                <span
                  style={{
                    marginLeft: 3,
                    color: "var(--ink-tertiary)",
                    fontSize: 10,
                  }}
                >
                  {n.count}
                </span>
              </span>
            ))}

            {/* Vibe pill */}
            {f.dominant_vibe && (
              <span
                style={{
                  ...pillStyle,
                  background: `${VIBE_COLORS[f.dominant_vibe] ?? "#636366"}22`,
                  color: VIBE_COLORS[f.dominant_vibe] ?? "#636366",
                }}
              >
                {f.dominant_vibe}
              </span>
            )}
          </div>

          {/* Intent + hook one-liners */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 8,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-tertiary)",
              flexWrap: "wrap",
            }}
          >
            {intentLine && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {f.top_intents!.map((intent) => (
                  <span
                    key={intent.name}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: INTENT_COLORS[intent.name] ?? "#636366",
                      flexShrink: 0,
                    }}
                  />
                ))}
                <span style={{ marginLeft: 2 }}>{intentLine}</span>
              </span>
            )}
            <span>{f.hooks.face_pct}% Face-in-2s</span>
            {snippetLabel && <span>{snippetLabel}</span>}
          </div>
        </div>
      )}

      {/* TIMING — compact bars side by side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* Song timestamp heatmap — thin bar */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <span style={drilldownLabel}>Song Clip Usage</span>
            {f.hooks.snippet && (
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10,
                  color: "var(--ink-faint)",
                }}
              >
                Most used: {f.hooks.snippet}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 1,
              height: 20,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {f.songBars.map((val, i) => {
              const max = Math.max(...f.songBars, 1);
              const opacity = max > 0 ? 0.15 + (val / max) * 0.85 : 0.15;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: color,
                    opacity,
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 2,
            }}
          >
            <span style={tinyLabel}>0:00</span>
            <span style={tinyLabel}>
              {songDuration
                ? `${Math.floor(songDuration / 60)}:${String(songDuration % 60).padStart(2, "0")}`
                : "End"}
            </span>
          </div>
        </div>

        {/* Daily velocity — thin bar */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <span style={drilldownLabel}>Posting Timeline</span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                color: "var(--ink-faint)",
              }}
            >
              {f.daily.length} days
            </span>
          </div>
          <ResponsiveContainer width="100%" height={20}>
            <BarChart
              data={f.daily.map((v, di) => ({
                videos: v,
                day: `Day ${di + 1}`,
              }))}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Bar dataKey="videos" radius={[1, 1, 0, 0]} maxBarSize={8}>
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
              marginTop: 2,
            }}
          >
            <span style={tinyLabel}>Oldest</span>
            <span style={tinyLabel}>Latest</span>
          </div>
        </div>
      </div>

      {/* Per-format Posting Hours — collapsible */}
      {f.posting_hours && f.posting_hours.some((v) => v > 0) && (
        <PostingHoursCollapsible hours={f.posting_hours} color={color} />
      )}

      {/* AI Insight */}
      {f.insight && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: "var(--surface)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-secondary)",
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {f.insight}
        </div>
      )}

      {/* TOP VIDEOS — prominent */}
      {f.topVideos.length > 0 && (
        <div>
          <div style={{ ...drilldownLabel, marginBottom: 8 }}>Top Videos</div>
          {f.topVideos.map((tv, ti) => {
            const cleanHandle = tv.handle.replace(/^@+/, "");
            return (
              <a
                key={ti}
                href={tv.video_url || `https://www.tiktok.com/@${cleanHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "6px 4px",
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
                  (e.currentTarget.style.background = "var(--overlay-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink-secondary)",
                    minWidth: 100,
                  }}
                >
                  @{cleanHandle}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "var(--ink-tertiary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tv.why}
                </span>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
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
                    minWidth: 40,
                    textAlign: "right",
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
  );
}

/* ─── Shared drilldown styles ─── */
const drilldownLabel: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 10,
  fontWeight: 600,
  color: "var(--ink-faint)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 6,
};

const pillStyle: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 11,
  fontWeight: 500,
  padding: "3px 10px",
  borderRadius: 99,
  background: "var(--border-subtle)",
  color: "var(--ink-secondary)",
};

const tinyLabel: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 9,
  color: "var(--ink-faint)",
};

/* ─── Collapsible Posting Hours ─── */
const HOUR_LABELS = [
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

function PostingHoursCollapsible({
  hours,
  color,
}: {
  hours: number[];
  color: string;
}) {
  const [open, setOpen] = useState(false);
  const phMax = Math.max(...hours, 1);
  const phPeak = hours.indexOf(Math.max(...hours));

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 10,
          fontWeight: 600,
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          transition: "color 150ms",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--ink-secondary)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
      >
        <ChevronDown
          size={12}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 200ms",
          }}
        />
        Posting Hours · Peak: {HOUR_LABELS[phPeak]}
      </button>
      {open && (
        <div style={{ marginTop: 6, animation: "fadeInUp 0.2s ease both" }}>
          <ResponsiveContainer width="100%" height={36}>
            <BarChart
              data={hours.map((c, hi) => ({
                count: c,
                hour: HOUR_LABELS[hi],
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
              <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={6}>
                {hours.map((c, hi) => (
                  <Cell
                    key={hi}
                    fill={color}
                    fillOpacity={hi === phPeak ? 1 : 0.2 + (c / phMax) * 0.5}
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
            <span style={tinyLabel}>12am</span>
            <span style={tinyLabel}>12pm</span>
            <span style={tinyLabel}>12am</span>
          </div>
        </div>
      )}
    </div>
  );
}

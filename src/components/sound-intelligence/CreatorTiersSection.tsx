import { CreatorTier, getFormatColor } from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";

interface Props {
  tiers: CreatorTier[];
  expandedTier: number | null;
  onToggle: (i: number) => void;
}

const TIER_COLORS = ["#30D158", "#0A84FF", "#BF5AF2", "#FFD60A"];

export default function CreatorTiersSection({
  tiers,
  expandedTier,
  onToggle,
}: Props) {
  const maxCount = Math.max(...tiers.map((t) => t.count), 1);

  return (
    <div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 12,
        }}
      >
        Creator Tiers
      </div>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          borderTop: "0.5px solid var(--card-edge)",
          overflow: "hidden",
        }}
      >
        {tiers.map((t, i) => {
          const isOpen = expandedTier === i;
          const color = TIER_COLORS[i % TIER_COLORS.length];

          return (
            <div key={t.tier}>
              <button
                onClick={() => onToggle(i)}
                aria-expanded={isOpen}
                aria-label={`${t.tier} tier — ${isOpen ? "collapse" : "expand"} details`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 0.5fr 2fr 0.8fr 36px",
                  gap: 12,
                  width: "100%",
                  padding: "14px 20px",
                  background: isOpen
                    ? "var(--overlay-hover)"
                    : i % 2 === 1
                      ? "var(--overlay-subtle)"
                      : "none",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  alignItems: "center",
                  textAlign: "left",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {t.tier}
                    {t.avg_share_rate ===
                      Math.max(...tiers.map((x) => x.avg_share_rate)) && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 99,
                          background: "rgba(48,209,88,0.15)",
                          color: "#30D158",
                          fontWeight: 600,
                        }}
                      >
                        Top engagement
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    {t.range}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  {t.count}
                </span>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      width: `${(t.count / maxCount) * 100}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: color,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  {formatNumber(t.avg_views)}
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
                    {/* Adoption Timeline */}
                    <div
                      style={{
                        background: "var(--surface)",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--ink-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 10,
                        }}
                      >
                        Adoption Timeline
                      </div>
                      <div
                        style={{ display: "flex", gap: 16, marginBottom: 10 }}
                      >
                        {[
                          { label: "First Post", value: t.firstPostDay },
                          { label: "Peak", value: t.peakDay },
                          { label: "Days Active", value: String(t.daysActive) },
                        ].map((s) => (
                          <div key={s.label}>
                            <div
                              style={{
                                fontSize: 14,
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
                      <ResponsiveContainer width="100%" height={48}>
                        <BarChart data={t.daily.map((v, di) => ({ v, i: di }))}>
                          <Bar
                            dataKey="v"
                            radius={[2, 2, 0, 0]}
                            fill={color}
                            fillOpacity={0.6}
                            maxBarSize={10}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Preferred Formats */}
                    <div
                      style={{
                        background: "var(--surface)",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--ink-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 10,
                        }}
                      >
                        Preferred Formats
                      </div>
                      <div
                        style={{ display: "flex", gap: 12, marginBottom: 10 }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {t.avg_share_rate}%
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            Avg Engagement
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {formatNumber(t.avg_views)}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            Avg Views
                          </div>
                        </div>
                      </div>
                      {t.topFormats.map((tf, fi) => (
                        <div
                          key={tf.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              color: "var(--ink-secondary)",
                              minWidth: 100,
                            }}
                          >
                            {tf.name}
                          </span>
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
                                width: `${tf.pct}%`,
                                height: "100%",
                                borderRadius: 3,
                                background: getFormatColor(tf.name, fi),
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--ink-tertiary)",
                              minWidth: 30,
                              textAlign: "right",
                            }}
                          >
                            {tf.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insight */}
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        color: "var(--ink-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {t.insight}
                    </div>
                  </div>

                  {/* Top Creators */}
                  {t.topCreators.length > 0 && (
                    <div
                      style={{
                        background: "var(--surface)",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--ink-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 10,
                        }}
                      >
                        Top Creators
                      </div>
                      {t.topCreators.map((c, ci) => (
                        <div
                          key={ci}
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            padding: "6px 0",
                            borderBottom:
                              ci < t.topCreators.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--ink)",
                            }}
                          >
                            @{c.handle.replace(/^@+/, "")}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--ink-tertiary)",
                              flex: 1,
                            }}
                          >
                            {c.followers} followers
                          </span>
                          <span style={{ fontSize: 12, color: "var(--ink)" }}>
                            {c.views} views
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            {c.share} engagement
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

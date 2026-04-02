import { GeoBreakdown, getFormatColor } from "@/types/soundIntelligence";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";
import InfoPopover from "./InfoPopover";

interface Props {
  geography: GeoBreakdown[];
  expandedGeo: number | null;
  onToggle: (i: number) => void;
}

export default function GeoSpreadSection({
  geography,
  expandedGeo,
  onToggle,
}: Props) {
  const maxPct = Math.max(...geography.map((g) => g.pct), 1);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
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
          Geographic Spread
        </span>
        <InfoPopover text="Which countries are using your sound the most. Helps you understand if it's a global hit or popular in specific regions. Click a country for more details." />
      </div>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          borderTop: "0.5px solid var(--card-edge)",
          overflow: "hidden",
        }}
      >
        {geography.map((g, i) => {
          const isOpen = expandedGeo === i;

          return (
            <div key={g.country}>
              <button
                onClick={() => onToggle(i)}
                aria-expanded={isOpen}
                aria-label={`${g.country} — ${isOpen ? "collapse" : "expand"} details`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1.2fr 2fr 0.5fr 36px",
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
                <span style={{ fontSize: 20 }}>{g.flag}</span>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {g.country}
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
                      width: `${(g.pct / maxPct) * 100}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: "#0A84FF",
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
                  {g.pct}%
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
                          { label: "First Post", value: g.firstPostDay },
                          { label: "Peak", value: g.peakDay },
                          { label: "Days Active", value: String(g.daysActive) },
                          { label: "Avg Views", value: g.avgViews },
                        ].map((s) => (
                          <div key={s.label}>
                            <div
                              style={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: "-0.03em",
                                color: "var(--ink)",
                              }}
                            >
                              {s.value}
                            </div>
                            <div
                              style={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 10,
                                letterSpacing: "0.10em",
                                color: "var(--ink-tertiary)",
                              }}
                            >
                              {s.label}
                            </div>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={48}>
                        <BarChart data={g.daily.map((v, di) => ({ v, i: di }))}>
                          <Bar
                            dataKey="v"
                            radius={[2, 2, 0, 0]}
                            fill="#0A84FF"
                            fillOpacity={0.6}
                            maxBarSize={10}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Format Preferences */}
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
                        Format Preferences
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-tertiary)",
                          marginBottom: 10,
                        }}
                      >
                        Avg Engagement: {g.avgShare}
                      </div>
                      {g.topFormats.map((tf, fi) => (
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
                      {g.insight}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

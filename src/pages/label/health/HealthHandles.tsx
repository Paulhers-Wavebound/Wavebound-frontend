import { useHealthData } from "./HealthLayout";
import { PLATFORM_COLORS } from "@/components/admin/health/constants";
import { relativeTime, formatNumber } from "@/components/admin/health/helpers";
import type {
  HandleHealthData,
  HandleHealthPlatform,
} from "@/components/admin/health/types";

const STATUS_COLORS: Record<string, string> = {
  alive: "#34d399",
  dead: "#ef4444",
  stale: "#f59e0b",
  changed: "#3b82f6",
  unknown: "#6b7280",
};

function StatusBar({ platform }: { platform: HandleHealthPlatform }) {
  const total = platform.total || 1;
  const segments = [
    { key: "alive", count: platform.alive, color: STATUS_COLORS.alive },
    { key: "dead", count: platform.dead, color: STATUS_COLORS.dead },
    { key: "stale", count: platform.stale, color: STATUS_COLORS.stale },
    { key: "changed", count: platform.changed, color: STATUS_COLORS.changed },
    {
      key: "unknown",
      count: platform.unknown_ct,
      color: STATUS_COLORS.unknown,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 4,
        }}
      >
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <div
                key={seg.key}
                title={`${seg.key}: ${seg.count}`}
                style={{
                  width: `${(seg.count / total) * 100}%`,
                  background: seg.color,
                  minWidth: seg.count > 0 ? 2 : 0,
                }}
              />
            ),
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          fontSize: 10,
          fontFamily: '"JetBrains Mono", monospace',
          color: "var(--ink-faint)",
        }}
      >
        {segments
          .filter((s) => s.count > 0)
          .map((seg) => (
            <span
              key={seg.key}
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2,
                  background: seg.color,
                }}
              />
              {seg.count}
            </span>
          ))}
      </div>
    </div>
  );
}

export default function HealthHandles() {
  const { data } = useHealthData();

  // Handle health may be null if RPC not yet deployed
  const hh: HandleHealthData | null = data?.handle_health ?? null;

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        Handle Health
      </h2>

      {!hh ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: 24,
            textAlign: "center",
            color: "var(--ink-faint)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
          }}
        >
          Handle health data not available yet — RPC may not be deployed
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                label: "Total handles",
                value: hh.total_handles,
                color: "var(--ink)",
              },
              {
                label: "Alive",
                value: hh.by_status?.alive || 0,
                color: "#34d399",
              },
              {
                label: "Dead",
                value: hh.by_status?.dead || 0,
                color:
                  (hh.by_status?.dead || 0) > 0
                    ? "#ef4444"
                    : "var(--ink-faint)",
              },
              {
                label: "Stale",
                value: hh.by_status?.stale || 0,
                color:
                  (hh.by_status?.stale || 0) > 0
                    ? "#f59e0b"
                    : "var(--ink-faint)",
              },
              {
                label: "Changed",
                value: hh.by_status?.changed || 0,
                color:
                  (hh.by_status?.changed || 0) > 0
                    ? "#3b82f6"
                    : "var(--ink-faint)",
              },
              {
                label: "Never checked",
                value: hh.never_checked,
                color: hh.never_checked > 0 ? "#9ca3af" : "var(--ink-faint)",
              },
              {
                label: "Stale > 7d",
                value: hh.stale_over_7d,
                color: hh.stale_over_7d > 0 ? "#f59e0b" : "var(--ink-faint)",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "var(--surface)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  padding: "10px 14px",
                  minWidth: 90,
                }}
              >
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 2,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 18,
                    fontWeight: 700,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {formatNumber(s.value)}
                </div>
              </div>
            ))}
          </div>

          {/* By platform breakdown */}
          {hh.by_platform && hh.by_platform.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px 10px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ink-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  By platform
                </span>
              </div>
              {hh.by_platform.map((p) => (
                <div
                  key={p.platform}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: PLATFORM_COLORS[p.platform] || "#9ca3af",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink)",
                        textTransform: "capitalize",
                      }}
                    >
                      {p.platform}
                    </span>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: "var(--ink-faint)",
                        marginLeft: "auto",
                      }}
                    >
                      {formatNumber(p.total)} handles
                    </span>
                  </div>
                  <StatusBar platform={p} />
                </div>
              ))}
            </div>
          )}

          {/* Recent deaths */}
          {hh.recent_deaths && hh.recent_deaths.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px 10px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#ef4444",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Dead handles (7d)
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  {hh.recent_deaths.length}
                </span>
              </div>
              {hh.recent_deaths.map((d, i) => (
                <div
                  key={`${d.entity_id}-${d.platform}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ef4444",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {d.artist_name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: "var(--ink-faint)",
                        display: "flex",
                        gap: 8,
                        marginTop: 2,
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        {d.platform}
                      </span>
                      <span style={{ color: "var(--ink-secondary)" }}>
                        @{d.platform_id}
                      </span>
                      <span>{d.consecutive_failures} failures</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      flexShrink: 0,
                    }}
                  >
                    {relativeTime(d.last_checked_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recent handle changes */}
          {hh.recent_changes && hh.recent_changes.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px 10px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#3b82f6",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Handle changes (30d)
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  {hh.recent_changes.length}
                </span>
              </div>
              {hh.recent_changes.map((c, i) => (
                <div
                  key={`${c.entity_id}-${c.platform}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {c.artist_name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: "var(--ink-faint)",
                        marginTop: 2,
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        {c.platform}
                      </span>{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          textDecoration: "line-through",
                        }}
                      >
                        @{c.old_handle}
                      </span>{" "}
                      →{" "}
                      <span style={{ color: "#34d399" }}>@{c.new_handle}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      flexShrink: 0,
                    }}
                  >
                    {relativeTime(c.changed_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

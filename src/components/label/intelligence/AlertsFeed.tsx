import type { AlertsResponse, AlertEntry } from "@/types/artistIntelligence";
import { SEVERITY_CONFIG, ALERT_TYPE_ICONS } from "@/types/artistIntelligence";
import InfoTooltip from "./InfoTooltip";

/** Extract context chips from alert.data based on alert_type */
function getAlertContext(alert: AlertEntry): string[] {
  const d = alert.data;
  if (!d || typeof d !== "object") return [];
  const chips: string[] = [];

  if (alert.alert_type === "playlist_add") {
    if (d.playlist_count) chips.push(`${d.playlist_count} playlists`);
    if (d.total_reach) chips.push(`${fmtK(d.total_reach as number)} reach`);
    if (d.reach_tier) chips.push(String(d.reach_tier));
  } else if (alert.alert_type === "song_momentum") {
    if (d.velocity_class) chips.push(String(d.velocity_class));
    if (d.rank_by_streams) chips.push(`#${d.rank_by_streams} by streams`);
  } else if (alert.alert_type === "geographic") {
    if (d.country_code) chips.push(String(d.country_code));
    if (d.market_strength) chips.push(String(d.market_strength));
    if (d.position_change)
      chips.push(`pos ${d.position_change > 0 ? "+" : ""}${d.position_change}`);
  } else if (alert.alert_type === "metric_spike") {
    if (d.metric) chips.push(String(d.metric).replace(/_/g, " "));
    if (d.magnitude) chips.push(`${d.magnitude}x`);
  } else if (alert.alert_type === "cross_platform_breakout") {
    if (d.platforms_growing) chips.push(`${d.platforms_growing} platforms`);
  } else if (alert.alert_type === "fan_sentiment") {
    if (d.audience_vibe) chips.push(String(d.audience_vibe));
  }

  return chips;
}

function fmtK(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

export default function AlertsFeed({
  alerts,
}: {
  alerts: AlertsResponse | null;
}) {
  if (!alerts || alerts.alerts.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-sm)",
          padding: "40px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
          }}
        >
          No alerts yet — check back once 7+ days of data accumulates
        </div>
      </div>
    );
  }

  const summary = alerts.summary;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 24,
      }}
    >
      {/* Header with summary counts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Alerts{" "}
          <InfoTooltip text="Auto-generated alerts based on song momentum, playlist adds, cross-platform breakouts, metric spikes, geographic shifts, fan sentiment changes, and catalog status. Sorted by priority. Green = wins, amber = watch, blue = FYI." />
        </h3>
        <div style={{ display: "flex", gap: 12 }}>
          {summary.celebrations > 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: SEVERITY_CONFIG.celebration.color,
              }}
            >
              {summary.celebrations} wins
            </span>
          )}
          {summary.warnings > 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: SEVERITY_CONFIG.warning.color,
              }}
            >
              {summary.warnings} warnings
            </span>
          )}
          {summary.infos > 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: SEVERITY_CONFIG.info.color,
              }}
            >
              {summary.infos} info
            </span>
          )}
        </div>
      </div>

      {/* Alert items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.alerts.map((alert, i) => {
          const sev = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
          const icon = ALERT_TYPE_ICONS[alert.alert_type] ?? "\u2139\uFE0F";
          const chips = getAlertContext(alert);

          return (
            <div
              key={`${alert.alert_type}-${alert.date}-${i}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                background: sev.bg,
                border: `1px solid ${sev.border}`,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                {icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    lineHeight: 1.4,
                  }}
                >
                  {alert.title}
                </div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "var(--ink-secondary)",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {alert.detail}
                </div>
                {chips.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 6,
                    }}
                  >
                    {chips.map((chip) => (
                      <span
                        key={chip}
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.06)",
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "var(--ink-tertiary)",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {alert.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

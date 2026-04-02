import { SoundAnalysis, SoundMonitoring } from "@/types/soundIntelligence";
import { timeAgo } from "@/utils/soundIntelligenceApi";
import { Calendar, BarChart3, Clock, Music, RefreshCw } from "lucide-react";
import MonitoringBadge from "./MonitoringBadge";

interface SoundHeaderProps {
  analysis: SoundAnalysis;
  monitoring?: SoundMonitoring | null;
}

const statusConfig = {
  accelerating: {
    label: "Accelerating",
    bg: "rgba(48,209,88,0.12)",
    color: "#30D158",
  },
  active: { label: "Active", bg: "rgba(255,214,10,0.12)", color: "#FFD60A" },
  declining: {
    label: "Declining",
    bg: "rgba(255,69,58,0.12)",
    color: "#FF453A",
  },
};

export default function SoundHeader({
  analysis,
  monitoring,
}: SoundHeaderProps) {
  const status =
    statusConfig[analysis.status as keyof typeof statusConfig] ??
    statusConfig.active;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: "24px 28px",
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Cover art */}
          {analysis.cover_url ? (
            <img
              src={analysis.cover_url}
              alt={analysis.track_name}
              crossOrigin="anonymous"
              style={{
                width: 56,
                height: 56,
                borderRadius: 10,
                objectFit: "cover",
                flexShrink: 0,
                background: "var(--border-subtle)",
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 10,
                flexShrink: 0,
                background: "var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Music size={24} color="var(--ink-tertiary)" />
            </div>
          )}

          <div>
            <h1
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {analysis.track_name}
            </h1>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 17,
                color: "var(--ink-secondary)",
                margin: "6px 0 0",
              }}
            >
              {analysis.artist_name} · {analysis.album_name}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <MonitoringBadge monitoring={monitoring ?? null} size="md" />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 10px",
              borderRadius: 100,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase" as const,
              letterSpacing: "0.10em",
              background: status.bg,
              color: status.color,
              flexShrink: 0,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Fallback monitoring info when paused (chart won't render) */}
      {monitoring &&
        monitoring.monitoring_interval === "paused" &&
        monitoring.last_monitored_at && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-faint)",
            }}
          >
            Monitoring paused · Last checked{" "}
            {timeAgo(monitoring.last_monitored_at)}
          </div>
        )}

      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 16,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          color: "var(--ink-tertiary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar size={13} /> Created {analysis.created_at}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <BarChart3 size={13} /> {analysis.videos_analyzed.toLocaleString()}{" "}
          videos analyzed
        </span>
        {analysis.last_refresh_at ? (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} /> Last refreshed{" "}
              {timeAgo(analysis.last_refresh_at)}
            </span>
            {(analysis.refresh_count ?? 0) > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {analysis.refresh_count}{" "}
                {analysis.refresh_count === 1 ? "refresh" : "refreshes"}
              </span>
            )}
          </>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={13} /> Last scan {analysis.last_scan ?? "N/A"}
          </span>
        )}
      </div>
    </div>
  );
}

import { SoundMonitoring, getFormatColor } from "@/types/soundIntelligence";

interface MonitoringBadgeProps {
  monitoring: SoundMonitoring | null;
  size?: "sm" | "md";
}

export default function MonitoringBadge({
  monitoring,
  size = "sm",
}: MonitoringBadgeProps) {
  if (!monitoring || monitoring.monitoring_interval === "paused") return null;

  const isIntensive = monitoring.monitoring_interval === "intensive";
  const dotSize = size === "sm" ? 6 : 8;
  const fontSize = size === "sm" ? 11 : 12;
  const padding = size === "sm" ? "3px 8px" : "4px 10px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding,
        borderRadius: 100,
        fontSize,
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 600,
        background: isIntensive
          ? "rgba(255,69,58,0.12)"
          : "rgba(48,209,88,0.12)",
        color: isIntensive ? "#FF453A" : "#30D158",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: isIntensive ? "#FF453A" : "#30D158",
          flexShrink: 0,
          animation: isIntensive
            ? "monitorPulse 1.5s ease-in-out infinite"
            : undefined,
        }}
      />
      {isIntensive ? "Spiking" : "Monitoring"}
      {isIntensive && monitoring.spike_format && (
        <span
          style={{
            color: getFormatColor(monitoring.spike_format),
            fontWeight: 500,
          }}
        >
          — {monitoring.spike_format}
        </span>
      )}
      <style>{`
        @keyframes monitorPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </span>
  );
}

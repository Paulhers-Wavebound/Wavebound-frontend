import { SoundAlert } from "@/types/soundIntelligence";
import { timeAgo, markAlertRead } from "@/utils/soundIntelligenceApi";
import { useNavigate } from "react-router-dom";
import { Music, X } from "lucide-react";

const SEVERITY_BORDER: Record<string, string> = {
  info: "#0A84FF",
  warning: "#e8430a",
  celebration: "#30D158",
};

interface SoundAlertPanelProps {
  alerts: SoundAlert[];
  onClose: () => void;
  onMarkRead: (alertId: string) => void;
  onMarkAllRead: () => void;
}

export default function SoundAlertPanel({
  alerts,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: SoundAlertPanelProps) {
  const navigate = useNavigate();

  const handleClick = async (alert: SoundAlert) => {
    if (!alert.is_read) {
      onMarkRead(alert.id);
      markAlertRead(alert.id);
    }
    onClose();
    navigate(`/label/sound-intelligence/${alert.job_id}`);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 8,
        width: 380,
        maxHeight: 480,
        background: "var(--L1, #1C1C1E)",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Alerts
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
          }}
        >
          <X size={16} color="var(--ink-tertiary)" />
        </button>
      </div>

      {/* Alert list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {alerts.length === 0 && (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-tertiary)",
            }}
          >
            No alerts yet
          </div>
        )}
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => handleClick(alert)}
            style={{
              display: "flex",
              gap: 10,
              padding: "12px 16px",
              width: "100%",
              background: alert.is_read
                ? "transparent"
                : "rgba(255,255,255,0.03)",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              borderLeft: `3px solid ${SEVERITY_BORDER[alert.severity] || SEVERITY_BORDER.info}`,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 150ms",
            }}
          >
            {alert.cover_url ? (
              <img
                src={alert.cover_url}
                alt=""
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  objectFit: "cover",
                  flexShrink: 0,
                  background: "var(--border-subtle)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: "var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Music size={14} color="var(--ink-tertiary)" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: alert.is_read ? "var(--ink-secondary)" : "var(--ink)",
                  marginBottom: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.title}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-tertiary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.message}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  marginTop: 3,
                }}
              >
                {alert.track_name} · {timeAgo(alert.created_at)}
              </div>
            </div>
            {!alert.is_read && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#e8430a",
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      {alerts.some((a) => !a.is_read) && (
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={onMarkAllRead}
            style={{
              width: "100%",
              padding: "6px 0",
              background: "none",
              border: "none",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent)",
              cursor: "pointer",
            }}
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}

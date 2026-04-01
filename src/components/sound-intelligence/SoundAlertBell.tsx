import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import { SoundAlert } from "@/types/soundIntelligence";
import { getSoundAlerts, markAlertRead } from "@/utils/soundIntelligenceApi";
import SoundAlertPanel from "./SoundAlertPanel";

interface SoundAlertBellProps {
  labelId: string;
}

export default function SoundAlertBell({ labelId }: SoundAlertBellProps) {
  const [alerts, setAlerts] = useState<SoundAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getSoundAlerts(labelId, { limit: 20 });
      setAlerts(data.alerts);
      setUnreadCount(data.unread_count);
    } catch {
      // Silently fail — alerts are non-critical
    }
  }, [labelId]);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    setUnreadCount(0);
    for (const a of unread) {
      markAlertRead(a.id);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Alerts${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: open ? "var(--overlay-hover)" : "transparent",
          cursor: "pointer",
          transition: "background 150ms",
        }}
      >
        <Bell size={16} color="var(--ink-secondary)" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "#FF453A",
              color: "#fff",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <SoundAlertPanel
          alerts={alerts}
          onClose={() => setOpen(false)}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </div>
  );
}

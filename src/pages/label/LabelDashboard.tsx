import { useCallback, useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import MarketingDashboard from "@/components/label/marketing/MarketingDashboard";
import ContentSocialDashboard from "@/components/label/content-social/ContentSocialDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useDashboardRole } from "@/contexts/DashboardRoleContext";
import RoleSelector from "@/components/label/RoleSelector";
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Flame,
  Clock,
  X,
} from "lucide-react";

interface Notification {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  avatarUrl: string | null;
  title: string;
  body: string;
  time: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "wasted-spend",
    icon: AlertTriangle,
    iconColor: "#FF453A",
    iconBg: "rgba(255,69,58,0.12)",
    avatarUrl: null,
    title: "$175K Wasted Spend Detected",
    body: "84% of budget on US markets. 3 high-ROI markets at $0 spend.",
    time: "12m ago",
  },
  {
    id: "tyla-window",
    icon: Clock,
    iconColor: "#FF9F0A",
    iconBg: "rgba(255,159,10,0.12)",
    avatarUrl: null,
    title: "Window Closing — Tyla (India)",
    body: "~9 days left. TikTok India #11, $0 current spend. 4.8x ROI opportunity.",
    time: "1h ago",
  },
  {
    id: "lil-nas-window",
    icon: Clock,
    iconColor: "#FFD60A",
    iconBg: "rgba(255,214,10,0.12)",
    avatarUrl: null,
    title: "Window Closing — Lil Nas X (Philippines)",
    body: "~8 days left. TikTok Philippines #8, $0 spend. 5.4x ROI vs US.",
    time: "2h ago",
  },
  {
    id: "ice-spice-decline",
    icon: TrendingDown,
    iconColor: "#FF453A",
    iconBg: "rgba(255,69,58,0.12)",
    avatarUrl: null,
    title: "Ice Spice — Momentum Declining",
    body: "Down to 35. TikTok US #88 (-24). $35K/month at 0.6x ROI.",
    time: "3h ago",
  },
];

const ANOMALY_ICON_MAP: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  views_spike: {
    icon: TrendingUp,
    color: "#30D158",
    bg: "rgba(48,209,88,0.12)",
  },
  views_drop: {
    icon: TrendingDown,
    color: "#FF453A",
    bg: "rgba(255,69,58,0.12)",
  },
  engagement_spike: {
    icon: Flame,
    color: "#FF9F0A",
    bg: "rgba(255,159,10,0.12)",
  },
  engagement_drop: {
    icon: TrendingDown,
    color: "#FF9F0A",
    bg: "rgba(255,159,10,0.12)",
  },
  posting_drought: {
    icon: Clock,
    color: "#FF453A",
    bg: "rgba(255,69,58,0.12)",
  },
  posting_burst: {
    icon: TrendingUp,
    color: "#30D158",
    bg: "rgba(48,209,88,0.12)",
  },
};

const DEFAULT_ANOMALY_ICON = {
  icon: AlertTriangle,
  color: "#FFD60A",
  bg: "rgba(255,214,10,0.12)",
};

function useContentNotifications() {
  const { labelId } = useUserProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchAnomalies = useCallback(async () => {
    if (!labelId) return;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [anomalyRes, rosterRes] = await Promise.all([
      supabase
        .from("content_anomalies" as any)
        .select("*")
        .eq("label_id", labelId)
        .eq("seen", false)
        .gte("scan_date", threeDaysAgo)
        .order("scan_date", { ascending: false })
        .limit(10),
      supabase
        .from("roster_dashboard_metrics")
        .select("artist_handle, artist_name, avatar_url")
        .eq("label_id", labelId),
    ]);

    const data = anomalyRes.data;
    if (!data || data.length === 0) {
      setNotifications([]);
      return;
    }

    // Build handle→name+avatar lookup
    const nameMap = new Map<string, { name: string; avatar: string | null }>();
    for (const r of (rosterRes.data as any[]) || []) {
      const h = (r.artist_handle || "").trim().toLowerCase().replace(/^@+/, "");
      if (r.artist_name)
        nameMap.set(h, { name: r.artist_name, avatar: r.avatar_url || null });
    }

    const mapped: Notification[] = (data as any[]).map((a) => {
      const style = ANOMALY_ICON_MAP[a.anomaly_type] || DEFAULT_ANOMALY_ICON;
      const hoursAgo = Math.round(
        (Date.now() - new Date(a.created_at || a.scan_date).getTime()) /
          3_600_000,
      );
      const timeStr =
        hoursAgo < 1
          ? "just now"
          : hoursAgo < 24
            ? `${hoursAgo}h ago`
            : `${Math.round(hoursAgo / 24)}d ago`;

      const handle = (a.artist_handle || "")
        .trim()
        .toLowerCase()
        .replace(/^@+/, "");
      const roster = nameMap.get(handle);
      const displayName = roster?.name || a.artist_handle;

      return {
        id: String(a.id),
        icon: style.icon,
        iconColor: style.color,
        iconBg: style.bg,
        avatarUrl: roster?.avatar || null,
        title: `${displayName} — ${(a.anomaly_type || "").replace(/_/g, " ")}`,
        body: a.insight_message || "",
        time: timeStr,
      };
    });

    setNotifications(mapped);
  }, [labelId]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  return notifications;
}

function NotificationBell() {
  const { role } = useDashboardRole();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const contentNotifications = useContentNotifications();

  const allNotifications =
    role === "content" ? contentNotifications : MOCK_NOTIFICATIONS;
  const visible = allNotifications.filter((n) => !dismissed.has(n.id));
  const count = visible.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] hover:border-white/12 transition-colors"
        style={{ background: "#2C2C2E" }}
      >
        <Bell size={16} className="text-white/60" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#e8430a] text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-[360px] rounded-xl border border-white/[0.06] shadow-2xl overflow-hidden"
            style={{ background: "#1C1C1E" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Notifications
              </span>
              {count > 0 && (
                <button
                  onClick={() =>
                    setDismissed(new Set(allNotifications.map((n) => n.id)))
                  }
                  className="text-[11px] text-white/30 hover:text-white/55 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {visible.length === 0 ? (
                <div className="py-10 text-center text-sm text-white/30">
                  All clear
                </div>
              ) : (
                visible.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {n.avatarUrl ? (
                      <div
                        className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5"
                        style={{ border: `2px solid ${n.iconColor}40` }}
                      >
                        <img
                          src={n.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: n.iconBg }}
                      >
                        <n.icon size={13} style={{ color: n.iconColor }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white/87 leading-tight">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-white/45 leading-snug mt-0.5">
                        {n.body}
                      </p>
                      <span className="text-[10px] text-white/25 mt-1 block">
                        {n.time}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissed((prev) => new Set([...prev, n.id]));
                      }}
                      className="text-white/20 hover:text-white/50 transition-colors shrink-0 mt-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function LabelDashboard() {
  const { role } = useDashboardRole();

  return (
    <>
      <SEOHead
        title="Dashboard — Wavebound Label"
        description="Your artist roster dashboard"
      />

      {/* Role selector + notifications pinned top-right */}
      <div className="flex items-center justify-end gap-2 px-6 md:px-8 lg:px-10 pt-5 pb-0">
        <RoleSelector />
        <NotificationBell />
      </div>

      {/* Render the active role view */}
      {role === "marketing" ? (
        <MarketingDashboard />
      ) : (
        <ContentSocialDashboard />
      )}
    </>
  );
}

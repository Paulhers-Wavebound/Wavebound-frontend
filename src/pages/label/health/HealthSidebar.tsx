import { NavLink, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Server,
  Bot,
  Clock,
  Gauge,
  Database,
  Workflow,
  Fingerprint,
  ScrollText,
  RefreshCw,
  Activity,
  AlertTriangle,
  Timer,
  Link2,
  Zap,
  HardDrive,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      {
        path: "/label/admin/health",
        label: "Overview",
        icon: LayoutDashboard,
        end: true,
      },
      {
        path: "/label/admin/health/activity",
        label: "Live Activity",
        icon: Activity,
      },
    ],
  },
  {
    label: "Monitoring",
    items: [
      {
        path: "/label/admin/health/scrapers",
        label: "Scrapers",
        icon: Bot,
      },
      {
        path: "/label/admin/health/errors",
        label: "Error Trends",
        icon: AlertTriangle,
      },
      {
        path: "/label/admin/health/performance",
        label: "Performance",
        icon: Timer,
      },
      {
        path: "/label/admin/health/cron",
        label: "Cron Jobs",
        icon: Clock,
      },
      {
        path: "/label/admin/health/inventory",
        label: "Inventory",
        icon: ScrollText,
      },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      {
        path: "/label/admin/health/servers",
        label: "Servers",
        icon: Server,
      },
      {
        path: "/label/admin/health/n8n",
        label: "n8n Workflows",
        icon: Zap,
      },
      {
        path: "/label/admin/health/pipeline",
        label: "Pipeline",
        icon: Workflow,
      },
      {
        path: "/label/admin/health/quotas",
        label: "API Quotas",
        icon: Gauge,
      },
      {
        path: "/label/admin/health/database",
        label: "Database",
        icon: HardDrive,
      },
    ],
  },
  {
    label: "Data Quality",
    items: [
      {
        path: "/label/admin/health/data",
        label: "Data",
        icon: Database,
      },
      {
        path: "/label/admin/health/identity",
        label: "Identity",
        icon: Fingerprint,
      },
      {
        path: "/label/admin/health/handles",
        label: "Handle Health",
        icon: Link2,
      },
    ],
  },
];

// Flat list for mobile
const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

interface HealthSidebarProps {
  overallHealth?: "green" | "yellow" | "red";
  secondsAgo: number;
  onRefresh: () => void;
  isMobile: boolean;
}

const healthColors = {
  green: "#34d399",
  yellow: "#f59e0b",
  red: "#ef4444",
};

export default function HealthSidebar({
  overallHealth,
  secondsAgo,
  onRefresh,
  isMobile,
}: HealthSidebarProps) {
  const location = useLocation();

  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "8px 16px",
          overflowX: "auto",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {ALL_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#e8430a" : "var(--ink-tertiary)",
              background: isActive ? "rgba(232, 67, 10, 0.08)" : "transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            })}
          >
            <item.icon size={14} />
            {item.label}
          </NavLink>
        ))}
      </div>
    );
  }

  // Check if any item in a group is active (for highlighting group label)
  function groupHasActive(group: NavGroup): boolean {
    return group.items.some((item) => {
      if (item.end) return location.pathname === item.path;
      return location.pathname.startsWith(item.path);
    });
  }

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {overallHealth && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: healthColors[overallHealth],
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            Ops Control
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: "var(--ink-faint)",
            }}
          >
            {secondsAgo}s ago
          </span>
          <button
            onClick={onRefresh}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink-tertiary)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: '"DM Sans", sans-serif',
              transition: "all 150ms",
            }}
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Grouped nav */}
      <nav
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label || "__top"}>
            {group.label && (
              <div
                style={{
                  padding: "10px 12px 4px",
                  fontSize: 9,
                  fontWeight: 700,
                  color: groupHasActive(group)
                    ? "rgba(232, 67, 10, 0.6)"
                    : "var(--ink-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#e8430a" : "var(--ink-secondary)",
                  background: isActive
                    ? "rgba(232, 67, 10, 0.08)"
                    : "transparent",
                  transition: "all 120ms",
                })}
              >
                <item.icon
                  size={15}
                  strokeWidth={1.8}
                  style={{ flexShrink: 0 }}
                />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}

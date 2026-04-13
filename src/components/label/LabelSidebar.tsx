import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Settings,
  LogOut,
  X,
  Moon,
  Sun,
  Music,
  Megaphone,
  Shield,
  ChevronsUpDown,
  Check,
  Sparkles,
  Radar,
  Brain,
  HeartPulse,
  Globe,
  Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useDashboardRole } from "@/contexts/DashboardRoleContext";
import waveboundLogo from "@/assets/wavebound-logo.png";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { PREVIEW_FEATURES } from "@/config/previewFeatures";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface LabelSidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  dark?: boolean;
  onToggleTheme?: () => void;
}

const FEATURE_TO_NAV: Record<string, string> = {
  "sound-intelligence": "sound-intelligence",
  "paid-amplification": "amplification",
  "expansion-radar": "expansion-radar",
  "fan-briefs": "fan-briefs",
  intelligence: "intelligence",
};

const getMainNav = (isAdmin: boolean, labelId: string | null) => {
  const previewList = labelId ? (PREVIEW_FEATURES[labelId] ?? []) : [];
  const previewNavIds = new Set(
    previewList.map((f) => FEATURE_TO_NAV[f]).filter(Boolean),
  );
  const showAmplification =
    isAdmin || previewList.includes("paid-amplification");
  const showIntelligence = isAdmin || !previewList.includes("intelligence");

  const tag = (id: string) =>
    previewNavIds.has(id) ? { isPreview: true as const } : {};

  return [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/label",
    },
    ...(showIntelligence
      ? [
          {
            id: "intelligence",
            label: "Intelligence",
            icon: Brain,
            path: "/label/assistant",
            isNew: true as const,
          },
        ]
      : []),
    {
      id: "sound-intelligence",
      label: "Sound Intelligence",
      icon: Music,
      path: "/label/sound-intelligence",
      ...tag("sound-intelligence"),
    },
    ...(showAmplification
      ? [
          {
            id: "amplification",
            label: "Paid Amplification",
            icon: Megaphone,
            path: "/label/amplification",
            ...tag("amplification"),
          },
        ]
      : []),
    {
      id: "expansion-radar",
      label: "Expansion Radar",
      icon: Radar,
      path: "/label/expansion-radar",
      isNew: true,
      badgeLabel: "V2",
      ...tag("expansion-radar"),
    },
    {
      id: "database",
      label: "The Vault",
      icon: Database,
      path: "/label/database",
      isNew: true as const,
    },
    {
      id: "fan-briefs",
      label: "Fan Briefs",
      icon: Sparkles,
      path: "/label/fan-briefs",
      ...tag("fan-briefs"),
    },
    ...(isAdmin
      ? [
          {
            id: "the-pulse",
            label: "The Pulse",
            icon: Globe,
            path: "/label/admin/pulse",
            isNew: true as const,
          },
        ]
      : []),
  ];
};

const bottomNav = [
  { id: "help", label: "Help", icon: HelpCircle, path: "/label/help" },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/label/settings",
  },
];

interface LabelOption {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
}

let cachedAllLabels: LabelOption[] | null = null;

export default function LabelSidebar({
  onClose,
  collapsed = false,
  dark = false,
  onToggleTheme,
}: LabelSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { labelName, labelLogoUrl, labelId, labelOverride, setLabelOverride } =
    useUserProfile();
  const { isAdmin } = useAdminRole();
  const { roleLabel } = useDashboardRole();
  const mainNav = getMainNav(isAdmin, labelId);

  // Admin label switcher
  const [allLabels, setAllLabels] = useState<LabelOption[]>(
    cachedAllLabels ?? [],
  );
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    if (cachedAllLabels) return;
    (async () => {
      const { data, error } = await supabase
        .from("labels")
        .select("id, name, slug, logo_url")
        .order("name");
      if (error) return;
      if (data) {
        cachedAllLabels = data;
        setAllLabels(data);
      }
    })();
  }, [isAdmin]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!switcherOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(e.target as Node)
      )
        setSwitcherOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [switcherOpen]);

  const displayName = labelName || "Label Portal";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleNav = (item: (typeof mainNav)[0]) => {
    if (item.path) {
      navigate(item.path);
      onClose?.();
    }
  };

  const isActive = (item: (typeof mainNav)[0]) => {
    if (!item.path) return false;
    if (item.id === "dashboard") {
      return (
        location.pathname === "/label" ||
        location.pathname.startsWith("/label/artist")
      );
    }
    if (item.id === "sound-intelligence") {
      return location.pathname.startsWith("/label/sound-intelligence");
    }
    return location.pathname === item.path;
  };

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  if (collapsed) {
    return (
      <div
        style={{
          width: 64,
          height: "100vh",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 20,
          paddingBottom: 16,
        }}
      >
        <img
          src={waveboundLogo}
          alt="Wavebound"
          style={{ width: 28, height: 28, marginBottom: 24 }}
        />

        {/* Admin label switcher — collapsed popover */}
        {isAdmin && allLabels.length > 0 && (
          <div
            ref={switcherRef}
            style={{ position: "relative", marginBottom: 8 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSwitcherOpen(!switcherOpen)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: labelOverride
                      ? "1px solid rgba(232,67,10,0.3)"
                      : "1px solid transparent",
                    cursor: "pointer",
                    background: labelOverride
                      ? "rgba(232,67,10,0.08)"
                      : "transparent",
                    color: labelOverride ? "#e8430a" : "var(--ink-tertiary)",
                    transition: "all 150ms",
                  }}
                >
                  <Shield size={16} strokeWidth={1.8} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {labelOverride
                  ? `Viewing: ${labelOverride.labelName}`
                  : "Switch label"}
              </TooltipContent>
            </Tooltip>

            {switcherOpen && (
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: 0,
                  marginLeft: 8,
                  background: "#2C2C2E",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 4,
                  zIndex: 50,
                  width: 220,
                  maxHeight: 280,
                  overflowY: "auto",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {labelOverride && (
                  <button
                    onClick={() => {
                      setLabelOverride(null);
                      setSwitcherOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: "none",
                      textAlign: "left",
                      transition: "background 150ms",
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "none";
                    }}
                  >
                    <X size={14} color="#FF453A" style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#FF453A",
                      }}
                    >
                      Back to my account
                    </span>
                  </button>
                )}
                {allLabels.map((label) => {
                  const active = labelOverride
                    ? labelOverride.labelId === label.id
                    : labelId === label.id;
                  const isOwnLabel = !labelOverride && labelId === label.id;
                  return (
                    <button
                      key={label.id}
                      onClick={() => {
                        if (isOwnLabel) {
                          setLabelOverride(null);
                        } else {
                          setLabelOverride({
                            labelId: label.id,
                            labelName: label.name,
                            labelSlug: label.slug,
                            labelLogoUrl: label.logo_url,
                          });
                        }
                        setSwitcherOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: active ? "rgba(255,255,255,0.04)" : "none",
                        textAlign: "left",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = active
                          ? "rgba(255,255,255,0.04)"
                          : "none";
                      }}
                    >
                      {label.logo_url ? (
                        <img
                          src={label.logo_url}
                          alt={`${label.name} logo`}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            objectFit: "contain",
                            flexShrink: 0,
                            background: "rgba(255,255,255,0.06)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            background: "rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            {label.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          fontWeight: active ? 600 : 400,
                          color: active ? "var(--ink)" : "var(--ink-secondary)",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label.name}
                      </span>
                      {active && (
                        <Check
                          size={14}
                          color="#e8430a"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "center",
          }}
        >
          {mainNav.map((item) => {
            const active = isActive(item);
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNav(item)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      cursor: "pointer",
                      background: active
                        ? "var(--accent-light)"
                        : "transparent",
                      color: active ? "var(--accent)" : "var(--ink-tertiary)",
                      transition: "all 150ms ease",
                      position: "relative",
                    }}
                  >
                    {active && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 8,
                          bottom: 8,
                          width: 3,
                          borderRadius: 2,
                          background: "var(--accent)",
                        }}
                      />
                    )}
                    <item.icon size={22} strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                  {!item.path && " (Coming soon)"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "center",
          }}
        >
          {/* Admin link */}
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/admin")}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                    background: location.pathname.startsWith("/admin")
                      ? "rgba(232,67,10,0.12)"
                      : "transparent",
                    color: location.pathname.startsWith("/admin")
                      ? "#e8430a"
                      : "var(--ink-tertiary)",
                    transition: "all 150ms",
                  }}
                >
                  <Shield size={18} strokeWidth={1.8} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Admin
              </TooltipContent>
            </Tooltip>
          )}
          {/* System health — collapsed */}
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/label/admin/health")}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    cursor: "pointer",
                    background:
                      location.pathname === "/label/admin/health"
                        ? "rgba(232,67,10,0.12)"
                        : "transparent",
                    color:
                      location.pathname === "/label/admin/health"
                        ? "#e8430a"
                        : "var(--ink-tertiary)",
                    transition: "all 150ms",
                  }}
                >
                  <HeartPulse size={18} strokeWidth={1.8} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                System health
              </TooltipContent>
            </Tooltip>
          )}
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleTheme}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  color: "var(--ink-tertiary)",
                  transition: "all 150ms",
                }}
              >
                {dark ? (
                  <Sun size={18} strokeWidth={1.8} />
                ) : (
                  <Moon size={18} strokeWidth={1.8} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {dark ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>
          {bottomNav.map((item) => {
            const active = item.path ? location.pathname === item.path : false;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (item.path) navigate(item.path);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      cursor: item.path ? "pointer" : "default",
                      background: active
                        ? "var(--accent-light)"
                        : "transparent",
                      color: active ? "var(--accent)" : "var(--ink-tertiary)",
                      transition: "all 150ms",
                    }}
                  >
                    <item.icon size={20} strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                  {!item.path && " (Coming soon)"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 290,
        height: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Close button for mobile overlay */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-tertiary)",
            zIndex: 10,
          }}
        >
          <X size={20} />
        </button>
      )}

      {/* Greeting */}
      <div style={{ padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {labelLogoUrl ? (
            <img
              src={labelLogoUrl}
              alt={displayName}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                objectFit: "contain",
                flexShrink: 0,
                border: "2px solid var(--border)",
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--bg) 0%, var(--border) 100%)",
                border: "2px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink-tertiary)",
                }}
              >
                {initials}
              </span>
            </div>
          )}
          <div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 400,
                color: "var(--ink-tertiary)",
              }}
            >
              {today}
            </div>
          </div>
        </div>
        <div
          style={{ height: 1, background: "var(--border)", marginTop: 28 }}
        />
      </div>

      {/* Admin label switcher */}
      {isAdmin && allLabels.length > 0 && (
        <div
          ref={switcherRef}
          style={{ padding: "12px 12px 0", position: "relative" }}
        >
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              cursor: "pointer",
              background: labelOverride
                ? "rgba(232,67,10,0.08)"
                : "rgba(255,255,255,0.02)",
              transition: "all 150ms",
              textAlign: "left",
            }}
          >
            <Shield
              size={14}
              color={labelOverride ? "#e8430a" : "var(--ink-tertiary)"}
              style={{ flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 500,
                color: labelOverride ? "#e8430a" : "var(--ink-secondary)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {labelOverride
                ? `Viewing: ${labelOverride.labelName}`
                : "Switch label view"}
            </span>
            <ChevronsUpDown
              size={14}
              color="var(--ink-tertiary)"
              style={{ flexShrink: 0 }}
            />
          </button>

          {switcherOpen && (
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                top: "100%",
                marginTop: 4,
                background: "#2C2C2E",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 4,
                zIndex: 50,
                maxHeight: 280,
                overflowY: "auto",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {/* Reset to own label */}
              {labelOverride && (
                <button
                  onClick={() => {
                    setLabelOverride(null);
                    setSwitcherOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: "none",
                    textAlign: "left",
                    transition: "background 150ms",
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "none";
                  }}
                >
                  <X size={14} color="#FF453A" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#FF453A",
                    }}
                  >
                    Back to my account
                  </span>
                </button>
              )}

              {allLabels.map((label) => {
                const isActive = labelOverride
                  ? labelOverride.labelId === label.id
                  : labelId === label.id;
                const isOwnLabel = !labelOverride && labelId === label.id;
                return (
                  <button
                    key={label.id}
                    onClick={() => {
                      if (isOwnLabel) {
                        setLabelOverride(null);
                      } else {
                        setLabelOverride({
                          labelId: label.id,
                          labelName: label.name,
                          labelSlug: label.slug,
                          labelLogoUrl: label.logo_url,
                        });
                      }
                      setSwitcherOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: isActive ? "rgba(255,255,255,0.04)" : "none",
                      textAlign: "left",
                      transition: "background 150ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        isActive ? "rgba(255,255,255,0.04)" : "none";
                    }}
                  >
                    {label.logo_url ? (
                      <img
                        src={label.logo_url}
                        alt={`${label.name} logo`}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          objectFit: "contain",
                          flexShrink: 0,
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          {label.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "var(--ink)" : "var(--ink-secondary)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label.name}
                    </span>
                    {isActive && (
                      <Check
                        size={14}
                        color="#e8430a"
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main nav */}
      <nav
        style={{
          padding: "20px 12px 0",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {mainNav.map((item) => {
          const active = isActive(item);
          const comingSoon = !item.path;
          const isPreview = "isPreview" in item && item.isPreview;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className="label-nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 48,
                padding: "0 12px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: active ? "var(--accent-light)" : "transparent",
                color: active ? "var(--ink)" : "var(--ink-secondary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                transition: "all 150ms ease",
                position: "relative",
                textAlign: "left",
                width: "100%",
                opacity: comingSoon ? 0.6 : 1,
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 10,
                    bottom: 10,
                    width: 3,
                    borderRadius: 2,
                    background: "var(--accent)",
                  }}
                />
              )}
              <item.icon
                size={22}
                strokeWidth={1.8}
                style={{
                  color: active ? "var(--accent)" : "var(--ink-tertiary)",
                  transition: "color 150ms",
                }}
              />
              <span>{item.label}</span>
              {item.id === "dashboard" && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--ink-tertiary)",
                    marginLeft: "auto",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {roleLabel}
                </span>
              )}
              {isPreview && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--ink-tertiary)",
                    marginLeft: "auto",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  Coming soon
                </span>
              )}
              {comingSoon && !isPreview && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    marginLeft: "auto",
                  }}
                >
                  Soon
                </span>
              )}
              {"isNew" in item && item.isNew && !comingSoon && !isPreview && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "#e8430a",
                    background: "rgba(232,67,10,0.12)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    marginLeft: "auto",
                  }}
                >
                  {"badgeLabel" in item && item.badgeLabel
                    ? (item.badgeLabel as string)
                    : "NEW"}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: "auto", padding: "0 12px" }}>
        <div
          style={{ height: 1, background: "var(--border)", margin: "0 0 16px" }}
        />

        {/* Admin link */}
        {isAdmin && (
          <button
            onClick={() => {
              navigate("/admin");
              onClose?.();
            }}
            className="label-nav-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 40,
              padding: "0 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: location.pathname.startsWith("/admin")
                ? "rgba(232,67,10,0.12)"
                : "transparent",
              color: location.pathname.startsWith("/admin")
                ? "var(--ink)"
                : "var(--ink-secondary)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight: location.pathname.startsWith("/admin") ? 600 : 500,
              transition: "all 150ms",
              textAlign: "left",
              width: "100%",
            }}
          >
            <Shield
              size={18}
              strokeWidth={1.8}
              style={{
                color: location.pathname.startsWith("/admin")
                  ? "#e8430a"
                  : "var(--ink-tertiary)",
              }}
            />
            Admin
          </button>
        )}

        {/* System health — admin only */}
        {isAdmin && (
          <button
            onClick={() => {
              navigate("/label/admin/health");
              onClose?.();
            }}
            className="label-nav-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 40,
              padding: "0 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background:
                location.pathname === "/label/admin/health"
                  ? "rgba(232,67,10,0.12)"
                  : "transparent",
              color:
                location.pathname === "/label/admin/health"
                  ? "var(--ink)"
                  : "var(--ink-secondary)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight:
                location.pathname === "/label/admin/health" ? 600 : 500,
              transition: "all 150ms",
              textAlign: "left",
              width: "100%",
            }}
          >
            <HeartPulse
              size={18}
              strokeWidth={1.8}
              style={{
                color:
                  location.pathname === "/label/admin/health"
                    ? "#e8430a"
                    : "var(--ink-tertiary)",
              }}
            />
            System health
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="label-nav-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 40,
            padding: "0 12px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "var(--ink-secondary)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 500,
            transition: "all 150ms",
            textAlign: "left",
            width: "100%",
          }}
        >
          {dark ? (
            <Sun
              size={18}
              strokeWidth={1.8}
              style={{ color: "var(--ink-tertiary)" }}
            />
          ) : (
            <Moon
              size={18}
              strokeWidth={1.8}
              style={{ color: "var(--ink-tertiary)" }}
            />
          )}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>

        {bottomNav.map((item) => {
          const active = item.path ? location.pathname === item.path : false;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                  onClose?.();
                }
              }}
              className="label-nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 40,
                padding: "0 12px",
                borderRadius: 10,
                border: "none",
                cursor: item.path ? "pointer" : "default",
                background: active ? "var(--accent-light)" : "transparent",
                color: active ? "var(--ink)" : "var(--ink-secondary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                transition: "all 150ms",
                textAlign: "left",
                width: "100%",
                opacity: item.path ? 1 : 0.6,
              }}
            >
              <item.icon
                size={18}
                strokeWidth={1.8}
                style={{
                  color: active ? "var(--accent)" : "var(--ink-tertiary)",
                }}
              />
              {item.label}
              {!item.path && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    marginLeft: "auto",
                  }}
                >
                  Soon
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={handleSignOut}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 400,
            color: "var(--ink-tertiary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
            marginTop: 4,
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--ink-tertiary)")
          }
        >
          Log out
        </button>

        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "var(--ink-faint)",
            letterSpacing: "0.5px",
            padding: "12px 12px 16px",
            textAlign: "left",
          }}
        >
          Powered by Wavebound
        </div>
      </div>
    </div>
  );
}

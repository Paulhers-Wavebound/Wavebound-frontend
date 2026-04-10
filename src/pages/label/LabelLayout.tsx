import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import LabelSidebar from "@/components/label/LabelSidebar";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutDashboard,
  Brain,
  Music,
  Megaphone,
  Radar,
  Sparkles,
  HelpCircle,
  Settings,
  Sun,
  Moon,
  HeartPulse,
  ChevronRightIcon,
  Clock,
  Globe,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import LabelContentSkeleton from "@/components/label/LabelContentSkeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { PageTitleProvider, usePageTitle } from "@/contexts/PageTitleContext";
import { useAdminRole } from "@/hooks/use-admin-role";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { PREVIEW_FEATURES } from "@/config/previewFeatures";

/* ─── Theme hook ──────────────────────────────────────────────── */

function useLabelTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("label-theme");
      return stored ? stored === "dark" : true;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    const value = dark ? "dark" : "light";
    root.setAttribute("data-label-theme", value);
    localStorage.setItem("label-theme", value);
    return () => root.removeAttribute("data-label-theme");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

/* ─── Sidebar collapse hook ───────────────────────────────────── */

const TABLET_MAX = 1024;
const TOPBAR_HEIGHT = 48;

function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("label-sidebar-collapsed") === "true";
    }
    return false;
  });

  const [manuallySet, setManuallySet] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("label-sidebar-collapsed", String(next));
      return next;
    });
    setManuallySet(true);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${TABLET_MAX - 1}px) and (min-width: 768px)`,
    );
    const onChange = () => {
      if (mql.matches && !manuallySet) {
        setCollapsed(true);
        localStorage.setItem("label-sidebar-collapsed", "true");
      }
    };
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [manuallySet]);

  return { collapsed, toggle };
}

/* ─── Breadcrumb data ─────────────────────────────────────────── */

interface Crumb {
  label: string;
  path: string;
}

const ROUTE_MAP: Record<string, string> = {
  "/label": "Dashboard",
  "/label/assistant": "Intelligence",
  "/label/sound-intelligence": "Sound Intelligence",
  "/label/sound-intelligence/compare": "Compare",
  "/label/amplification": "Paid Amplification",
  "/label/expansion-radar": "Expansion Radar",
  "/label/fan-briefs": "Fan Briefs",
  "/label/settings": "Settings",
  "/label/help": "Help",
  "/label/admin/health": "System Health",
  "/label/admin/health/servers": "Servers",
  "/label/admin/health/scrapers": "Scrapers",
  "/label/admin/health/cron": "Cron Jobs",
  "/label/admin/health/quotas": "API Quotas",
  "/label/admin/health/data": "Data",
  "/label/admin/health/identity": "Identity",
  "/label/admin/health/inventory": "Inventory",
  "/label/admin/health/pipeline": "Pipeline",
};

const PARENT_MAP: Record<string, string> = {
  "/label/sound-intelligence/compare": "/label/sound-intelligence",
  "/label/admin/health": "/label",
  "/label/admin/health/servers": "/label/admin/health",
  "/label/admin/health/scrapers": "/label/admin/health",
  "/label/admin/health/cron": "/label/admin/health",
  "/label/admin/health/quotas": "/label/admin/health",
  "/label/admin/health/data": "/label/admin/health",
  "/label/admin/health/identity": "/label/admin/health",
  "/label/admin/health/inventory": "/label/admin/health",
  "/label/admin/health/pipeline": "/label/admin/health",
};

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const pageTitle = usePageTitle();

  return useMemo(() => {
    // Exact match
    const exactLabel = ROUTE_MAP[pathname];
    if (exactLabel) {
      const parent = PARENT_MAP[pathname];
      if (parent && ROUTE_MAP[parent]) {
        return [
          { label: ROUTE_MAP[parent], path: parent },
          { label: exactLabel, path: pathname },
        ];
      }
      return [{ label: exactLabel, path: pathname }];
    }

    // Dynamic: /label/sound-intelligence/:jobId
    if (
      pathname.startsWith("/label/sound-intelligence/") &&
      pathname !== "/label/sound-intelligence/compare"
    ) {
      return [
        { label: "Sound Intelligence", path: "/label/sound-intelligence" },
        { label: pageTitle || "Analysis", path: pathname },
      ];
    }

    // Dynamic: /label/artist/:id
    if (pathname.startsWith("/label/artist/")) {
      return [
        { label: "Dashboard", path: "/label" },
        { label: pageTitle || "Artist", path: pathname },
      ];
    }

    // Dynamic: /label/artists/:handle
    if (pathname.startsWith("/label/artists/")) {
      return [
        { label: "Dashboard", path: "/label" },
        { label: pageTitle || "Artist Profile", path: pathname },
      ];
    }

    return [{ label: "Dashboard", path: "/label" }];
  }, [pathname, pageTitle]);
}

/* ─── Recent pages ────────────────────────────────────────────── */

interface RecentPage {
  path: string;
  label: string;
  ts: number;
}

const RECENT_KEY = "label-recent-pages";
const RECENT_MAX = 5;

function useRecentPages() {
  const { pathname } = useLocation();
  const pageTitle = usePageTitle();
  const [recent, setRecent] = useState<RecentPage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Track the previous path to avoid recording on every re-render
  const prevPath = useRef(pathname);

  useEffect(() => {
    // Derive a label: use dynamic page title, static route map, or skip
    const label = pageTitle || ROUTE_MAP[pathname];
    if (!label) return;
    // Only update when path actually changes or page title loads
    if (prevPath.current === pathname && !pageTitle) return;
    prevPath.current = pathname;

    setRecent((prev) => {
      const filtered = prev.filter((p) => p.path !== pathname);
      const next = [
        { path: pathname, label, ts: Date.now() },
        ...filtered,
      ].slice(0, RECENT_MAX);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, [pathname, pageTitle]);

  return recent;
}

/* ─── Command palette items ───────────────────────────────────── */

interface CmdItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavCommand extends CmdItem {
  adminOnly?: boolean;
  featureId?: string;
}

const NAV_COMMANDS: NavCommand[] = [
  { label: "Dashboard", path: "/label", icon: LayoutDashboard },
  {
    label: "Intelligence",
    path: "/label/assistant",
    icon: Brain,
    featureId: "intelligence",
  },
  {
    label: "Sound Intelligence",
    path: "/label/sound-intelligence",
    icon: Music,
  },
  {
    label: "Paid Amplification",
    path: "/label/amplification",
    icon: Megaphone,
  },
  { label: "Expansion Radar", path: "/label/expansion-radar", icon: Radar },
  { label: "Fan Briefs", path: "/label/fan-briefs", icon: Sparkles },
  {
    label: "The Pulse",
    path: "/label/admin/pulse",
    icon: Globe,
    adminOnly: true,
  },
  {
    label: "System Health",
    path: "/label/admin/health",
    icon: HeartPulse,
    adminOnly: true,
  },
  { label: "Help", path: "/label/help", icon: HelpCircle },
  { label: "Settings", path: "/label/settings", icon: Settings },
];

/* ─── Topbar button ───────────────────────────────────────────── */

const topbarBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  background: "transparent",
  color: "var(--ink-tertiary)",
  transition: "color 150ms, background 150ms",
  flexShrink: 0,
};

function TopbarButton({
  onClick,
  tooltip,
  shortcut,
  children,
}: {
  onClick: () => void;
  tooltip: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          style={topbarBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "var(--ink-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--ink-tertiary)";
          }}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {tooltip}
        {shortcut && (
          <span style={{ opacity: 0.5, marginLeft: 6 }}>{shortcut}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/* ─── Inner layout (needs PageTitleContext) ────────────────────── */

function LabelLayoutInner() {
  const { dark, toggle: toggleTheme } = useLabelTheme();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } =
    useSidebarCollapse();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const breadcrumbs = useBreadcrumbs();
  const recentPages = useRecentPages();

  const isMac = navigator.platform?.includes("Mac");
  const { isAdmin } = useAdminRole();
  const { labelId } = useUserProfile();
  const previewList = labelId ? (PREVIEW_FEATURES[labelId] ?? []) : [];

  // Filter nav commands by admin role and preview features
  const filteredNavCommands = useMemo(
    () =>
      NAV_COMMANDS.filter((cmd) => {
        if (cmd.adminOnly && !isAdmin) return false;
        if (cmd.featureId && previewList.includes(cmd.featureId)) return false;
        return true;
      }),
    [isAdmin, previewList],
  );

  // Filter recent: exclude current page
  const recentFiltered = recentPages.filter((p) => p.path !== pathname);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar]);

  const runCommand = useCallback((cb: () => void) => {
    setCmdOpen(false);
    cb();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* Desktop sidebar */}
      {!isMobile && (
        <div
          style={{
            flexShrink: 0,
            width: sidebarCollapsed ? 64 : 290,
            transition: "width 200ms ease",
            overflow: "hidden",
          }}
        >
          <LabelSidebar
            dark={dark}
            onToggleTheme={toggleTheme}
            collapsed={sidebarCollapsed}
          />
        </div>
      )}

      {/* Mobile: top bar + sheet sidebar */}
      {isMobile && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              height: TOPBAR_HEIGHT,
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 8,
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink)",
                padding: 4,
              }}
            >
              <Menu size={22} />
            </button>

            {/* Mobile breadcrumb — just current page name */}
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ink-secondary)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {breadcrumbs[breadcrumbs.length - 1]?.label}
            </span>

            {/* Mobile search */}
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                background: "transparent",
                color: "var(--ink-tertiary)",
              }}
            >
              <Search size={18} strokeWidth={1.8} />
            </button>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="left"
              className="p-0 w-[280px] border-none"
              style={{ background: "var(--surface)" }}
            >
              <LabelSidebar
                dark={dark}
                onToggleTheme={toggleTheme}
                onClose={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Main content column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Desktop top bar */}
        {!isMobile && (
          <div
            style={{
              height: TOPBAR_HEIGHT,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "0 12px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            {/* Left: collapse + nav */}
            <TopbarButton
              onClick={toggleSidebar}
              tooltip={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              shortcut={isMac ? "⌘B" : "Ctrl+B"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} strokeWidth={1.8} />
              ) : (
                <PanelLeftClose size={18} strokeWidth={1.8} />
              )}
            </TopbarButton>

            <div
              style={{
                width: 1,
                height: 20,
                background: "var(--border)",
                margin: "0 4px",
              }}
            />

            <TopbarButton
              onClick={() => navigate(-1)}
              tooltip="Back"
              shortcut={isMac ? "⌘[" : "Alt+←"}
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </TopbarButton>

            <TopbarButton
              onClick={() => navigate(1)}
              tooltip="Forward"
              shortcut={isMac ? "⌘]" : "Alt+→"}
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </TopbarButton>

            {/* Breadcrumbs */}
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginLeft: 12,
                minWidth: 0,
              }}
            >
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <div
                    key={crumb.path}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {i > 0 && (
                      <ChevronRightIcon
                        size={14}
                        style={{ color: "var(--ink-faint)", flexShrink: 0 }}
                      />
                    )}
                    {isLast ? (
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--ink-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.path}
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          fontWeight: 400,
                          color: "var(--ink-tertiary)",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          transition: "color 150ms",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--ink-secondary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--ink-tertiary)")
                        }
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            <div style={{ flex: 1 }} />

            {/* Right: search */}
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 32,
                padding: "0 10px 0 8px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                cursor: "pointer",
                background: "transparent",
                color: "var(--ink-tertiary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                transition: "border-color 150ms, color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "var(--ink-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--ink-tertiary)";
              }}
            >
              <Search size={14} strokeWidth={1.8} />
              <span>Search</span>
              <kbd
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--ink-faint)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  marginLeft: 4,
                }}
              >
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </button>
          </div>
        )}

        {/* Scrollable page content */}
        <main
          style={{
            flex: 1,
            overflow: "auto",
            paddingTop: isMobile ? TOPBAR_HEIGHT : 0,
          }}
        >
          <Suspense fallback={<LabelContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Command palette */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent pages */}
          {recentFiltered.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentFiltered.map((page) => (
                  <CommandItem
                    key={page.path}
                    value={`recent ${page.label}`}
                    onSelect={() => runCommand(() => navigate(page.path))}
                  >
                    <Clock
                      size={16}
                      strokeWidth={1.8}
                      style={{ marginRight: 8, opacity: 0.4 }}
                    />
                    {page.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Navigate">
            {filteredNavCommands.map((cmd) => (
              <CommandItem
                key={cmd.path}
                value={cmd.label}
                onSelect={() => runCommand(() => navigate(cmd.path))}
              >
                <cmd.icon
                  size={16}
                  strokeWidth={1.8}
                  style={{ marginRight: 8, opacity: 0.6 }}
                />
                {cmd.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="Toggle theme dark light mode"
              onSelect={() => runCommand(toggleTheme)}
            >
              {dark ? (
                <Sun
                  size={16}
                  strokeWidth={1.8}
                  style={{ marginRight: 8, opacity: 0.6 }}
                />
              ) : (
                <Moon
                  size={16}
                  strokeWidth={1.8}
                  style={{ marginRight: 8, opacity: 0.6 }}
                />
              )}
              {dark ? "Switch to light mode" : "Switch to dark mode"}
            </CommandItem>
            <CommandItem
              value="Toggle sidebar collapse expand"
              onSelect={() => runCommand(toggleSidebar)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen
                  size={16}
                  strokeWidth={1.8}
                  style={{ marginRight: 8, opacity: 0.6 }}
                />
              ) : (
                <PanelLeftClose
                  size={16}
                  strokeWidth={1.8}
                  style={{ marginRight: 8, opacity: 0.6 }}
                />
              )}
              {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              <CommandShortcut>{isMac ? "⌘B" : "Ctrl+B"}</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

/* ─── Root export wraps with PageTitleProvider ─────────────────── */

export default function LabelLayout() {
  return (
    <PageTitleProvider>
      <LabelLayoutInner />
    </PageTitleProvider>
  );
}

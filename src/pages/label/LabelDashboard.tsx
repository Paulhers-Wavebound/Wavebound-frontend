import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LabelLayout from "./LabelLayout";
import SEOHead from "@/components/SEOHead";
import RosterCard, { type RosterMetric } from "@/components/label/RosterCard";
import RosterListView from "@/components/label/RosterListView";
import PipelineProgress from "@/components/label/PipelineProgress";
import RiskAlertsPanel from "@/components/label/RiskAlertsPanel";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useLabelPermissions } from "@/hooks/useLabelPermissions";
import { Search, RefreshCw, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

type Filter = "all" | "attention" | "momentum" | "stalled";
export default function LabelDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { labelId } = useUserProfile();
  const { canEdit } = useLabelPermissions();

  const [metrics, setMetrics] = useState<RosterMetric[]>([]);
  const [alertDots, setAlertDots] = useState<
    Map<string, "celebration" | "warning">
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    () =>
      (localStorage.getItem("label-roster-view") as "grid" | "list") || "grid",
  );
  const [processing, setProcessing] = useState<
    { tempId: string; artist_handle: string; artist_name: string }[]
  >([]);

  const fetchMetrics = useCallback(async () => {
    let viewQuery = supabase
      .from("roster_dashboard_metrics")
      .select("*")
      .order("risk_level", { ascending: false });
    let aiQuery = supabase
      .from("artist_intelligence")
      .select(
        "artist_handle, artist_name, avatar_url, status, content_plan_html, label_id",
      )
      .eq("status", "completed");

    if (labelId) {
      viewQuery = viewQuery.eq("label_id", labelId);
      aiQuery = aiQuery.eq("label_id", labelId);
    }

    const [viewRes, aiRes] = await Promise.all([viewQuery, aiQuery]);

    if (viewRes.error && aiRes.error) {
      setError(true);
      setLoading(false);
      return;
    }

    const viewData: RosterMetric[] = (viewRes.data as any) || [];
    const aiData: any[] = (aiRes.data as any) || [];

    // Build set of confirmed-completed handles from artist_intelligence
    const aiCompletedHandles = new Set(
      aiData.map((a) => (a.artist_handle || "").trim().toLowerCase()),
    );

    // Build merged map: start with view data, then upsert from AI data
    const mergedMap = new Map<string, RosterMetric>();
    for (const m of viewData) {
      const key = (m.artist_handle || "").trim().toLowerCase();
      mergedMap.set(key, m);
    }

    for (const a of aiData) {
      const key = (a.artist_handle || "").trim().toLowerCase();
      if (!key) continue;
      const existing = mergedMap.get(key);
      if (existing) {
        // Override pipeline_status to completed since AI confirms it
        (existing as any).pipeline_status = "completed";
        // Backfill name/avatar if missing
        if (!existing.artist_name)
          existing.artist_name = a.artist_name || a.artist_handle;
        if (!existing.avatar_url) existing.avatar_url = a.avatar_url || null;
        // Backfill plan status from AI data
        if (a.content_plan_html && !(existing as any).has_content_plan) {
          (existing as any).has_content_plan = true;
        }
      } else {
        // Add stub entry
        mergedMap.set(key, {
          artist_handle: a.artist_handle,
          artist_name: a.artist_name || a.artist_handle,
          avatar_url: a.avatar_url || null,
          pipeline_status: "completed",
          momentum_tier: null,
          risk_level: "ok",
          has_content_plan: !!a.content_plan_html,
        } as any);
      }
    }

    const merged = Array.from(mergedMap.values());

    setMetrics(merged);
    setLoading(false);

    // Fetch recent alerts for dot indicators
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: alertData } = await supabase
      .from("artist_alerts")
      .select("artist_handle, severity, created_at")
      .gte("created_at", cutoff)
      .in("severity", ["celebration", "warning"]);

    const dotMap = new Map<string, "celebration" | "warning">();
    for (const a of (alertData as any[]) || []) {
      const h = (a.artist_handle || "").trim().toLowerCase();
      const existing = dotMap.get(h);
      if (!existing || a.severity === "celebration") {
        dotMap.set(h, a.severity);
      }
    }
    setAlertDots(dotMap);
  }, [labelId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await supabase.rpc("refresh_roster_metrics");
    await fetchMetrics();
    setRefreshing(false);
  };

  const handlePipelineComplete = useCallback(
    async (handle: string) => {
      setProcessing((prev) => prev.filter((p) => p.artist_handle !== handle));
      await supabase.rpc("refresh_roster_metrics");
      fetchMetrics();
    },
    [fetchMetrics],
  );

  // Derived data
  const processingHandles = new Set(processing.map((p) => p.artist_handle));

  const filtered = useMemo(() => {
    return metrics
      .filter((a) => !processingHandles.has(a.artist_handle))
      .filter((a) => (a as any).pipeline_status === "completed")
      .filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          a.artist_name?.toLowerCase().includes(q) ||
          a.artist_handle?.toLowerCase().includes(q)
        );
      })
      .filter((a) => {
        const tier = a.momentum_tier?.toLowerCase();
        const risk = a.risk_level?.toLowerCase();
        switch (activeFilter) {
          case "attention":
            return risk !== "ok";
          case "momentum":
            return (
              tier === "momentum" || tier === "breakout" || tier === "viral"
            );
          case "stalled":
            return tier === "stalled";
          default:
            return true;
        }
      });
  }, [metrics, search, activeFilter, processingHandles]);

  // Summary counts
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of metrics) {
      const t = m.momentum_tier?.toLowerCase() || "unknown";
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [metrics]);

  const alertCount = useMemo(
    () => metrics.filter((m) => m.risk_level?.toLowerCase() !== "ok").length,
    [metrics],
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "attention", label: "Needs Attention" },
    { key: "momentum", label: "Momentum+" },
    { key: "stalled", label: "Stalled" },
  ];

  if (loading) {
    return (
      <LabelLayout>
        <div className="p-6 md:p-8 lg:p-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </LabelLayout>
    );
  }

  if (error) {
    return (
      <LabelLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <p className="text-base font-medium text-foreground">
            Something went wrong
          </p>
          <p className="text-sm text-muted-foreground">
            Could not load your roster. Try refreshing.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </LabelLayout>
    );
  }

  return (
    <LabelLayout>
      <SEOHead
        title="Dashboard — Wavebound Label"
        description="Your artist roster dashboard"
      />
      <div className="p-6 md:p-8 lg:p-10 space-y-5">
        {/* Summary bar */}
        <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {metrics.length} Artists
          </span>
          {["viral", "breakout", "momentum", "stable", "stalled"].map((t) =>
            tierCounts[t] ? (
              <span key={t}>
                · {tierCounts[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            ) : null,
          )}
          {alertCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {alertCount} alert{alertCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Risk Alerts */}
        <RiskAlertsPanel metrics={metrics} />

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card flex-1 min-w-[180px] max-w-[280px]">
            <Search size={15} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search artists..."
              aria-label="Search artists"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  activeFilter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh Metrics
            </Button>
          )}

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => {
                setViewMode("grid");
                localStorage.setItem("label-roster-view", "grid");
              }}
              aria-label="Grid view"
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                localStorage.setItem("label-roster-view", "list");
              }}
              aria-label="List view"
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Processing cards */}
        {processing.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {processing.map((p) => (
              <div
                key={p.tempId}
                className="rounded-xl border border-border p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {p.artist_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{p.artist_handle?.replace(/^@+/, "")}
                    </p>
                  </div>
                </div>
                <PipelineProgress
                  artistHandle={p.artist_handle}
                  onComplete={() => handlePipelineComplete(p.artist_handle)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Roster view */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="sync">
              {filtered.map((artist) => (
                <motion.div
                  key={artist.artist_handle}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <RosterCard
                    artist={artist}
                    onClick={() =>
                      navigate(`/label/artists/${artist.artist_handle}`)
                    }
                    alertDot={alertDots.get(
                      (artist.artist_handle || "").trim().toLowerCase(),
                    )}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <RosterListView
            artists={filtered}
            onArtistClick={(handle) => navigate(`/label/artists/${handle}`)}
          />
        )}

        {filtered.length === 0 &&
          !loading &&
          metrics.length === 0 &&
          processing.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-lg font-semibold text-foreground">
                Your roster is empty
              </p>
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "Add your first artist to get started"
                  : "No artists on this roster yet"}
              </p>
            </div>
          )}

        {filtered.length === 0 && !loading && metrics.length > 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">No artists match your filters.</p>
          </div>
        )}
      </div>
    </LabelLayout>
  );
}

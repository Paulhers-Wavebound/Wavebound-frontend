import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  triggerSoundAnalysis,
  retrySoundAnalysis,
  cancelSoundAnalysis,
  extractSoundId,
  validateSoundUrl,
  formatNumber,
  timeAgo,
  listSoundAnalyses,
  ListAnalysisEntry,
  PROCESSING_STATUSES,
  JOB_STATUS_CONFIG,
} from "@/utils/soundIntelligenceApi";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Loader2,
  Music,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  LayoutGrid,
  List,
  X,
  AlertTriangle,
  FileText,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  User,
} from "lucide-react";
import { exportOverviewPDF } from "@/utils/exportAnalysis";
import MonitoringBadge from "@/components/sound-intelligence/MonitoringBadge";
import NextCheckCountdown from "@/components/sound-intelligence/NextCheckCountdown";
import SoundAlertBell from "@/components/sound-intelligence/SoundAlertBell";
import RoleSelector from "@/components/label/RoleSelector";

/** Stall threshold: 3 min for refreshing (fast), 15 min for others */
function stallThresholdMs(status: string): number {
  return status === "refreshing" ? 3 * 60 * 1000 : 15 * 60 * 1000;
}

function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const velocityStatusConfig: Record<
  string,
  { label: string; color: string; Icon: any }
> = {
  accelerating: { label: "Accelerating", color: "#30D158", Icon: TrendingUp },
  active: { label: "Active", color: "#FF9F0A", Icon: Minus },
  declining: { label: "Declining", color: "#FF453A", Icon: TrendingDown },
};

type SourceFilter = "all" | "roster" | "manual";

export default function SoundIntelligenceOverview() {
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const [searchInput, setSearchInput] = useState("");
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompetitorInput, setShowCompetitorInput] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const progressSnapshots = useRef<
    Map<string, { scraped: number; analyzed: number; lastChanged: number }>
  >(new Map());
  const [entries, setEntries] = useState<ListAnalysisEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchList = useCallback(async () => {
    if (!labelId) return;
    try {
      const data = await listSoundAnalyses(labelId);
      setEntries(data);

      const now = Date.now();
      const snaps = progressSnapshots.current;
      for (const entry of data) {
        if (entry.status === "completed" || entry.status === "failed") {
          snaps.delete(entry.job_id);
          continue;
        }
        const prev = snaps.get(entry.job_id);
        if (!prev) {
          // Seed stall clock from the job's creation time so jobs that were
          // already stuck before the client loaded are flagged immediately.
          snaps.set(entry.job_id, {
            scraped: entry.videos_scraped,
            analyzed: entry.videos_analyzed,
            lastChanged: new Date(entry.created_at).getTime(),
          });
        } else if (
          prev.scraped !== entry.videos_scraped ||
          prev.analyzed !== entry.videos_analyzed
        ) {
          snaps.set(entry.job_id, {
            scraped: entry.videos_scraped,
            analyzed: entry.videos_analyzed,
            lastChanged: now,
          });
        }
      }
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [labelId]);

  useEffect(() => {
    if (!labelId) {
      setIsLoading(false);
      return;
    }
    fetchList();
  }, [labelId, fetchList]);

  const hasProcessing = entries.some((e) =>
    (PROCESSING_STATUSES as readonly string[]).includes(e.status),
  );
  useEffect(() => {
    if (!hasProcessing) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(fetchList, 5000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [hasProcessing, fetchList]);

  // Filter entries by source
  const filteredEntries = useMemo(() => {
    if (sourceFilter === "all") return entries;
    if (sourceFilter === "roster")
      return entries.filter((e) => e.source === "auto_discovery");
    return entries.filter((e) => e.source !== "auto_discovery");
  }, [entries, sourceFilter]);

  const processing = filteredEntries.filter((e) =>
    (PROCESSING_STATUSES as readonly string[]).includes(e.status),
  );
  const completed = filteredEntries.filter((e) => e.status === "completed");

  // Group roster sounds by artist
  const rosterByArtist = useMemo(() => {
    const roster = entries.filter((e) => e.source === "auto_discovery");
    const groups = new Map<string, ListAnalysisEntry[]>();
    for (const entry of roster) {
      const key = entry.artist_handle || "unknown";
      const list = groups.get(key) || [];
      list.push(entry);
      groups.set(key, list);
    }
    return groups;
  }, [entries]);

  const rosterCount = entries.filter(
    (e) => e.source === "auto_discovery",
  ).length;
  const manualCount = entries.filter(
    (e) => e.source !== "auto_discovery",
  ).length;

  const handleSubmit = async () => {
    if (!searchInput.trim() || isSubmitting) return;

    const validation = validateSoundUrl(searchInput.trim());
    if (!validation.valid) {
      setUrlWarning(validation.reason || "Invalid URL");
      return;
    }
    setUrlWarning(null);

    setIsSubmitting(true);
    try {
      const soundId = extractSoundId(searchInput.trim());

      if (soundId) {
        const existing = entries.find(
          (e) => e.sound_id === soundId && e.status === "completed",
        );
        if (existing) {
          navigate(`/label/sound-intelligence/${existing.job_id}`);
          setIsSubmitting(false);
          return;
        }
      }

      const res = await triggerSoundAnalysis(
        searchInput.trim(),
        labelId || null,
      );

      if (res.cached) {
        navigate(`/label/sound-intelligence/${res.job_id}`);
      } else {
        const optimistic: ListAnalysisEntry = {
          job_id: res.job_id,
          sound_id: soundId || "",
          track_name: "",
          artist_name: "",
          album_name: "",
          status: "pending",
          videos_scraped: 0,
          videos_analyzed: 0,
          created_at: new Date().toISOString(),
          completed_at: null,
          last_refresh_at: null,
          refresh_count: 0,
          monitoring: null,
          summary: null,
          artist_handle: null,
          source: "manual",
          tracking_expires_at: null,
        };
        setEntries((prev) => [
          optimistic,
          ...prev.filter((e) => e.job_id !== res.job_id),
        ]);
      }
      setSearchInput("");
      setShowCompetitorInput(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Source badge component ───
  const SourceBadge = ({
    entry,
    size = "sm",
  }: {
    entry: ListAnalysisEntry;
    size?: "sm" | "md";
  }) => {
    const isAuto = entry.source === "auto_discovery";
    const days = daysRemaining(entry.tracking_expires_at);
    const fontSize = size === "md" ? 12 : 11;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 6,
            background: isAuto
              ? "rgba(232,67,10,0.12)"
              : "rgba(255,255,255,0.06)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize,
            fontWeight: 600,
            color: isAuto ? "var(--accent)" : "var(--ink-tertiary)",
          }}
        >
          {isAuto ? <Zap size={10} /> : <Search size={10} />}
          {isAuto ? "Auto" : "Manual"}
        </span>
        {isAuto && entry.artist_handle && (
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize,
              color: "var(--ink-tertiary)",
            }}
          >
            @{entry.artist_handle}
          </span>
        )}
        {isAuto && days !== null && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              color:
                days <= 5
                  ? "#FF453A"
                  : days <= 10
                    ? "#FF9F0A"
                    : "var(--ink-faint)",
            }}
          >
            <Clock size={9} />
            {days}d
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              Sound Intelligence
            </h1>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                color: "var(--ink-tertiary)",
                lineHeight: 1.5,
              }}
            >
              Roster sounds are tracked automatically. Add competitor sounds
              manually to compare.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RoleSelector />
            {labelId && <SoundAlertBell labelId={labelId} />}
          </div>
        </div>

        {/* Filter tabs + actions row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {(
              [
                { key: "all", label: "All", count: entries.length },
                { key: "roster", label: "Roster", count: rosterCount },
                { key: "manual", label: "Competitor", count: manualCount },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setSourceFilter(key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background:
                    sourceFilter === key ? "var(--accent)" : "var(--surface)",
                  color: sourceFilter === key ? "#fff" : "var(--ink-secondary)",
                  transition: "all 150ms",
                }}
              >
                {label}
                {count > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      opacity: 0.7,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowCompetitorInput(!showCompetitorInput)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: showCompetitorInput
                  ? "var(--surface-hover)"
                  : "var(--surface)",
                color: "var(--ink-secondary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              <Plus size={14} />
              Track Sound
            </button>
            {completed.length > 0 && (
              <button
                onClick={async () => {
                  await exportOverviewPDF(entries);
                  toast({ title: "Summary PDF exported" });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--surface)",
                  color: "var(--ink-secondary)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 150ms",
                }}
              >
                <FileText size={13} />
                PDF
              </button>
            )}
            <div
              style={{
                display: "flex",
                gap: 2,
                background: "var(--surface-hover)",
                borderRadius: 8,
                padding: 3,
              }}
            >
              {(
                [
                  ["grid", LayoutGrid],
                  ["list", List],
                ] as const
              ).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as "grid" | "list")}
                  aria-label={`${mode === "grid" ? "Grid" : "List"} view`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 28,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background:
                      viewMode === mode ? "var(--accent)" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon
                    size={14}
                    color={viewMode === mode ? "#fff" : "var(--ink-tertiary)"}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible competitor sound input */}
        {showCompetitorInput && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                background: "var(--surface)",
                borderRadius: 16,
                padding: "8px 8px 8px 20px",
                borderTop: "0.5px solid var(--card-edge)",
                alignItems: "center",
              }}
            >
              <Search size={18} color="var(--ink-tertiary)" />
              <input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setUrlWarning(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                aria-label="TikTok sound URL"
                placeholder="Paste a TikTok sound URL to track a competitor sound"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  color: "var(--ink)",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !searchInput.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting || !searchInput.trim() ? 0.6 : 1,
                  transition: "opacity 150ms",
                }}
              >
                {isSubmitting ? "Analyzing..." : "Analyze Sound"}
              </button>
            </div>
            {urlWarning && (
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "#FF9F0A",
                  marginTop: 8,
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {urlWarning}
              </div>
            )}
          </div>
        )}

        {/* Processing section */}
        {processing.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 16,
              }}
            >
              Processing
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {processing.map((entry) => {
                const cfg =
                  JOB_STATUS_CONFIG[entry.status] || JOB_STATUS_CONFIG.pending;
                const progressText =
                  entry.status === "refreshing"
                    ? "Updating stats..."
                    : entry.status === "scraping"
                      ? `${entry.videos_scraped} videos analysed`
                      : entry.videos_scraped > 0 && entry.videos_analyzed > 0
                        ? `${entry.videos_analyzed} / ${entry.videos_scraped} analyzed`
                        : entry.videos_scraped > 0
                          ? `${entry.videos_scraped} videos found`
                          : null;
                const snap = progressSnapshots.current.get(entry.job_id);
                const stallMs = snap ? Date.now() - snap.lastChanged : 0;
                const isStuck = snap
                  ? stallMs > stallThresholdMs(entry.status)
                  : false;
                return (
                  <div
                    key={entry.job_id}
                    style={{
                      background: "var(--surface)",
                      borderRadius: 16,
                      padding: "20px 24px",
                      borderTop: isStuck
                        ? "1px solid rgba(255,69,58,0.3)"
                        : "0.5px solid var(--card-edge)",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    {isStuck ? (
                      <AlertTriangle
                        size={20}
                        color="#FF453A"
                        style={{ flexShrink: 0 }}
                      />
                    ) : (
                      <Loader2
                        size={20}
                        color={cfg.color}
                        style={{
                          animation: "spin 1s linear infinite",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--ink)",
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.track_name || entry.sound_id || "Analyzing..."}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                            color: isStuck ? "#FF453A" : cfg.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {isStuck ? "Possibly stalled" : cfg.label}
                        </span>
                        {!isStuck && progressText && (
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            · {progressText}
                          </span>
                        )}
                        {isStuck && (
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            · No progress for {Math.floor(stallMs / 60000)} min
                          </span>
                        )}
                      </div>
                    </div>
                    <SourceBadge entry={entry} />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          color: "var(--ink-faint)",
                        }}
                      >
                        Started {timeAgo(entry.created_at)}
                      </span>
                      {isStuck && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await retrySoundAnalysis(entry.job_id);
                              progressSnapshots.current.delete(entry.job_id);
                              toast({
                                title: "Retrying analysis",
                                description:
                                  "Pipeline restarted from " + entry.status,
                              });
                              fetchList();
                            } catch (err: any) {
                              toast({
                                title: "Retry failed",
                                description: err.message,
                                variant: "destructive",
                              });
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "var(--accent)",
                            color: "#fff",
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "opacity 150ms",
                          }}
                        >
                          <RefreshCw size={12} />
                          Retry
                        </button>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setEntries((prev) =>
                            prev.filter((x) => x.job_id !== entry.job_id),
                          );
                          try {
                            await cancelSoundAnalysis(entry.job_id);
                          } catch {
                            fetchList();
                          }
                        }}
                        title="Cancel analysis"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background 150ms",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "var(--border-subtle)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "none";
                        }}
                      >
                        <X size={16} color="var(--ink-tertiary)" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed analyses */}
        {completed.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {sourceFilter === "roster"
                  ? "Roster Sounds"
                  : sourceFilter === "manual"
                    ? "Competitor Sounds"
                    : "All Analyses"}
              </h2>
            </div>

            {/* Grid view */}
            {viewMode === "grid" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                  gap: 16,
                }}
              >
                {completed.map((entry) => {
                  const s = entry.summary;
                  const vCfg =
                    velocityStatusConfig[s?.velocity_status || "active"] ||
                    velocityStatusConfig.active;
                  const StatusIcon = vCfg.Icon;
                  return (
                    <div
                      key={entry.job_id}
                      onClick={() =>
                        navigate(`/label/sound-intelligence/${entry.job_id}`)
                      }
                      style={{
                        background: "var(--surface)",
                        borderRadius: 16,
                        padding: "24px",
                        borderTop: "0.5px solid var(--card-edge)",
                        cursor: "pointer",
                        transition: "transform 150ms, background 150ms",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "translateY(-2px)";
                        (e.currentTarget as HTMLDivElement).style.background =
                          "var(--surface-hover)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "translateY(0)";
                        (e.currentTarget as HTMLDivElement).style.background =
                          "var(--surface)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {entry.cover_url ? (
                            <img
                              src={entry.cover_url}
                              alt={`${entry.track_name || "Track"} cover art`}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                objectFit: "cover",
                                flexShrink: 0,
                                background: "var(--border-subtle)",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                flexShrink: 0,
                                background: "var(--border-subtle)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Music size={18} color="var(--ink-tertiary)" />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 17,
                                fontWeight: 700,
                                color: "var(--ink)",
                                marginBottom: 4,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {entry.track_name || "Unknown Track"}
                            </div>
                            <div
                              style={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 13,
                                color: "var(--ink-tertiary)",
                              }}
                            >
                              {entry.artist_name || "Unknown Artist"}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 20,
                            background: `${vCfg.color}18`,
                          }}
                        >
                          <StatusIcon size={12} color={vCfg.color} />
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 11,
                              fontWeight: 600,
                              color: vCfg.color,
                              textTransform: "uppercase",
                            }}
                          >
                            {vCfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Source badge row */}
                      <div style={{ marginBottom: 12 }}>
                        <SourceBadge entry={entry} size="md" />
                      </div>

                      {entry.monitoring && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          <MonitoringBadge monitoring={entry.monitoring} />
                          <NextCheckCountdown
                            nextCheckAt={entry.monitoring.next_check_at}
                          />
                        </div>
                      )}

                      {s && (
                        <div
                          style={{
                            display: "flex",
                            gap: 20,
                            marginBottom: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          {[
                            {
                              label: "Videos",
                              value: String(s.videos_analyzed),
                            },
                            {
                              label: "Views",
                              value: formatNumber(s.total_views),
                            },
                            {
                              label: "Engagement",
                              value: `${s.engagement_rate.toFixed(1)}%`,
                            },
                            ...(s.share_rate != null
                              ? [
                                  {
                                    label: "Shares",
                                    value: `${s.share_rate.toFixed(1)}%`,
                                  },
                                ]
                              : []),
                            { label: "Peak", value: s.peak_day },
                          ].map((stat) => (
                            <div key={stat.label}>
                              <div
                                style={{
                                  fontFamily: '"DM Sans", sans-serif',
                                  fontSize: 11,
                                  color: "var(--ink-faint)",
                                  marginBottom: 2,
                                  textTransform: "uppercase",
                                }}
                              >
                                {stat.label}
                              </div>
                              <div
                                style={{
                                  fontFamily: '"DM Sans", sans-serif',
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: "var(--ink)",
                                }}
                              >
                                {stat.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {s?.winner_format && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: 8,
                                background: "var(--surface-hover)",
                              }}
                            >
                              <Trophy size={12} color="var(--accent)" />
                              <span
                                style={{
                                  fontFamily: '"DM Sans", sans-serif',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "var(--ink-secondary)",
                                }}
                              >
                                {s.winner_format}
                              </span>
                              {s.winner_multiplier > 0 && (
                                <span
                                  style={{
                                    fontFamily: '"DM Sans", sans-serif',
                                    fontSize: 11,
                                    color: "var(--accent)",
                                    fontWeight: 600,
                                  }}
                                >
                                  {s.winner_multiplier.toFixed(1)}x
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            color: "var(--ink-faint)",
                          }}
                        >
                          {entry.last_refresh_at ? (
                            <>
                              <RefreshCw size={10} />
                              Last refreshed {timeAgo(entry.last_refresh_at)}
                            </>
                          ) : entry.completed_at ? (
                            <>Analyzed {timeAgo(entry.completed_at)}</>
                          ) : (
                            timeAgo(entry.created_at)
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List view */}
            {viewMode === "list" && (
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 16,
                  borderTop: "0.5px solid var(--card-edge)",
                  overflow: "hidden",
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "36px 1.4fr 0.8fr 0.6fr 0.5fr 0.5fr 0.5fr 1fr 0.6fr 0.6fr",
                    gap: 8,
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {[
                    "",
                    "Track",
                    "Artist",
                    "Source",
                    "Videos",
                    "Views",
                    "Eng.",
                    "Winner Format",
                    "Status",
                    "Updated",
                  ].map((h) => (
                    <div
                      key={h}
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--ink-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {completed.map((entry) => {
                  const s = entry.summary;
                  const vCfg =
                    velocityStatusConfig[s?.velocity_status || "active"] ||
                    velocityStatusConfig.active;
                  const StatusIcon = vCfg.Icon;
                  return (
                    <div
                      key={entry.job_id}
                      onClick={() =>
                        navigate(`/label/sound-intelligence/${entry.job_id}`)
                      }
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "36px 1.4fr 0.8fr 0.6fr 0.5fr 0.5fr 0.5fr 1fr 0.6fr 0.6fr",
                        gap: 8,
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "background 150ms",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          "var(--overlay-subtle)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          "none";
                      }}
                    >
                      {entry.cover_url ? (
                        <img
                          src={entry.cover_url}
                          alt={`${entry.track_name || "Track"} cover art`}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            objectFit: "cover",
                            background: "var(--border-subtle)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: "var(--border-subtle)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Music size={14} color="var(--ink-tertiary)" />
                        </div>
                      )}
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.track_name || "Unknown Track"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink-tertiary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.artist_name || "\u2014"}
                      </div>
                      <div>
                        <SourceBadge entry={entry} />
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s?.videos_analyzed ?? "\u2014"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s ? formatNumber(s.total_views) : "\u2014"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s ? `${s.engagement_rate.toFixed(1)}%` : "\u2014"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {s?.winner_format ? (
                          <>
                            <Trophy
                              size={12}
                              color="var(--accent)"
                              style={{ flexShrink: 0 }}
                            />
                            <span
                              style={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 12,
                                color: "var(--ink-secondary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {s.winner_format}
                            </span>
                            {s.winner_multiplier > 0 && (
                              <span
                                style={{
                                  fontFamily: '"DM Sans", sans-serif',
                                  fontSize: 11,
                                  color: "var(--accent)",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {s.winner_multiplier.toFixed(1)}x
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ color: "var(--ink-faint)" }}>
                            {"\u2014"}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <StatusIcon size={12} color={vCfg.color} />
                        <span
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            fontWeight: 600,
                            color: vCfg.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {vCfg.label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          color: "var(--ink-faint)",
                        }}
                      >
                        {entry.last_refresh_at ? (
                          <>
                            <RefreshCw size={10} style={{ flexShrink: 0 }} />
                            {timeAgo(entry.last_refresh_at)}
                          </>
                        ) : entry.completed_at ? (
                          timeAgo(entry.completed_at)
                        ) : (
                          timeAgo(entry.created_at)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {!isLoading && fetchError && entries.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <AlertTriangle
              size={48}
              color="var(--ink-faint)"
              style={{ marginBottom: 16, margin: "0 auto 16px" }}
            />
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 16,
                color: "var(--ink-secondary)",
                maxWidth: 400,
                margin: "0 auto",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Failed to load analyses. Try refreshing the page.
            </div>
            <button
              onClick={() => {
                setFetchError(false);
                setIsLoading(true);
                fetchList();
              }}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !fetchError && entries.length === 0 && !isSubmitting && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Zap
              size={48}
              color="var(--ink-faint)"
              style={{ marginBottom: 16 }}
            />
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 16,
                color: "var(--ink-secondary)",
                maxWidth: 440,
                margin: "0 auto",
                lineHeight: 1.6,
                marginBottom: 8,
              }}
            >
              Sounds are automatically tracked when your roster artists post new
              music on TikTok.
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                color: "var(--ink-tertiary)",
                maxWidth: 440,
                margin: "0 auto",
                lineHeight: 1.5,
              }}
            >
              You can also track competitor sounds manually using the "Track
              Sound" button above.
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2
              size={32}
              color="var(--ink-tertiary)"
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LabelLayout from "@/pages/label/LabelLayout";
import {
  triggerSoundAnalysis,
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
} from "lucide-react";
import { exportOverviewPDF } from "@/utils/exportAnalysis";

/** Stall threshold: 3 min for refreshing (fast), 15 min for others */
function stallThresholdMs(status: string): number {
  return status === "refreshing" ? 3 * 60 * 1000 : 15 * 60 * 1000;
}

const velocityStatusConfig: Record<
  string,
  { label: string; color: string; Icon: any }
> = {
  accelerating: { label: "Accelerating", color: "#30D158", Icon: TrendingUp },
  active: { label: "Active", color: "#FF9F0A", Icon: Minus },
  declining: { label: "Declining", color: "#FF453A", Icon: TrendingDown },
};

export default function SoundIntelligenceOverview() {
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const [searchInput, setSearchInput] = useState("");
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track last-known progress for stall detection
  const progressSnapshots = useRef<
    Map<string, { scraped: number; analyzed: number; lastChanged: number }>
  >(new Map());
  const [entries, setEntries] = useState<ListAnalysisEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchList = useCallback(async () => {
    if (!labelId) return;
    try {
      const data = await listSoundAnalyses(labelId);
      setEntries(data);

      // Update progress snapshots for stall detection
      const now = Date.now();
      const snaps = progressSnapshots.current;
      for (const entry of data) {
        if (entry.status === "completed" || entry.status === "failed") {
          snaps.delete(entry.job_id);
          continue;
        }
        const prev = snaps.get(entry.job_id);
        if (
          !prev ||
          prev.scraped !== entry.videos_scraped ||
          prev.analyzed !== entry.videos_analyzed
        ) {
          // Progress changed — reset timer
          snaps.set(entry.job_id, {
            scraped: entry.videos_scraped,
            analyzed: entry.videos_analyzed,
            lastChanged: now,
          });
        }
        // else: no change, keep existing lastChanged timestamp
      }
    } catch {
      // Silently fail — loading state will clear, empty state shown
    } finally {
      setIsLoading(false);
    }
  }, [labelId]);

  // Initial load
  useEffect(() => {
    if (!labelId) {
      setIsLoading(false);
      return;
    }
    fetchList();
  }, [labelId, fetchList]);

  // Poll when there are processing entries
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

  const handleSubmit = async () => {
    if (!searchInput.trim() || isSubmitting) return;

    // Validate URL before submitting
    const validation = validateSoundUrl(searchInput.trim());
    if (!validation.valid) {
      setUrlWarning(validation.reason || "Invalid URL");
      return;
    }
    setUrlWarning(null);

    setIsSubmitting(true);
    try {
      const soundId = extractSoundId(searchInput.trim());

      // Check if already completed in current list
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
        // Add optimistic entry
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
          summary: null,
        };
        setEntries((prev) => [
          optimistic,
          ...prev.filter((e) => e.job_id !== res.job_id),
        ]);
      }
      setSearchInput("");
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

  const processing = entries.filter((e) =>
    (PROCESSING_STATUSES as readonly string[]).includes(e.status),
  );
  const completed = entries.filter((e) => e.status === "completed");

  return (
    <LabelLayout>
      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
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
            Analyze any TikTok sound to uncover format performance, creator
            tiers, and viral patterns
          </p>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 40 }}>
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
              placeholder="Paste a TikTok sound URL to analyze"
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
                      ? `${entry.videos_scraped} videos scraped`
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntries((prev) =>
                            prev.filter((x) => x.job_id !== entry.job_id),
                          );
                        }}
                        title="Dismiss"
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
            {/* Header with view toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                Completed Analyses
              </h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => {
                    exportOverviewPDF(entries);
                    toast({ title: "Summary PDF exported" });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "opacity 150ms",
                  }}
                >
                  <FileText size={13} />
                  Summary PDF
                </button>
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
                        color={
                          viewMode === mode ? "#fff" : "var(--ink-tertiary)"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                      "36px 1.8fr 1fr 0.6fr 0.7fr 0.7fr 0.6fr 0.6fr 1.1fr 0.7fr 0.7fr",
                    gap: 8,
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {[
                    "",
                    "Track",
                    "Artist",
                    "Videos",
                    "Views",
                    "Engagement",
                    "Shares",
                    "Peak",
                    "Winner Format",
                    "Status",
                    "Refreshed",
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
                          "36px 1.8fr 1fr 0.6fr 0.7fr 0.7fr 0.6fr 0.6fr 1.1fr 0.7fr 0.7fr",
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
                          alt=""
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
                        {entry.artist_name || "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s?.videos_analyzed ?? "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s ? formatNumber(s.total_views) : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s ? `${s.engagement_rate.toFixed(1)}%` : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s?.share_rate != null
                          ? `${s.share_rate.toFixed(1)}%`
                          : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink)",
                        }}
                      >
                        {s?.peak_day ?? "—"}
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
                          <span style={{ color: "var(--ink-faint)" }}>—</span>
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
                          marginBottom: 16,
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
                              alt=""
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
          </div>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && !isSubmitting && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Music
              size={48}
              color="var(--ink-faint)"
              style={{ marginBottom: 16 }}
            />
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 16,
                color: "var(--ink-secondary)",
                maxWidth: 400,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              No analyses yet. Paste a TikTok sound URL above to get started.
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
    </LabelLayout>
  );
}

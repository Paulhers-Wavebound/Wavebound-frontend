import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SoundAnalysis, SoundMonitoring } from "@/types/soundIntelligence";
import {
  getSoundAnalysis,
  formatNumber,
  JOB_STATUS_LABELS,
} from "@/utils/soundIntelligenceApi";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Download,
  FileText,
  Table2,
  Trash2,
  Star,
  Zap,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLabelPermissions } from "@/hooks/useLabelPermissions";
import {
  exportAnalysisPDF,
  exportFullAnalysisCSV,
  exportFormatBreakdownCSV,
} from "@/utils/exportAnalysis";
import { subscribeSound, unsubscribeSound } from "@/utils/soundIntelligenceApi";
import ConfirmDialog from "@/components/label/ConfirmDialog";
import SoundAlertBell from "@/components/sound-intelligence/SoundAlertBell";
import MonitoringTrendChart from "@/components/sound-intelligence/MonitoringTrendChart";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import RoleSelector from "@/components/label/RoleSelector";

// V2 Zone Components
import VerdictStrip from "@/components/sound-intelligence/VerdictStrip";
import ConversionChart from "@/components/sound-intelligence/ConversionChart";
import WinningFormatCard from "@/components/sound-intelligence/WinningFormatCard";
import PlaylistActivityFeed from "@/components/sound-intelligence/PlaylistActivityFeed";
import FormatBreakdownTable from "@/components/sound-intelligence/FormatBreakdownTable";
import CreatorActionList from "@/components/sound-intelligence/CreatorActionList";
import DeepDiveSection from "@/components/sound-intelligence/DeepDiveSection";

export default function SoundIntelligenceDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { canManage } = useLabelPermissions();
  const { labelId } = useUserProfile();
  const [analysis, setAnalysis] = useState<SoundAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useSetPageTitle(analysis?.track_name ?? null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [progress, setProgress] = useState<{
    videos_scraped: number;
    videos_analyzed: number;
  } | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [monitoring, setMonitoring] = useState<SoundMonitoring | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFormat, setExpandedFormat] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isOwnSound, setIsOwnSound] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subChecked, setSubChecked] = useState(false);
  const [source, setSource] = useState<"manual" | "auto_discovery" | null>(
    null,
  );
  const [artistHandle, setArtistHandle] = useState<string | null>(null);

  // Check subscription status + source on mount
  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        // Fetch subscription
        const { data: sub } = await supabase
          .from("sound_subscriptions")
          .select("id, is_own_sound")
          .eq("job_id", jobId)
          .maybeSingle();
        if (sub) {
          setSubscribed(true);
          setIsOwnSound(sub.is_own_sound ?? true);
        }
      } catch {
        // ignore — non-critical
      } finally {
        setSubChecked(true);
      }
    })();
    // Fetch source from job record
    (async () => {
      try {
        const { data: job } = await supabase
          .from("sound_intelligence_jobs")
          .select("source, artist_handle")
          .eq("id", jobId)
          .maybeSingle();
        if (job) {
          setSource(job.source ?? "manual");
          setArtistHandle(job.artist_handle ?? null);
        }
      } catch {
        // non-critical
      }
    })();
  }, [jobId]);

  const handleToggleSubscribe = async () => {
    if (!jobId) return;
    setSubscribing(true);
    try {
      if (subscribed) {
        await unsubscribeSound(jobId);
        setSubscribed(false);
        toast({ title: "Unsubscribed from sound" });
      } else {
        await subscribeSound(jobId, { is_own_sound: isOwnSound });
        setSubscribed(true);
        toast({ title: "Subscribed to sound" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const poll = useCallback(
    (id: string) => {
      stopPolling();
      setIsLoading(true);
      setError(null);

      const doFetch = async () => {
        try {
          const res = await getSoundAnalysis({ job_id: id });
          if (!res) return;
          if (res.user_count != null) setUserCount(res.user_count);
          if (res.monitoring !== undefined)
            setMonitoring(res.monitoring ?? null);
          const a: SoundAnalysis | null =
            res.formats || res.velocity
              ? res
              : res.status === "completed" && res.analysis
                ? res.analysis
                : null;

          if (a) {
            let coverUrl = a.cover_url;
            if (!coverUrl) {
              const { data: jobRow } = await supabase
                .from("sound_intelligence_jobs")
                .select("cover_url")
                .eq("id", id)
                .single();
              if (jobRow?.cover_url) {
                coverUrl = jobRow.cover_url;
              }
            }
            stopPolling();
            setAnalysis({
              ...a,
              cover_url: coverUrl,
              last_refresh_at: res.last_refresh_at ?? a.last_refresh_at,
              refresh_count: res.refresh_count ?? a.refresh_count,
            });
            setIsLoading(false);
            setLoadingStatus(null);
            setProgress(null);
          } else if (res.status === "failed") {
            stopPolling();
            setIsLoading(false);
            setError("Analysis failed.");
          } else {
            setLoadingStatus(res.status);
            if (res.progress) setProgress(res.progress);
          }
        } catch (err: any) {
          stopPolling();
          setIsLoading(false);
          setError(err.message);
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
        }
      };

      doFetch();
      pollRef.current = setInterval(doFetch, 5000);
    },
    [stopPolling],
  );

  useEffect(() => {
    if (jobId) poll(jobId);
    return stopPolling;
  }, [jobId]); // eslint-disable-line

  const handleExportPDF = async () => {
    if (!exportRef.current || !analysis) return;
    setExporting(true);

    const savedExpandedFormat = expandedFormat;
    setExpandedFormat(null);

    await new Promise((r) => setTimeout(r, 150));

    try {
      await exportAnalysisPDF(exportRef.current, analysis);
      toast({ title: "PDF exported" });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setExpandedFormat(savedExpandedFormat);
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!jobId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("sound_intelligence_jobs")
      .delete()
      .eq("id", jobId);
    if (error) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
      setDeleting(false);
      return;
    }
    toast({ title: `"${analysis?.track_name ?? "Analysis"}" deleted` });
    navigate("/label/sound-intelligence", { replace: true });
  };

  return (
    <>
      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
      >
        {/* Nav + Export */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/label/sound-intelligence")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                color: "var(--ink-tertiary)",
                cursor: "pointer",
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--ink-tertiary)")
              }
            >
              <ArrowLeft size={16} />
              Back to Sound Intelligence
            </button>
            {source && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background:
                    source === "auto_discovery"
                      ? "rgba(232,67,10,0.12)"
                      : "rgba(255,255,255,0.06)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    source === "auto_discovery"
                      ? "var(--accent)"
                      : "var(--ink-tertiary)",
                }}
              >
                {source === "auto_discovery" ? (
                  <Zap size={10} />
                ) : (
                  <Search size={10} />
                )}
                {source === "auto_discovery" ? "Roster Sound" : "Competitor"}
                {source === "auto_discovery" && artistHandle && (
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--ink-tertiary)",
                      marginLeft: 2,
                    }}
                  >
                    @{artistHandle.replace(/^@+/, "")}
                  </span>
                )}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleSelector />
            {analysis && subChecked && (
              <>
                {/* Subscribe / Own vs Competitor toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {subscribed && (
                    <div
                      style={{
                        display: "flex",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      {(["Own", "Competitor"] as const).map((type) => {
                        const active =
                          type === "Own" ? isOwnSound : !isOwnSound;
                        return (
                          <button
                            key={type}
                            onClick={async () => {
                              const newVal = type === "Own";
                              setIsOwnSound(newVal);
                              // Update in-place: unsub + resub
                              try {
                                await unsubscribeSound(jobId!);
                                await subscribeSound(jobId!, {
                                  is_own_sound: newVal,
                                });
                              } catch {
                                // revert on failure
                                setIsOwnSound(!newVal);
                              }
                            }}
                            style={{
                              padding: "5px 10px",
                              border: "none",
                              background: active
                                ? "rgba(232,67,10,0.15)"
                                : "transparent",
                              color: active
                                ? "var(--accent)"
                                : "var(--ink-tertiary)",
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 150ms",
                            }}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={handleToggleSubscribe}
                    disabled={subscribing}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: 9,
                      border: subscribed
                        ? "1px solid rgba(232,67,10,0.3)"
                        : "1px solid var(--border)",
                      background: subscribed
                        ? "rgba(232,67,10,0.1)"
                        : "var(--overlay-hover)",
                      color: subscribed
                        ? "var(--accent)"
                        : "var(--ink-secondary)",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: subscribing ? "wait" : "pointer",
                      transition: "all 150ms",
                      opacity: subscribing ? 0.6 : 1,
                    }}
                  >
                    <Star
                      size={14}
                      fill={subscribed ? "var(--accent)" : "none"}
                      stroke={
                        subscribed ? "var(--accent)" : "var(--ink-secondary)"
                      }
                    />
                    {subscribing
                      ? "..."
                      : subscribed
                        ? "Subscribed"
                        : "Subscribe"}
                  </button>
                </div>

                <ExportButton
                  icon={FileText}
                  label={exporting ? "Exporting..." : "PDF Report"}
                  onClick={handleExportPDF}
                  disabled={exporting}
                  accent
                />
                <ExportButton
                  icon={Table2}
                  label="Full CSV"
                  onClick={() => {
                    exportFullAnalysisCSV(analysis);
                    toast({ title: "CSV exported" });
                  }}
                />
                <ExportButton
                  icon={Download}
                  label="Formats CSV"
                  onClick={() => {
                    exportFormatBreakdownCSV(analysis.formats, analysis);
                    toast({ title: "CSV exported" });
                  }}
                />
              </>
            )}
            {labelId && <SoundAlertBell labelId={labelId} />}
          </div>
        </div>

        {/* Loading */}
        {isLoading && !analysis && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 20,
                padding: "48px 64px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderTop: "0.5px solid var(--card-edge)",
              }}
            >
              <Loader2
                size={40}
                color="var(--accent)"
                style={{
                  animation: "spin 1s linear infinite",
                  marginBottom: 20,
                }}
              />
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                {JOB_STATUS_LABELS[loadingStatus || "pending"]}
              </div>
              {progress &&
                (loadingStatus === "classifying" ||
                  loadingStatus === "synthesizing") && (
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 14,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    {progress.videos_analyzed > 0
                      ? `${progress.videos_analyzed} / ${progress.videos_scraped} analyzed`
                      : `${progress.videos_scraped} videos found`}
                  </div>
                )}
              {userCount != null && (
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "var(--ink-tertiary)",
                    marginTop: 4,
                  }}
                >
                  {formatNumber(userCount)} videos on this sound
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 16,
                color: "var(--ink-secondary)",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
            <button
              onClick={() => jobId && poll(jobId)}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ═══ V2 RESULTS LAYOUT ═══ */}
        {analysis && (
          <div
            ref={exportRef}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* ZONE 1 — The Verdict */}
            <div style={{ animation: "fadeInUp 0.35s ease both" }}>
              <VerdictStrip
                analysis={analysis}
                monitoring={monitoring}
                userCount={userCount}
              />
            </div>

            {/* Real-Time Monitoring (if active) */}
            {jobId &&
              monitoring &&
              monitoring.monitoring_interval !== "paused" && (
                <div
                  style={{
                    animation: "fadeInUp 0.35s ease both",
                    animationDelay: "0.05s",
                  }}
                >
                  <MonitoringTrendChart jobId={jobId} monitoring={monitoring} />
                </div>
              )}

            {/* ZONE 2 — Conversion Signal */}
            <div
              data-pdf-stack
              style={{
                display: "flex",
                gap: 16,
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.08s",
              }}
            >
              <ConversionChart
                velocity={analysis.velocity}
                lifecycle={analysis.lifecycle}
                spotifySnapshots={analysis.spotify_snapshots}
              />
              <WinningFormatCard
                winner={analysis.winner}
                hookAnalysis={analysis.hook_analysis}
                duration={analysis.duration}
                postingHours={analysis.posting_hours}
              />
            </div>

            {/* Playlist Activity */}
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.12s",
              }}
            >
              <PlaylistActivityFeed
                playlists={analysis.playlist_tracking ?? []}
              />
            </div>

            {/* ZONE 3 — Spend Decision */}
            <div
              data-pdf-stack
              style={{
                display: "flex",
                gap: 16,
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.16s",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: "1 1 60%" }}>
                <FormatBreakdownTable
                  formats={analysis.formats}
                  expandedFormat={expandedFormat}
                  onToggle={(i) =>
                    setExpandedFormat((prev) => (prev === i ? null : i))
                  }
                  songDuration={analysis.avg_duration_seconds}
                  spikeFormat={monitoring?.spike_format}
                  formatSparkScores={analysis.format_spark_scores}
                />
              </div>
              <CreatorActionList
                topVideos={analysis.top_videos}
                trackName={analysis.track_name}
              />
            </div>

            {/* ZONE 4 — Deep Dive (collapsible) */}
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.2s",
              }}
            >
              <DeepDiveSection analysis={analysis} monitoring={monitoring} />
            </div>

            {analysis.unclassified_count != null &&
              analysis.unclassified_count > 0 && (
                <p
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "var(--ink-faint)",
                    textAlign: "center",
                    padding: "8px 0",
                  }}
                >
                  {analysis.unclassified_count} video
                  {analysis.unclassified_count !== 1 ? "s" : ""} couldn't be
                  classified by AI and will be retried automatically.
                </p>
              )}
          </div>
        )}

        {/* Delete analysis — admin only */}
        {analysis && canManage && (
          <div
            style={{
              marginTop: 40,
              padding: "20px 24px",
              background: "var(--surface)",
              borderRadius: 16,
              border: "1px dashed rgba(255,69,58,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#FF453A",
                  marginBottom: 2,
                }}
              >
                Delete Analysis
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-tertiary)",
                }}
              >
                Permanently remove this analysis and all associated data.
              </div>
            </div>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,69,58,0.3)",
                background: "rgba(255,69,58,0.08)",
                color: "#FF453A",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: deleting ? "wait" : "pointer",
                opacity: deleting ? 0.5 : 1,
                transition: "all 150ms",
              }}
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      {/* Export overlay */}
      {exporting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Loader2
            size={32}
            color="var(--accent)"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(255,255,255,0.87)",
            }}
          >
            Generating PDF...
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${analysis?.track_name || "this analysis"}"?`}
        description="This removes all data from this analysis permanently. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

function ExportButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 9,
        border: accent ? "none" : "1px solid var(--border)",
        background: accent ? "var(--accent)" : "var(--overlay-hover)",
        color: accent ? "#fff" : "var(--ink-secondary)",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "wait" : "pointer",
        transition: "all 150ms",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

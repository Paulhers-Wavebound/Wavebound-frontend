import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LabelLayout from "@/pages/label/LabelLayout";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLabelPermissions } from "@/hooks/useLabelPermissions";
import {
  exportAnalysisPDF,
  exportFullAnalysisCSV,
  exportFormatBreakdownCSV,
} from "@/utils/exportAnalysis";
import SoundHeader from "@/components/sound-intelligence/SoundHeader";
import HeroStatsRow from "@/components/sound-intelligence/HeroStatsRow";
import VelocityChart from "@/components/sound-intelligence/VelocityChart";
import WinnerCard from "@/components/sound-intelligence/WinnerCard";
import FormatTrendsChart from "@/components/sound-intelligence/FormatTrendsChart";
import FormatBreakdownTable from "@/components/sound-intelligence/FormatBreakdownTable";
import HookDurationSection from "@/components/sound-intelligence/HookDurationSection";
import TopPerformersGrid from "@/components/sound-intelligence/TopPerformersGrid";
import CreatorTiersSection from "@/components/sound-intelligence/CreatorTiersSection";
import GeoSpreadSection from "@/components/sound-intelligence/GeoSpreadSection";
import LifecycleCard from "@/components/sound-intelligence/LifecycleCard";
import PostingHoursChart from "@/components/sound-intelligence/PostingHoursChart";
import ConfirmDialog from "@/components/label/ConfirmDialog";
import SoundAlertBell from "@/components/sound-intelligence/SoundAlertBell";
import MonitoringTrendChart from "@/components/sound-intelligence/MonitoringTrendChart";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function SoundIntelligenceDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { canManage } = useLabelPermissions();
  const { labelId } = useUserProfile();
  const [analysis, setAnalysis] = useState<SoundAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [expandedTier, setExpandedTier] = useState<number | null>(null);
  const [expandedGeo, setExpandedGeo] = useState<number | null>(null);
  const [disabledTrendLines, setDisabledTrendLines] = useState<Set<string>>(
    new Set(),
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

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
            // cover_url lives on the jobs table, not in the analysis JSONB
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

    // Save and reset interactive state for clean PDF capture
    const savedExpandedFormat = expandedFormat;
    const savedExpandedTier = expandedTier;
    const savedExpandedGeo = expandedGeo;
    const savedDisabledTrendLines = disabledTrendLines;

    setExpandedFormat(null);
    setExpandedTier(null);
    setExpandedGeo(null);
    setDisabledTrendLines(new Set());

    // Wait for React to flush state changes to DOM
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
      // Restore interactive state
      setExpandedFormat(savedExpandedFormat);
      setExpandedTier(savedExpandedTier);
      setExpandedGeo(savedExpandedGeo);
      setDisabledTrendLines(savedDisabledTrendLines);
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
    toast({ title: `"${name}" deleted` });
    navigate("/label/sound-intelligence", { replace: true });
  };

  return (
    <LabelLayout>
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

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {analysis && (
              <>
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

        {/* Results */}
        {analysis && (
          <div
            ref={exportRef}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={{ animation: "fadeInUp 0.35s ease both" }}>
              <SoundHeader analysis={analysis} monitoring={monitoring} />
            </div>
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.05s",
              }}
            >
              <HeroStatsRow analysis={analysis} userCount={userCount} />
            </div>
            {jobId &&
              monitoring &&
              monitoring.monitoring_interval !== "paused" && (
                <div
                  style={{
                    animation: "fadeInUp 0.35s ease both",
                    animationDelay: "0.07s",
                  }}
                >
                  <MonitoringTrendChart jobId={jobId} />
                </div>
              )}
            <div
              data-pdf-stack
              style={{
                display: "flex",
                gap: 16,
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.1s",
              }}
            >
              <VelocityChart
                velocity={analysis.velocity}
                lifecycle={analysis.lifecycle}
              />
              <WinnerCard winner={analysis.winner} />
            </div>
            {analysis.posting_hours && (
              <div
                style={{
                  animation: "fadeInUp 0.35s ease both",
                  animationDelay: "0.12s",
                }}
              >
                <PostingHoursChart postingHours={analysis.posting_hours} />
              </div>
            )}
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.15s",
              }}
            >
              <FormatTrendsChart
                formats={analysis.formats}
                velocity={analysis.velocity}
                disabledLines={disabledTrendLines}
                onToggleLine={(name) =>
                  setDisabledTrendLines((prev) => {
                    const next = new Set(prev);
                    next.has(name) ? next.delete(name) : next.add(name);
                    return next;
                  })
                }
                onSoloLine={(name) =>
                  setDisabledTrendLines((prev) => {
                    const allOthers = new Set(
                      analysis.formats
                        .map((f) => f.name)
                        .filter((n) => n !== name),
                    );
                    // If already soloed on this format, show all
                    if (
                      prev.size === allOthers.size &&
                      [...allOthers].every((n) => prev.has(n))
                    ) {
                      return new Set();
                    }
                    return allOthers;
                  })
                }
              />
            </div>
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.2s",
              }}
            >
              <FormatBreakdownTable
                formats={analysis.formats}
                expandedFormat={expandedFormat}
                onToggle={(i) =>
                  setExpandedFormat((prev) => (prev === i ? null : i))
                }
                songDuration={analysis.avg_duration_seconds}
                spikeFormat={monitoring?.spike_format}
              />
            </div>
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.25s",
              }}
            >
              <HookDurationSection
                hookAnalysis={analysis.hook_analysis}
                duration={analysis.duration}
              />
            </div>
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.3s",
              }}
            >
              <TopPerformersGrid topVideos={analysis.top_videos} />
            </div>
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.35s",
              }}
            >
              <CreatorTiersSection
                tiers={analysis.creator_tiers}
                expandedTier={expandedTier}
                onToggle={(i) =>
                  setExpandedTier((prev) => (prev === i ? null : i))
                }
              />
            </div>
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.4s",
              }}
            >
              <GeoSpreadSection
                geography={analysis.geography}
                expandedGeo={expandedGeo}
                onToggle={(i) =>
                  setExpandedGeo((prev) => (prev === i ? null : i))
                }
              />
            </div>
            <div
              style={{
                animation: "fadeInUp 0.35s ease both",
                animationDelay: "0.45s",
              }}
            >
              <LifecycleCard lifecycle={analysis.lifecycle} />
            </div>
          </div>
        )}

        {/* Delete analysis — admin only, outside export ref so it doesn't appear in PDF */}
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

      {/* Export overlay — hides DOM manipulation from user */}
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
    </LabelLayout>
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

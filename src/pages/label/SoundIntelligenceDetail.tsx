import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  SoundAnalysis,
  SoundCanonicalGroup,
  SoundMonitoring,
} from "@/types/soundIntelligence";
import {
  extractSoundId,
  getSoundAnalysis,
  formatNumber,
  JOB_STATUS_LABELS,
  listSoundAnalyses,
  ListAnalysisEntry,
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
  GitMerge,
  Music,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import {
  addExistingJobToSoundGroup,
  createSoundGroupFromUrls,
  extractSoundUrls,
  getSoundGroupForJob,
  listSoundGroups,
} from "@/utils/soundGroupApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// V2 Zone Components
import VerdictStrip from "@/components/sound-intelligence/VerdictStrip";
import ConversionChart from "@/components/sound-intelligence/ConversionChart";
import WinningFormatCard from "@/components/sound-intelligence/WinningFormatCard";
import PlaylistActivityFeed from "@/components/sound-intelligence/PlaylistActivityFeed";
import FormatBreakdownTable from "@/components/sound-intelligence/FormatBreakdownTable";
import CreatorActionList from "@/components/sound-intelligence/CreatorActionList";
import DeepDiveSection from "@/components/sound-intelligence/DeepDiveSection";

type SoundJobMeta = {
  sound_id: string | null;
  sound_url: string | null;
  track_name: string | null;
  artist_name: string | null;
  album_name: string | null;
  cover_url: string | null;
  status: string | null;
  videos_scraped: number | null;
  videos_analyzed: number | null;
  created_at: string | null;
  completed_at: string | null;
  last_refresh_at: string | null;
  refresh_count: number | null;
  source: "manual" | "auto_discovery" | null;
  artist_handle: string | null;
  tracking_expires_at: string | null;
};

const LIST_STATUSES = new Set<ListAnalysisEntry["status"]>([
  "pending",
  "scraping",
  "classifying",
  "synthesizing",
  "refreshing",
  "completed",
  "failed",
]);

function coerceListStatus(
  status: string | null | undefined,
): ListAnalysisEntry["status"] {
  return LIST_STATUSES.has(status as ListAnalysisEntry["status"])
    ? (status as ListAnalysisEntry["status"])
    : "completed";
}

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
  const [jobMeta, setJobMeta] = useState<SoundJobMeta | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeInput, setMergeInput] = useState("");
  const [merging, setMerging] = useState(false);
  const [soundGroups, setSoundGroups] = useState<SoundCanonicalGroup[]>([]);
  const [mergeEntries, setMergeEntries] = useState<ListAnalysisEntry[]>([]);
  const [currentGroup, setCurrentGroup] = useState<SoundCanonicalGroup | null>(
    null,
  );

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
          .select(
            "sound_id,sound_url,track_name,artist_name,album_name,cover_url,status,videos_scraped,videos_analyzed,created_at,completed_at,last_refresh_at,refresh_count,source,artist_handle,tracking_expires_at",
          )
          .eq("id", jobId)
          .maybeSingle();
        if (job) {
          const jobSource =
            job.source === "auto_discovery" ? "auto_discovery" : "manual";
          setSource(jobSource);
          setArtistHandle(job.artist_handle ?? null);
          setJobMeta({
            sound_id: job.sound_id ?? null,
            sound_url: job.sound_url ?? null,
            track_name: job.track_name ?? null,
            artist_name: job.artist_name ?? null,
            album_name: job.album_name ?? null,
            cover_url: job.cover_url ?? null,
            status: job.status ?? null,
            videos_scraped: job.videos_scraped ?? null,
            videos_analyzed: job.videos_analyzed ?? null,
            created_at: job.created_at ?? null,
            completed_at: job.completed_at ?? null,
            last_refresh_at: job.last_refresh_at ?? null,
            refresh_count: job.refresh_count ?? null,
            source: jobSource,
            artist_handle: job.artist_handle ?? null,
            tracking_expires_at: job.tracking_expires_at ?? null,
          });
        }
      } catch {
        // non-critical
      }
    })();
  }, [jobId]);

  useEffect(() => {
    if (!mergeOpen || !labelId) return;
    let isActive = true;

    Promise.all([
      listSoundGroups(labelId),
      listSoundAnalyses(labelId).catch(() => [] as ListAnalysisEntry[]),
    ])
      .then(([groups, entries]) => {
        if (!isActive) return;
        setSoundGroups(groups);
        setMergeEntries(entries);
      })
      .catch(() => {
        if (!isActive) return;
        setSoundGroups([]);
      });

    return () => {
      isActive = false;
    };
  }, [labelId, mergeOpen]);

  useEffect(() => {
    if (!jobId || !labelId) {
      setCurrentGroup(null);
      return;
    }

    let isActive = true;
    getSoundGroupForJob(jobId, labelId)
      .then((group) => {
        if (isActive) setCurrentGroup(group);
      })
      .catch(() => {
        if (isActive) setCurrentGroup(null);
      });

    return () => {
      isActive = false;
    };
  }, [jobId, labelId]);

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
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Request failed";
          stopPolling();
          setIsLoading(false);
          setError(message);
          toast({
            title: "Error",
            description: message,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast({
        title: "Export failed",
        description: message,
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

  const currentSoundId =
    jobMeta?.sound_id ||
    (jobMeta?.sound_url ? extractSoundId(jobMeta.sound_url) : null) ||
    (analysis?.sound_url ? extractSoundId(analysis.sound_url) : null);
  const currentSoundUrl =
    jobMeta?.sound_url ||
    analysis?.sound_url ||
    (currentSoundId ? `https://www.tiktok.com/music/${currentSoundId}` : "");
  const currentAliasLabel =
    jobMeta?.track_name || analysis?.track_name || currentSoundId || null;
  const mergeableGroups = soundGroups.filter(
    (group) =>
      !group.members.some(
        (member) =>
          member.job_id === jobId || member.sound_id === currentSoundId,
      ),
  );

  const buildCurrentEntry = (): ListAnalysisEntry | null => {
    if (!jobId || !currentSoundId) return null;
    const currentSource = jobMeta?.source ?? source ?? "manual";

    return {
      job_id: jobId,
      sound_id: currentSoundId,
      cover_url: jobMeta?.cover_url ?? analysis?.cover_url ?? null,
      track_name: jobMeta?.track_name ?? analysis?.track_name ?? "",
      artist_name: jobMeta?.artist_name ?? analysis?.artist_name ?? "",
      album_name: jobMeta?.album_name ?? analysis?.album_name ?? "",
      status: coerceListStatus(jobMeta?.status),
      videos_scraped:
        jobMeta?.videos_scraped ?? jobMeta?.videos_analyzed ?? analysis?.videos_analyzed ?? 0,
      videos_analyzed: jobMeta?.videos_analyzed ?? analysis?.videos_analyzed ?? 0,
      created_at: jobMeta?.created_at ?? analysis?.created_at ?? new Date().toISOString(),
      completed_at:
        jobMeta?.completed_at ?? (analysis ? analysis.created_at : null),
      last_refresh_at: jobMeta?.last_refresh_at ?? analysis?.last_refresh_at ?? null,
      refresh_count: jobMeta?.refresh_count ?? analysis?.refresh_count ?? 0,
      monitoring,
      summary: analysis
        ? {
            engagement_rate: analysis.avg_share_rate,
            share_rate: analysis.actual_share_rate,
            winner_format: analysis.winner?.format ?? "",
            winner_multiplier: analysis.winner?.multiplier ?? 0,
            total_views: analysis.total_views,
            velocity_status: analysis.status,
            peak_day: analysis.peak_day,
            format_count: analysis.formats?.length ?? 0,
            videos_analyzed: analysis.videos_analyzed,
          }
        : null,
      artist_handle: jobMeta?.artist_handle ?? artistHandle,
      source: currentSource,
      tracking_expires_at: jobMeta?.tracking_expires_at ?? null,
    };
  };

  const entriesWithCurrentSound = () => {
    const currentEntry = buildCurrentEntry();
    if (!currentEntry) return mergeEntries;
    return [
      currentEntry,
      ...mergeEntries.filter((entry) => entry.job_id !== currentEntry.job_id),
    ];
  };

  const handleAddToGroup = async (group: SoundCanonicalGroup) => {
    if (!labelId || !jobId || !currentSoundId || !currentSoundUrl) return;
    setMerging(true);

    try {
      await addExistingJobToSoundGroup({
        groupId: group.id,
        labelId,
        jobId,
        soundId: currentSoundId,
        soundUrl: currentSoundUrl,
        aliasLabel: currentAliasLabel,
      });
      toast({ title: "Sound ID added to merged sound" });
      setMergeOpen(false);
      navigate(`/label/sound-intelligence/groups/${group.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({
        title: "Could not add sound ID",
        description: message,
        variant: "destructive",
      });
    } finally {
      setMerging(false);
    }
  };

  const handleCreateMergedSound = async () => {
    if (!labelId || !currentSoundId || !currentSoundUrl) return;
    const urls = [currentSoundUrl, ...extractSoundUrls(mergeInput)].filter(
      (url): url is string => Boolean(url),
    );
    const seenSoundIds = new Set<string>();
    const uniqueUrls = urls.filter((url) => {
      const soundId = extractSoundId(url);
      if (!soundId || seenSoundIds.has(soundId)) return false;
      seenSoundIds.add(soundId);
      return true;
    });

    if (uniqueUrls.length < 2) {
      toast({
        title: "Add another sound ID",
        description:
          "Paste at least one other TikTok /music/ link to create a merged sound.",
        variant: "destructive",
      });
      return;
    }

    setMerging(true);
    try {
      const artistName = jobMeta?.artist_name || analysis?.artist_name;
      const group = await createSoundGroupFromUrls({
        labelId,
        urls: uniqueUrls,
        name:
          currentAliasLabel && artistName
            ? `${currentAliasLabel} - ${artistName}`
            : currentAliasLabel ?? undefined,
        existingEntries: entriesWithCurrentSound(),
      });
      toast({ title: "Merged sound created" });
      setMergeInput("");
      setMergeOpen(false);
      navigate(`/label/sound-intelligence/groups/${group.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({
        title: "Could not create merged sound",
        description: message,
        variant: "destructive",
      });
    } finally {
      setMerging(false);
    }
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
            {currentGroup && (
              <button
                onClick={() =>
                  navigate(`/label/sound-intelligence/groups/${currentGroup.id}`)
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  maxWidth: 280,
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(232,67,10,0.24)",
                  background: "rgba(232,67,10,0.10)",
                  color: "var(--accent)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 650,
                  cursor: "pointer",
                }}
                title={currentGroup.name}
              >
                <GitMerge size={10} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Merged: {currentGroup.name}
                </span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                  icon={GitMerge}
                  label={currentGroup ? "View Merge" : "Merge"}
                  onClick={() => {
                    if (currentGroup) {
                      navigate(
                        `/label/sound-intelligence/groups/${currentGroup.id}`,
                      );
                      return;
                    }
                    setMergeOpen(true);
                  }}
                  disabled={
                    !currentGroup &&
                    (!labelId || !currentSoundId || !currentSoundUrl)
                  }
                />
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

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent
          className="max-w-2xl border-0 p-0"
          style={{
            background: "var(--surface)",
            color: "var(--ink)",
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          <div style={{ padding: 24 }}>
            <DialogHeader>
              <DialogTitle
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "var(--ink)",
                }}
              >
                Merge sound ID
              </DialogTitle>
              <DialogDescription
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "var(--ink-tertiary)",
                }}
              >
                Attach this TikTok sound ID to a canonical sound, or create a
                new merged sound with another /music/ link.
              </DialogDescription>
            </DialogHeader>

            <div
              style={{
                marginTop: 18,
                padding: 12,
                borderRadius: 12,
                background: "var(--bg-subtle)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {jobMeta?.cover_url || analysis?.cover_url ? (
                <img
                  src={jobMeta?.cover_url || analysis?.cover_url || ""}
                  alt={`${currentAliasLabel || "Track"} cover art`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    objectFit: "cover",
                    background: "var(--surface-hover)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--surface-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Music size={16} color="var(--ink-tertiary)" />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentAliasLabel || "Current sound"}
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  {currentSoundId || "No sound ID found"}
                </div>
              </div>
            </div>

            {mergeableGroups.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ink-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 10,
                  }}
                >
                  Existing merged sounds
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  {mergeableGroups.slice(0, 6).map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleAddToGroup(group)}
                      disabled={merging}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--bg-subtle)",
                        color: "var(--ink)",
                        textAlign: "left",
                        cursor: merging ? "wait" : "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <GitMerge
                          size={13}
                          color="var(--accent)"
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 13,
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {group.name}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          color: "var(--ink-tertiary)",
                        }}
                      >
                        {group.members.length} sound IDs
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                Create new merged sound
              </div>
              <Textarea
                value={mergeInput}
                onChange={(event) => setMergeInput(event.target.value)}
                placeholder="https://www.tiktok.com/music/Track-123..."
                style={{
                  minHeight: 110,
                  background: "var(--bg-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--ink)",
                  fontFamily: '"DM Sans", sans-serif',
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <button
                  onClick={() => setMergeOpen(false)}
                  disabled={merging}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--ink-secondary)",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: merging ? "wait" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMergedSound}
                  disabled={merging || extractSoundUrls(mergeInput).length === 0}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: "var(--accent)",
                    color: "rgba(255,255,255,0.92)",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: merging ? "wait" : "pointer",
                    opacity:
                      merging || extractSoundUrls(mergeInput).length === 0
                        ? 0.6
                        : 1,
                  }}
                >
                  {merging ? "Merging..." : "Create merge"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
  icon: LucideIcon;
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

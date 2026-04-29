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
  GitMerge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { exportOverviewPDF } from "@/utils/exportAnalysis";
import MonitoringBadge from "@/components/sound-intelligence/MonitoringBadge";
import NextCheckCountdown from "@/components/sound-intelligence/NextCheckCountdown";
import SoundAlertBell from "@/components/sound-intelligence/SoundAlertBell";
import {
  buildSoundGroupSummary,
  SoundGroupSummary,
} from "@/utils/soundGroupAggregation";
import {
  autoMergeHighConfidenceSoundDuplicates,
  createSoundGroupFromUrls,
  extractSoundUrls,
  getGroupedJobIds,
  listSoundDuplicateCandidates,
  listSoundGroups,
  setSoundDuplicateCandidateDecision,
  soundCandidateName,
  soundCandidateToUrls,
} from "@/utils/soundGroupApi";
import type {
  SoundCanonicalGroup,
  SoundDuplicateCandidate,
} from "@/types/soundIntelligence";

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
  { label: string; color: string; Icon: LucideIcon }
> = {
  accelerating: { label: "Accelerating", color: "#30D158", Icon: TrendingUp },
  active: { label: "Active", color: "#FF9F0A", Icon: Minus },
  declining: { label: "Declining", color: "#FF453A", Icon: TrendingDown },
};

type SourceFilter = "all" | "roster" | "manual";

function duplicateMatchLabel(matchType: SoundDuplicateCandidate["match_type"]) {
  switch (matchType) {
    case "isrc":
      return "ISRC";
    case "spotify_track_id":
      return "Spotify track";
    case "spotify_id":
      return "Spotify";
    case "title_artist":
      return "Title + artist";
    default:
      return "Metadata";
  }
}

function candidateKey(candidate: SoundDuplicateCandidate): string {
  return `${candidate.match_type}:${candidate.match_key}`;
}

export default function SoundIntelligenceOverview() {
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const [searchInput, setSearchInput] = useState("");
  const [groupNameInput, setGroupNameInput] = useState("");
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompetitorInput, setShowCompetitorInput] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const progressSnapshots = useRef<
    Map<string, { scraped: number; analyzed: number; lastChanged: number }>
  >(new Map());
  const [entries, setEntries] = useState<ListAnalysisEntry[]>([]);
  const [soundGroups, setSoundGroups] = useState<SoundCanonicalGroup[]>([]);
  const [duplicateCandidates, setDuplicateCandidates] = useState<
    SoundDuplicateCandidate[]
  >([]);
  const [autoMerging, setAutoMerging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchList = useCallback(async () => {
    if (!labelId) return;
    try {
      const [data, groups, candidates] = await Promise.all([
        listSoundAnalyses(labelId),
        listSoundGroups(labelId),
        listSoundDuplicateCandidates(labelId).catch(() => []),
      ]);
      setEntries(data);
      setSoundGroups(groups);
      setDuplicateCandidates(candidates);

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

  const groupedJobIds = useMemo(
    () => getGroupedJobIds(soundGroups),
    [soundGroups],
  );
  const ungroupedEntries = useMemo(
    () => entries.filter((entry) => !groupedJobIds.has(entry.job_id)),
    [entries, groupedJobIds],
  );
  const groupedSummaries = useMemo(
    () =>
      soundGroups
        .map((group) => buildSoundGroupSummary(group, entries))
        .filter((summary) => summary.totalCount > 0),
    [soundGroups, entries],
  );

  const groupMatchesSource = useCallback(
    (group: SoundCanonicalGroup) => {
      if (sourceFilter === "all") return true;
      const groupEntries = group.members
        .map((member) => entries.find((entry) => entry.job_id === member.job_id))
        .filter((entry): entry is ListAnalysisEntry => Boolean(entry));
      if (sourceFilter === "roster") {
        return groupEntries.some((entry) => entry.source === "auto_discovery");
      }
      return groupEntries.some((entry) => entry.source !== "auto_discovery");
    },
    [entries, sourceFilter],
  );

  const visibleGroupSummaries = useMemo(
    () =>
      groupedSummaries.filter((summary) => groupMatchesSource(summary.group)),
    [groupMatchesSource, groupedSummaries],
  );

  const processing = filteredEntries.filter((e) =>
    (PROCESSING_STATUSES as readonly string[]).includes(e.status),
  );
  const completed = filteredEntries.filter(
    (e) => e.status === "completed" && !groupedJobIds.has(e.job_id),
  );

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

  const canonicalItems = useMemo(() => {
    const groupItems = groupedSummaries.map((summary) => ({
      type: "group" as const,
      group: summary.group,
    }));
    const entryItems = ungroupedEntries.map((entry) => ({
      type: "entry" as const,
      entry,
    }));
    return [...groupItems, ...entryItems];
  }, [groupedSummaries, ungroupedEntries]);

  const rosterCount = canonicalItems.filter((item) => {
    if (item.type === "entry") return item.entry.source === "auto_discovery";
    return item.group.members.some((member) =>
      entries.some(
        (entry) =>
          entry.job_id === member.job_id && entry.source === "auto_discovery",
      ),
    );
  }).length;
  const manualCount = canonicalItems.filter((item) => {
    if (item.type === "entry") return item.entry.source !== "auto_discovery";
    return item.group.members.some((member) =>
      entries.some(
        (entry) =>
          entry.job_id === member.job_id && entry.source !== "auto_discovery",
      ),
    );
  }).length;
  const allCount = canonicalItems.length;
  const pastedSoundUrls = useMemo(
    () => extractSoundUrls(searchInput),
    [searchInput],
  );
  const visibleDuplicateCandidates = useMemo(
    () => duplicateCandidates.slice(0, 4),
    [duplicateCandidates],
  );
  const autoMergeCandidateCount = useMemo(
    () => duplicateCandidates.filter((candidate) => candidate.can_auto_merge).length,
    [duplicateCandidates],
  );

  const handleSubmit = async () => {
    if (!searchInput.trim() || isSubmitting) return;

    const soundUrls = extractSoundUrls(searchInput);
    const isMergedSubmit = soundUrls.length > 1;
    const validation = isMergedSubmit
      ? { valid: true as const }
      : validateSoundUrl(searchInput.trim());
    if (!validation.valid) {
      setUrlWarning(validation.reason || "Invalid URL");
      return;
    }
    if (!labelId) {
      setUrlWarning("Your label profile is still loading. Try again in a moment.");
      return;
    }
    if (isMergedSubmit && soundUrls.length < 2) {
      setUrlWarning("Paste at least two distinct TikTok sound URLs to merge.");
      return;
    }
    setUrlWarning(null);

    setIsSubmitting(true);
    try {
      if (isMergedSubmit) {
        const group = await createSoundGroupFromUrls({
          labelId,
          urls: soundUrls,
          name: groupNameInput,
          existingEntries: entries,
        });
        await fetchList();
        navigate(`/label/sound-intelligence/groups/${group.id}`);
        setSearchInput("");
        setGroupNameInput("");
        setShowCompetitorInput(false);
        return;
      }

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
      setGroupNameInput("");
      setShowCompetitorInput(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMergeCandidate = async (candidate: SoundDuplicateCandidate) => {
    if (!labelId || isSubmitting) return;
    const urls = soundCandidateToUrls(candidate);
    if (urls.length < 2) {
      toast({
        title: "Not enough URLs",
        description: "This suggestion does not have enough sound URLs to merge.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const group = await createSoundGroupFromUrls({
        labelId,
        urls,
        name: soundCandidateName(candidate),
        existingEntries: entries,
      });
      await fetchList();
      navigate(`/label/sound-intelligence/groups/${group.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({
        title: "Could not merge suggestion",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCandidateDecision = async (
    candidate: SoundDuplicateCandidate,
    status: "dismissed" | "snoozed",
  ) => {
    if (!labelId) return;

    const previous = duplicateCandidates;
    setDuplicateCandidates((prev) =>
      prev.filter((item) => candidateKey(item) !== candidateKey(candidate)),
    );

    try {
      const snoozedUntil =
        status === "snoozed"
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null;
      await setSoundDuplicateCandidateDecision({
        labelId,
        matchType: candidate.match_type,
        matchKey: candidate.match_key,
        status,
        snoozedUntil,
      });
      toast({
        title: status === "snoozed" ? "Suggestion snoozed" : "Suggestion dismissed",
        description:
          status === "snoozed"
            ? "It will come back in 7 days if the IDs are still unmerged."
            : "This match will stay hidden for this label.",
      });
    } catch (err: unknown) {
      setDuplicateCandidates(previous);
      const message = err instanceof Error ? err.message : "Request failed";
      toast({
        title: "Could not update suggestion",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleAutoMergeRoster = async () => {
    if (!labelId || autoMerging || autoMergeCandidateCount === 0) return;
    setAutoMerging(true);

    try {
      const result = await autoMergeHighConfidenceSoundDuplicates(labelId);
      await fetchList();
      toast({
        title:
          result.created_count > 0
            ? "Roster sounds merged"
            : "No roster merges created",
        description:
          result.created_count > 0
            ? `${result.created_count} high-confidence ${
                result.created_count === 1 ? "match" : "matches"
              } grouped into canonical sounds.`
            : "No auto-ready candidates were still eligible.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({
        title: "Could not auto-merge roster sounds",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAutoMerging(false);
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
                { key: "all", label: "All", count: allCount },
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
                display: "grid",
                gridTemplateColumns: "20px minmax(0, 1fr) auto",
                gap: 12,
                background: "var(--surface)",
                borderRadius: 16,
                padding: "14px 14px 14px 20px",
                borderTop: "0.5px solid var(--card-edge)",
                alignItems: "start",
              }}
            >
              <Search
                size={18}
                color="var(--ink-tertiary)"
                style={{ marginTop: 10 }}
              />
              <div style={{ minWidth: 0 }}>
                {pastedSoundUrls.length > 1 && (
                  <input
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    aria-label="Merged sound name"
                    placeholder="Merged sound name (optional)"
                    style={{
                      width: "100%",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      outline: "none",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 14,
                      color: "var(--ink)",
                      padding: "9px 12px",
                      marginBottom: 8,
                    }}
                  />
                )}
                <textarea
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setUrlWarning(null);
                  }}
                  aria-label="TikTok sound URLs"
                  placeholder="Paste one TikTok sound URL, or multiple /music/ links on separate lines to merge IDs under one sound"
                  rows={pastedSoundUrls.length > 1 ? 4 : 1}
                  style={{
                    width: "100%",
                    minHeight: pastedSoundUrls.length > 1 ? 104 : 42,
                    resize: "vertical",
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 15,
                    lineHeight: 1.45,
                    color: "var(--ink)",
                    padding: "9px 0",
                  }}
                />
                {pastedSoundUrls.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      color: "var(--ink-tertiary)",
                      marginTop: 6,
                    }}
                  >
                    <GitMerge size={13} color="var(--accent)" />
                    {pastedSoundUrls.length} sound IDs will be merged into one
                    canonical monitored sound.
                  </div>
                )}
              </div>
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
                {isSubmitting
                  ? pastedSoundUrls.length > 1
                    ? "Merging..."
                    : "Analyzing..."
                  : pastedSoundUrls.length > 1
                    ? "Merge IDs"
                    : "Analyze Sound"}
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
                            } catch (err: unknown) {
                              const message =
                                err instanceof Error
                                  ? err.message
                                  : "Request failed";
                              toast({
                                title: "Retry failed",
                                description: message,
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

        {/* Suggested merges */}
        {visibleDuplicateCandidates.length > 0 && (
          <div style={{ marginBottom: 40 }}>
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
                Suggested Merges
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "var(--ink-faint)",
                  }}
                >
                  Same song signal from Spotify, ISRC, or metadata
                </span>
                {autoMergeCandidateCount > 0 && (
                  <button
                    onClick={handleAutoMergeRoster}
                    disabled={autoMerging || isSubmitting}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(48,209,88,0.24)",
                      background: "rgba(48,209,88,0.10)",
                      color: "#30D158",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: autoMerging ? "wait" : "pointer",
                      opacity: autoMerging || isSubmitting ? 0.6 : 1,
                    }}
                  >
                    {autoMerging ? (
                      <Loader2
                        size={13}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Zap size={13} />
                    )}
                    Auto-merge roster ({autoMergeCandidateCount})
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 16,
              }}
            >
              {visibleDuplicateCandidates.map((candidate) => (
                <DuplicateCandidateCard
                  key={candidateKey(candidate)}
                  candidate={candidate}
                  disabled={isSubmitting || autoMerging}
                  onMerge={() => handleMergeCandidate(candidate)}
                  onSnooze={() => handleCandidateDecision(candidate, "snoozed")}
                  onDismiss={() =>
                    handleCandidateDecision(candidate, "dismissed")
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Merged canonical sounds */}
        {visibleGroupSummaries.length > 0 && (
          <div style={{ marginBottom: 40 }}>
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
                Merged Sounds
              </h2>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-faint)",
                }}
              >
                Combined read, individual sound ID filters inside
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 16,
              }}
            >
              {visibleGroupSummaries.map((summary) => (
                <MergedSoundCard
                  key={summary.group.id}
                  summary={summary}
                  onClick={() =>
                    navigate(
                      `/label/sound-intelligence/groups/${summary.group.id}`,
                    )
                  }
                />
              ))}
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

function MergedSoundCard({
  summary,
  onClick,
}: {
  summary: SoundGroupSummary;
  onClick: () => void;
}) {
  const vCfg =
    velocityStatusConfig[summary.velocityStatus] || velocityStatusConfig.active;
  const StatusIcon = vCfg.Icon;

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 24,
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
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.background = "var(--surface)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {summary.coverUrl ? (
            <img
              src={summary.coverUrl}
              alt={`${summary.trackName} cover art`}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
                background: "var(--surface-hover)",
              }}
            />
          ) : (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                flexShrink: 0,
                background: "var(--surface-hover)",
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
              {summary.trackName}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-tertiary)",
              }}
            >
              {summary.artistName}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            alignSelf: "flex-start",
            padding: "4px 10px",
            borderRadius: 8,
            background: "rgba(232,67,10,0.12)",
            color: "var(--accent)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          <GitMerge size={12} />
          {summary.totalCount} IDs
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {summary.soundIds.slice(0, 4).map((soundId) => (
          <span
            key={soundId}
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              background: "var(--bg-subtle)",
              color: "var(--ink-tertiary)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {soundId}
          </span>
        ))}
        {summary.soundIds.length > 4 && (
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              background: "var(--bg-subtle)",
              color: "var(--ink-faint)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            +{summary.soundIds.length - 4}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Videos", value: formatNumber(summary.videosAnalyzed) },
          { label: "Views", value: formatNumber(summary.totalViews) },
          {
            label: "Engagement",
            value:
              summary.engagementRate == null
                ? "-"
                : `${summary.engagementRate.toFixed(1)}%`,
          },
          {
            label: "Shares",
            value:
              summary.shareRate == null
                ? "-"
                : `${summary.shareRate.toFixed(1)}%`,
          },
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                fontWeight: 700,
                color: vCfg.color,
                textTransform: "uppercase",
              }}
            >
              {vCfg.label}
            </span>
          </div>
          {summary.winnerFormat && (
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
              {summary.winnerFormat}
              {summary.winnerMultiplier > 0
                ? ` ${summary.winnerMultiplier.toFixed(1)}x`
                : ""}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-faint)",
            flexShrink: 0,
          }}
        >
          {summary.lastUpdated ? timeAgo(summary.lastUpdated) : "Queued"}
        </span>
      </div>
    </div>
  );
}

function DuplicateCandidateCard({
  candidate,
  disabled,
  onMerge,
  onSnooze,
  onDismiss,
}: {
  candidate: SoundDuplicateCandidate;
  disabled: boolean;
  onMerge: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 24,
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {candidate.cover_url ? (
            <img
              src={candidate.cover_url}
              alt={`${candidate.track_name || "Track"} cover art`}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
                background: "var(--surface-hover)",
              }}
            />
          ) : (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                flexShrink: 0,
                background: "var(--surface-hover)",
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
              {soundCandidateName(candidate)}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-tertiary)",
              }}
            >
              {candidate.job_count} IDs · {formatNumber(candidate.total_views)} views
            </div>
          </div>
        </div>
        <div
          style={{
            alignSelf: "flex-start",
            padding: "4px 10px",
            borderRadius: 8,
            background: "rgba(48,209,88,0.12)",
            color: "#30D158",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {Math.round(candidate.confidence * 100)}%
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 12,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          color: "var(--ink-tertiary)",
        }}
      >
        <GitMerge size={13} color="var(--accent)" />
        Matched by {duplicateMatchLabel(candidate.match_type)}
        {candidate.can_auto_merge && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 7px",
              borderRadius: 7,
              background: "rgba(48,209,88,0.12)",
              color: "#30D158",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <Zap size={10} />
            Roster auto-ready
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 18,
        }}
      >
        {candidate.sound_ids.slice(0, 5).map((soundId) => (
          <span
            key={soundId}
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              background: "var(--bg-subtle)",
              color: "var(--ink-tertiary)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {soundId}
          </span>
        ))}
        {candidate.sound_ids.length > 5 && (
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              background: "var(--bg-subtle)",
              color: "var(--ink-faint)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            +{candidate.sound_ids.length - 5}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <button
          onClick={onMerge}
          disabled={disabled}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 9,
            border: "none",
            background: "var(--accent)",
            color: "rgba(255,255,255,0.92)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            cursor: disabled ? "wait" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <GitMerge size={14} />
          Merge suggestion
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onSnooze}
            disabled={disabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "8px 10px",
              borderRadius: 9,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink-tertiary)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 650,
              cursor: disabled ? "wait" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <Clock size={13} />
            Snooze
          </button>
          <button
            onClick={onDismiss}
            disabled={disabled}
            aria-label="Dismiss merge suggestion"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink-tertiary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: disabled ? "wait" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  GitMerge,
  Loader2,
  Music,
  Plus,
  Table2,
} from "lucide-react";
import type {
  SoundCanonicalGroup,
  SoundMonitoring,
} from "@/types/soundIntelligence";
import {
  formatNumber,
  listSoundAnalyses,
  timeAgo,
  ListAnalysisEntry,
} from "@/utils/soundIntelligenceApi";
import {
  addSoundGroupMembers,
  extractSoundUrls,
  getSoundGroupBundle,
} from "@/utils/soundGroupApi";
import {
  aggregateSoundGroupAnalysis,
  SoundGroupAnalysisMember,
} from "@/utils/soundGroupAggregation";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import { toast } from "@/hooks/use-toast";
import {
  exportAnalysisPDF,
  exportFormatBreakdownCSV,
  exportFullAnalysisCSV,
} from "@/utils/exportAnalysis";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import MonitoringTrendChart from "@/components/sound-intelligence/MonitoringTrendChart";
import VerdictStrip from "@/components/sound-intelligence/VerdictStrip";
import ConversionChart from "@/components/sound-intelligence/ConversionChart";
import WinningFormatCard from "@/components/sound-intelligence/WinningFormatCard";
import PlaylistActivityFeed from "@/components/sound-intelligence/PlaylistActivityFeed";
import FormatBreakdownTable from "@/components/sound-intelligence/FormatBreakdownTable";
import CreatorActionList from "@/components/sound-intelligence/CreatorActionList";
import DeepDiveSection from "@/components/sound-intelligence/DeepDiveSection";

function getMemberLabel(
  member: SoundGroupAnalysisMember,
  index: number,
): string {
  return (
    member.entry?.track_name ||
    member.analysis?.track_name ||
    member.member.alias_label ||
    `Sound ID ${index + 1}`
  );
}

export default function SoundGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const [group, setGroup] = useState<SoundCanonicalGroup | null>(null);
  const [members, setMembers] = useState<SoundGroupAnalysisMember[]>([]);
  const [entries, setEntries] = useState<ListAnalysisEntry[]>([]);
  const [monitoringByJobId, setMonitoringByJobId] = useState<
    Map<string, SoundMonitoring | null>
  >(new Map());
  const [selectedSoundId, setSelectedSoundId] = useState<string>("all");
  const [expandedFormat, setExpandedFormat] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useSetPageTitle(group?.name ?? "Merged sound");

  const load = useCallback(async () => {
    if (!groupId || !labelId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [loadedGroup, loadedEntries] = await Promise.all([
        getSoundGroupBundle(groupId, labelId),
        listSoundAnalyses(labelId),
      ]);

      if (!loadedGroup) {
        setError("Merged sound not found.");
        setGroup(null);
        setMembers([]);
        return;
      }

      const loadedMembers = loadedGroup.members;
      setGroup(loadedGroup.group);
      setEntries(loadedEntries);
      setMembers(
        loadedMembers.map(({ monitoring: _monitoring, ...member }) => member),
      );
      setMonitoringByJobId(
        new Map(
          loadedMembers.map((member) => [
            member.member.job_id,
            member.monitoring ?? null,
          ]),
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [groupId, labelId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedMember = useMemo(() => {
    if (selectedSoundId === "all") return null;
    return (
      members.find((member) => member.member.sound_id === selectedSoundId) ??
      null
    );
  }, [members, selectedSoundId]);

  const analysis = useMemo(() => {
    if (!group) return null;
    if (selectedMember) return selectedMember.analysis;
    return aggregateSoundGroupAnalysis(group, members);
  }, [group, members, selectedMember]);

  const groupMonitoring = useMemo<SoundMonitoring | null>(() => {
    const active = Array.from(monitoringByJobId.values()).filter(
      (monitoring): monitoring is SoundMonitoring =>
        Boolean(monitoring && monitoring.monitoring_interval !== "paused"),
    );
    if (active.length === 0) return null;

    const isIntensive = active.some(
      (monitoring) => monitoring.monitoring_interval === "intensive",
    );
    const newest = [...active].sort((a, b) =>
      (b.last_monitored_at ?? "").localeCompare(a.last_monitored_at ?? ""),
    )[0];

    return {
      monitoring_interval: isIntensive ? "intensive" : "standard",
      last_monitored_at: newest?.last_monitored_at ?? null,
      next_check_at: newest?.next_check_at ?? null,
      spike_format:
        active.find((monitoring) => monitoring.spike_format)?.spike_format ??
        null,
      intensive_since:
        active.find((monitoring) => monitoring.intensive_since)
          ?.intensive_since ?? null,
    };
  }, [monitoringByJobId]);

  const selectedMonitoring = selectedMember
    ? monitoringByJobId.get(selectedMember.member.job_id) ?? null
    : groupMonitoring;
  const selectedJobId = selectedMember?.member.job_id ?? null;
  const completedCount = members.filter((member) => member.analysis).length;
  const totalViews = members.reduce(
    (sum, member) => sum + (member.analysis?.total_views ?? 0),
    0,
  );
  const totalVideos = members.reduce(
    (sum, member) => sum + (member.analysis?.videos_analyzed ?? 0),
    0,
  );

  const handleExportPDF = async () => {
    if (!exportRef.current || !analysis) return;
    setExporting(true);
    const savedExpandedFormat = expandedFormat;
    setExpandedFormat(null);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      await exportAnalysisPDF(exportRef.current, analysis);
      toast({ title: "PDF exported" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast({ title: "Export failed", description: message, variant: "destructive" });
    } finally {
      setExpandedFormat(savedExpandedFormat);
      setExporting(false);
    }
  };

  const handleAddIds = async () => {
    if (!group || !labelId) return;
    const urls = extractSoundUrls(addInput);
    setAdding(true);

    try {
      await addSoundGroupMembers({
        group,
        labelId,
        urls,
        existingEntries: entries,
      });
      toast({ title: "Sound IDs added" });
      setAddInput("");
      setAddOpen(false);
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({ title: "Could not add IDs", description: message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
          <Loader2
            size={32}
            color="var(--accent)"
            style={{ animation: "spin 1s linear infinite" }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  if (error || !group) {
    return (
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            color: "var(--ink-secondary)",
            marginBottom: 16,
          }}
        >
          {error ?? "Merged sound not found."}
        </p>
        <button
          onClick={() => navigate("/label/sound-intelligence")}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "none",
            background: "var(--accent)",
            color: "rgba(255,255,255,0.92)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to Sound Intelligence
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            gap: 16,
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
          >
            <ArrowLeft size={16} />
            Back to Sound Intelligence
          </button>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 9,
                border: "1px solid var(--border)",
                background: "var(--overlay-hover)",
                color: "var(--ink-secondary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={14} />
              Add IDs
            </button>
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
          </div>
        </div>

        <section
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            borderTop: "0.5px solid var(--card-edge)",
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", gap: 16, minWidth: 0 }}>
              {group.cover_url || analysis?.cover_url ? (
                <img
                  src={group.cover_url || analysis?.cover_url || ""}
                  alt={`${group.name} cover art`}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    objectFit: "cover",
                    background: "var(--surface-hover)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: "var(--surface-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Music size={24} color="var(--ink-tertiary)" />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "rgba(232,67,10,0.12)",
                    color: "var(--accent)",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  <GitMerge size={12} />
                  Merged Sound
                </div>
                <h1
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 28,
                    lineHeight: 1.15,
                    fontWeight: 750,
                    color: "var(--ink)",
                    margin: 0,
                    marginBottom: 6,
                  }}
                >
                  {group.name}
                </h1>
                <p
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    color: "var(--ink-tertiary)",
                    margin: 0,
                  }}
                >
                  {group.artist_name || analysis?.artist_name || "Canonical TikTok sound"} ·{" "}
                  {completedCount}/{group.members.length} IDs analyzed
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
              <HeaderStat label="Sound IDs" value={String(group.members.length)} />
              <HeaderStat label="Videos" value={formatNumber(totalVideos)} />
              <HeaderStat label="Views" value={formatNumber(totalViews)} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setSelectedSoundId("all")}
              style={filterButtonStyle(selectedSoundId === "all")}
            >
              All IDs
            </button>
            {members.map((member, index) => (
              <button
                key={member.member.id}
                onClick={() => setSelectedSoundId(member.member.sound_id)}
                style={filterButtonStyle(
                  selectedSoundId === member.member.sound_id,
                )}
                title={getMemberLabel(member, index)}
              >
                {member.member.sound_id}
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            borderTop: "0.5px solid var(--card-edge)",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr 0.5fr 0.5fr 0.5fr 0.6fr 0.3fr",
              gap: 12,
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {["Sound ID", "Label", "Videos", "Views", "Status", "Updated", ""].map(
              (header) => (
                <div
                  key={header}
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ink-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {header}
                </div>
              ),
            )}
          </div>
          {members.map((member, index) => (
            <div
              key={member.member.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr 0.5fr 0.5fr 0.5fr 0.6fr 0.3fr",
                gap: 12,
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                background:
                  selectedSoundId === member.member.sound_id
                    ? "var(--overlay-subtle)"
                    : "transparent",
              }}
            >
              <button
                onClick={() => setSelectedSoundId(member.member.sound_id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  textAlign: "left",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                {member.member.sound_id}
              </button>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {getMemberLabel(member, index)}
              </div>
              <CellValue value={member.analysis?.videos_analyzed} />
              <CellValue value={member.analysis?.total_views} format />
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  color: member.analysis ? "var(--green)" : "var(--yellow)",
                  textTransform: "uppercase",
                }}
              >
                {member.analysis ? "Ready" : member.entry?.status ?? "Queued"}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-faint)",
                }}
              >
                {member.entry?.last_refresh_at
                  ? timeAgo(member.entry.last_refresh_at)
                  : member.entry?.completed_at
                    ? timeAgo(member.entry.completed_at)
                    : member.entry?.created_at
                      ? timeAgo(member.entry.created_at)
                      : "-"}
              </div>
              <button
                onClick={() =>
                  navigate(`/label/sound-intelligence/${member.member.job_id}`)
                }
                aria-label={`Open raw analysis for ${member.member.sound_id}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--ink-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ExternalLink size={13} />
              </button>
            </div>
          ))}
        </section>

        {analysis ? (
          <div
            ref={exportRef}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <VerdictStrip
              analysis={analysis}
              monitoring={selectedMonitoring}
              userCount={analysis.total_videos_on_sound ?? null}
            />

            {selectedMonitoring &&
              selectedMonitoring.monitoring_interval !== "paused" &&
              (selectedMember ? selectedJobId : group && labelId) && (
                <MonitoringTrendChart
                  jobId={selectedMember ? selectedJobId ?? undefined : undefined}
                  groupId={!selectedMember ? group.id : undefined}
                  labelId={!selectedMember ? labelId ?? undefined : undefined}
                  monitoring={selectedMonitoring}
                  scopeLabel={!selectedMember ? "All sound IDs" : undefined}
                />
              )}

            <div data-pdf-stack style={{ display: "flex", gap: 16 }}>
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

            <PlaylistActivityFeed playlists={analysis.playlist_tracking ?? []} />

            <div
              data-pdf-stack
              style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
            >
              <div style={{ flex: "1 1 60%" }}>
                <FormatBreakdownTable
                  formats={analysis.formats}
                  expandedFormat={expandedFormat}
                  onToggle={(i) =>
                    setExpandedFormat((prev) => (prev === i ? null : i))
                  }
                  songDuration={analysis.avg_duration_seconds}
                  spikeFormat={selectedMonitoring?.spike_format}
                  formatSparkScores={analysis.format_spark_scores}
                />
              </div>
              <CreatorActionList
                topVideos={analysis.top_videos}
                trackName={analysis.track_name}
              />
            </div>

            <DeepDiveSection analysis={analysis} monitoring={selectedMonitoring} />
          </div>
        ) : (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              borderTop: "0.5px solid var(--card-edge)",
              padding: "48px 24px",
              textAlign: "center",
              fontFamily: '"DM Sans", sans-serif',
              color: "var(--ink-secondary)",
            }}
          >
            Analysis is still running for these sound IDs. This merged view will
            fill in as each ID completes.
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="max-w-xl border-0 p-0"
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
                Add TikTok sound IDs
              </DialogTitle>
              <DialogDescription
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "var(--ink-tertiary)",
                }}
              >
                Paste full TikTok /music/ links. Each ID stays filterable, but
                the top-level read aggregates them into this one sound.
              </DialogDescription>
            </DialogHeader>

            <Textarea
              value={addInput}
              onChange={(event) => setAddInput(event.target.value)}
              placeholder="https://www.tiktok.com/music/Track-123...\nhttps://www.tiktok.com/music/Track-456..."
              style={{
                minHeight: 120,
                marginTop: 18,
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
                marginTop: 18,
              }}
            >
              <button
                onClick={() => setAddOpen(false)}
                disabled={adding}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--ink-secondary)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: adding ? "wait" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddIds}
                disabled={adding || extractSoundUrls(addInput).length === 0}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--accent)",
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: adding ? "wait" : "pointer",
                  opacity:
                    adding || extractSoundUrls(addInput).length === 0 ? 0.6 : 1,
                }}
              >
                {adding ? "Adding..." : "Add IDs"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 18,
          fontWeight: 700,
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CellValue({ value, format }: { value?: number | null; format?: boolean }) {
  return (
    <div
      style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 13,
        color: "var(--ink)",
      }}
    >
      {value == null ? "-" : format ? formatNumber(value) : value.toLocaleString()}
    </div>
  );
}

function filterButtonStyle(active: boolean): CSSProperties {
  return {
    padding: "7px 12px",
    borderRadius: 10,
    border: active ? "1px solid rgba(232,67,10,0.45)" : "1px solid var(--border)",
    background: active ? "rgba(232,67,10,0.14)" : "var(--bg-subtle)",
    color: active ? "var(--accent)" : "var(--ink-secondary)",
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
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
        color: accent ? "rgba(255,255,255,0.92)" : "var(--ink-secondary)",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

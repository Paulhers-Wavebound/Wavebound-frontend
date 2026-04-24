import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  FileText,
  Film,
  Flame,
  Heart,
  Link as LinkIcon,
  Loader2,
  Mic,
  Scissors,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { toast } from "@/hooks/use-toast";
import BriefCard from "@/components/fan-briefs/BriefCard";
import type { FanBrief } from "@/types/fanBriefs";
import type { Angle, OutputType, QueueItem } from "./types";
import {
  ANGLE_FAMILY_COLOR,
  ANGLE_FAMILY_LABEL,
  MOCK_ARTISTS,
  OUTPUT_TYPE_LABEL,
} from "./mockData";

// Shared with /label/fan-briefs. Kept inline here rather than extracted to a
// util so the two routes stay independently editable during the v2 prototype
// phase; align signatures when the merge-path PR lands (see
// docs/handoffs/2026-04-23_factory-v2-merge-path.md).
const BRIEFS_SELECT = `
  *,
  content_segments (
    peak_evidence,
    hook_source,
    content_catalog (
      live_venue,
      content_type,
      title,
      duration_seconds
    )
  )
`;
const pendingBriefsQueryKey = (labelId: string | null) => [
  "fan-briefs",
  labelId,
  "content",
];

interface CreateViewProps {
  angles: Angle[];
  draftAngleId: string | null;
  draftPreset: OutputType | null;
  onDraftConsumed: () => void;
  onGenerate: (item: QueueItem) => void;
}

const PRESETS: {
  key: OutputType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  {
    key: "short_form",
    label: "Short-form clip",
    description: "15-60s vertical cut — IG Reels / TikTok / Shorts",
    icon: Scissors,
  },
  {
    key: "mini_doc",
    label: "Mini-doc",
    description: "1-20 min long-form — YouTube, editorial tone",
    icon: Film,
  },
  {
    key: "sensational",
    label: "Sensational angle",
    description: "High-hook narrative edit — reserve for sourced stories",
    icon: Flame,
  },
  {
    key: "self_help",
    label: "Self-help tie-in",
    description: "Follow-friendly edit with a takeaway",
    icon: Heart,
  },
  {
    key: "tour_recap",
    label: "Tour recap",
    description: "Post-show recap from crowd or BTS footage",
    icon: Mic,
  },
  {
    key: "fan_brief",
    label: "Fan brief edit",
    description: "From a pending fan-submitted brief",
    icon: Sparkles,
  },
  {
    key: "link_video",
    label: "Link → video",
    description: "Paste a TikTok/YT ref, we mirror the vibe",
    icon: LinkIcon,
  },
];

const PENDING_FAN_BRIEFS = [
  { id: "fb-1", title: "Maren anxiety routine — fan-submitted v3" },
  { id: "fb-2", title: "Folami voice memos — retake from fan clip" },
  { id: "fb-3", title: "Papi 4am journaling — quote-card request" },
  { id: "fb-4", title: "Gracie phone-demo BTS — fan-stitched v2" },
];

export default function CreateView({
  angles,
  draftAngleId,
  draftPreset,
  onDraftConsumed,
  onGenerate,
}: CreateViewProps) {
  const [activePreset, setActivePreset] = useState<OutputType | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string>("art-papi");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("av-native");
  const [tuneOpen, setTuneOpen] = useState(false);

  // Track the brief being mutated so the right BriefCard shows a pending state.
  const [mutatingBriefId, setMutatingBriefId] = useState<string | null>(null);

  // Preset-specific form state (kept simple for mock)
  const [angleId, setAngleId] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">(
    "9:16",
  );
  const [durationSec, setDurationSec] = useState(30);
  const [musicBed, setMusicBed] = useState<"native" | "original" | "cue_a">(
    "native",
  );
  const [storyStructure, setStoryStructure] = useState<
    "3_act" | "5_chapter" | "chronological" | "investigative"
  >("3_act");
  const [researchDepth, setResearchDepth] = useState<
    "Light" | "Deep" | "Investigative"
  >("Deep");
  const [numAngles, setNumAngles] = useState(3);
  const [narrator, setNarrator] = useState<"artist" | "neutral" | "fan">(
    "neutral",
  );
  const [pacing, setPacing] = useState<"steady" | "cold_open" | "builder">(
    "builder",
  );
  const [toneSlider, setToneSlider] = useState(40);
  const [tourHighlight, setTourHighlight] = useState<
    "crowd" | "setlist" | "bts"
  >("crowd");
  const [fanBriefId, setFanBriefId] = useState<string>("");
  const [fanBriefEdit, setFanBriefEdit] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkExtracted, setLinkExtracted] = useState(false);

  // Fan-brief wizard state. Renders a 3-knob picker (artist + source + count)
  // before the BriefCard list. wizardDone flips when the user hits "Show
  // briefs"; the breadcrumb's "Change filters" button flips it back.
  const [briefArtistHandle, setBriefArtistHandle] = useState<string>("");
  const [briefSource, setBriefSource] = useState<
    "live_performance" | "podcasts" | ""
  >("");
  const [briefCount, setBriefCount] = useState(5);
  const [wizardDone, setWizardDone] = useState(false);

  // Live fetch of pending fan briefs for this label. Shares the query key with
  // /label/fan-briefs so mutations in either route update both caches. The
  // fallback `PENDING_FAN_BRIEFS` keeps the preset usable when there's no
  // label scope or zero pending briefs.
  const { labelId } = useUserProfile();
  const queryClient = useQueryClient();
  const pendingBriefsQuery = useQuery({
    queryKey: pendingBriefsQueryKey(labelId),
    enabled: !!labelId,
    refetchInterval: 30_000,
    staleTime: 15_000,
    queryFn: async (): Promise<FanBrief[]> => {
      const { data, error } = await supabase
        .from("fan_briefs")
        .select(BRIEFS_SELECT)
        .eq("label_id", labelId!)
        .eq("status", "pending")
        .is("rendered_clip_url", null)
        .order("confidence_score", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as FanBrief[];
    },
  });

  const livePendingBriefs = pendingBriefsQuery.data ?? [];
  const usingLiveBriefs = livePendingBriefs.length > 0;

  // Label roster — populates the wizard's artist dropdown. Same shape as
  // LabelRoster.tsx:51-71 but trimmed to the columns the picker needs and
  // restricted to rows with a usable handle (briefs are joined by handle).
  const labelArtistsQuery = useQuery({
    queryKey: ["label-artists-v2-create", labelId],
    enabled: !!labelId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<
      { id: string; artist_name: string; artist_handle: string }[]
    > => {
      const { data, error } = await supabase
        .from("artist_intelligence")
        .select("id, artist_name, artist_handle")
        .eq("label_id", labelId!)
        .not("artist_handle", "is", null)
        .order("artist_name");
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        artist_name: string;
        artist_handle: string;
      }[];
    },
  });
  const labelArtists = labelArtistsQuery.data ?? [];

  // Filter the pending pool by the wizard's selections, then cap at the
  // requested clip count. Matches Live = content_type='live_performance';
  // Podcasts = interview OR podcast.
  const filteredBriefs = useMemo(() => {
    if (!briefArtistHandle || !briefSource) return [];
    return livePendingBriefs
      .filter((b) => {
        if (b.artist_handle !== briefArtistHandle) return false;
        if (briefSource === "live_performance") {
          return b.content_type === "live_performance";
        }
        return b.content_type === "interview" || b.content_type === "podcast";
      })
      .slice(0, briefCount);
  }, [livePendingBriefs, briefArtistHandle, briefSource, briefCount]);

  // Total matches before slicing — used in the breadcrumb counter.
  const totalMatches = useMemo(() => {
    if (!briefArtistHandle || !briefSource) return 0;
    return livePendingBriefs.filter((b) => {
      if (b.artist_handle !== briefArtistHandle) return false;
      if (briefSource === "live_performance") {
        return b.content_type === "live_performance";
      }
      return b.content_type === "interview" || b.content_type === "podcast";
    }).length;
  }, [livePendingBriefs, briefArtistHandle, briefSource]);

  // Approve a live brief: flip status to 'approved' on fan_briefs (backend
  // rendering fires off that), optimistically remove it from the pending
  // cache, and push a matching item into the v2 Review queue tagged with the
  // brief id so Kill-with-feedback can cascade an archive back.
  const handleApproveBrief = async (briefId: string) => {
    const brief = livePendingBriefs.find((b) => b.id === briefId);
    if (!brief) return;
    setMutatingBriefId(briefId);
    const approvedAt = new Date().toISOString();
    const { error } = await supabase
      .from("fan_briefs")
      .update({ status: "approved", approved_at: approvedAt })
      .eq("id", briefId);
    setMutatingBriefId(null);
    if (error) {
      toast({
        title: "Failed to approve",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    queryClient.setQueryData<FanBrief[]>(
      pendingBriefsQueryKey(labelId),
      (prev) => (prev ?? []).filter((b) => b.id !== briefId),
    );
    const hook = brief.modified_hook || brief.hook_text;
    const short = hook.length > 56 ? `${hook.slice(0, 56)}…` : hook;
    onGenerate({
      id: `q-fb-${briefId}`,
      artistId: `fb-${brief.artist_id}`,
      artistDisplayName: `@${brief.artist_handle}`,
      artistDisplayHandle: brief.artist_handle,
      title: `Fan brief · @${brief.artist_handle} — ${short || "(no hook)"}`,
      outputType: "fan_brief",
      source: "fan_brief",
      status: "pending",
      risk: "low",
      riskNotes: [],
      thumbKind: "brief",
      createdAt: "just now",
      fanBriefId: briefId,
    });
    toast({
      title: "Brief approved — rendering",
      description: "Queued into Review. Schedule it when ready.",
    });
  };

  const handleSkipBrief = async (briefId: string) => {
    setMutatingBriefId(briefId);
    const { error } = await supabase
      .from("fan_briefs")
      .update({ status: "skipped" })
      .eq("id", briefId);
    setMutatingBriefId(null);
    if (error) {
      toast({
        title: "Failed to skip",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    queryClient.setQueryData<FanBrief[]>(
      pendingBriefsQueryKey(labelId),
      (prev) => (prev ?? []).filter((b) => b.id !== briefId),
    );
  };

  const handleModifyBriefHook = async (briefId: string, newHook: string) => {
    const { error } = await supabase
      .from("fan_briefs")
      .update({ modified_hook: newHook })
      .eq("id", briefId);
    if (error) {
      toast({
        title: "Failed to save hook",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    queryClient.setQueryData<FanBrief[]>(
      pendingBriefsQueryKey(labelId),
      (prev) =>
        (prev ?? []).map((b) =>
          b.id === briefId ? { ...b, modified_hook: newHook } : b,
        ),
    );
    toast({ title: "Hook saved" });
  };

  // Hydrate from a draft (when user hits "Send to Create" in Angles)
  useEffect(() => {
    if (!draftAngleId && !draftPreset) return;
    if (draftPreset) setActivePreset(draftPreset);
    if (draftAngleId) {
      const angle = angles.find((a) => a.id === draftAngleId);
      if (angle) {
        setSelectedArtistId(angle.artistId);
        setAngleId(angle.id);
      }
    }
    onDraftConsumed();
  }, [draftAngleId, draftPreset, angles, onDraftConsumed]);

  // Reset the fan-brief wizard each time the user re-enters the preset so
  // the picker starts clean — keeps the fast "click Fan brief, see options"
  // mental model rather than reviving stale filters from a prior visit.
  useEffect(() => {
    if (activePreset !== "fan_brief") {
      setBriefArtistHandle("");
      setBriefSource("");
      setBriefCount(5);
      setWizardDone(false);
    }
  }, [activePreset]);

  const selectedAngle = angleId
    ? angles.find((a) => a.id === angleId)
    : undefined;

  const availableAngles = useMemo(
    () => angles.filter((a) => a.artistId === selectedArtistId && !a.killed),
    [angles, selectedArtistId],
  );

  const selectedArtist = MOCK_ARTISTS.find((a) => a.id === selectedArtistId);

  const handleGenerate = () => {
    if (!activePreset || !selectedArtist) return;
    const liveBrief =
      activePreset === "fan_brief" && fanBriefId
        ? livePendingBriefs.find((b) => b.id === fanBriefId)
        : undefined;
    const title = buildMockTitle(
      activePreset,
      selectedArtist.name,
      selectedAngle,
      linkUrl,
      liveBrief
        ? {
            handle: liveBrief.artist_handle,
            hook: fanBriefEdit || liveBrief.hook_text,
          }
        : undefined,
    );
    const item: QueueItem = {
      id: `q-gen-${Date.now()}`,
      artistId: selectedArtistId,
      title,
      outputType: activePreset,
      source: activePreset === "fan_brief" ? "fan_brief" : "human",
      status: "pending",
      risk:
        activePreset === "sensational" && selectedAngle?.speculative
          ? "flagged"
          : "low",
      riskNotes:
        activePreset === "sensational" && selectedAngle?.speculative
          ? ["Angle flagged speculative in Angles tab — review sources"]
          : [],
      thumbKind:
        activePreset === "link_video"
          ? "link"
          : activePreset === "fan_brief"
            ? "brief"
            : "video",
      createdAt: "just now",
      angleId: selectedAngle?.id,
    };
    onGenerate(item);
    setActivePreset(null);
    setAngleId("");
    setLinkUrl("");
    setLinkExtracted(false);
    setFanBriefEdit("");
    setFanBriefId("");
  };

  return (
    <div
      className="font-['DM_Sans',sans-serif] grid gap-6"
      style={{
        gridTemplateColumns: "minmax(0,1fr) 280px",
        color: "var(--ink)",
      }}
    >
      {/* Main canvas */}
      <div className="flex flex-col gap-6 min-w-0">
        {/* Step 1 — preset cards */}
        <section>
          <SectionHeader
            title="Pick a preset"
            subtitle="Choose what kind of drop you want — fields appear below."
          />
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {PRESETS.map((p) => {
              const active = activePreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setActivePreset(active ? null : p.key)}
                  className="text-left p-4 rounded-2xl transition-all"
                  style={{
                    background: active
                      ? "var(--accent-light)"
                      : "var(--surface)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    borderTop: active
                      ? `1px solid var(--accent)`
                      : "0.5px solid var(--card-edge)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <p.icon
                      size={20}
                      color={active ? "var(--accent)" : "var(--ink-tertiary)"}
                    />
                    <div className="min-w-0">
                      <div
                        className="text-[14px] font-semibold mb-0.5"
                        style={{ color: "var(--ink)" }}
                      >
                        {p.label}
                      </div>
                      <div
                        className="text-[12px] leading-snug"
                        style={{ color: "var(--ink-tertiary)" }}
                      >
                        {p.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2 — preset-specific fields */}
        {activePreset && (
          <section
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: "var(--surface)",
              borderTop: "0.5px solid var(--card-edge)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <SectionHeader
                title={OUTPUT_TYPE_LABEL[activePreset]}
                subtitle="Only the fields this preset needs."
                tight
              />
              <button
                type="button"
                onClick={() => setActivePreset(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                }}
                title="Clear preset"
              >
                <X size={14} color="var(--ink-tertiary)" />
              </button>
            </div>

            {/* Short-form */}
            {activePreset === "short_form" && (
              <>
                <AnglePicker
                  angles={availableAngles}
                  value={angleId}
                  onChange={setAngleId}
                  allowFreeform
                />
                <Row>
                  <Field label="Aspect">
                    <ChipRow
                      options={[
                        { k: "9:16", label: "9:16" },
                        { k: "1:1", label: "1:1" },
                        { k: "16:9", label: "16:9" },
                      ]}
                      value={aspectRatio}
                      onChange={(v) =>
                        setAspectRatio(v as "9:16" | "1:1" | "16:9")
                      }
                    />
                  </Field>
                  <Field label={`Duration — ${durationSec}s`}>
                    <input
                      type="range"
                      min={15}
                      max={60}
                      value={durationSec}
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: "var(--accent)" }}
                    />
                  </Field>
                </Row>
                <Field label="Music bed">
                  <ChipRow
                    options={[
                      { k: "native", label: "Artist track" },
                      { k: "original", label: "Original score" },
                      { k: "cue_a", label: "Cue library A" },
                    ]}
                    value={musicBed}
                    onChange={(v) =>
                      setMusicBed(v as "native" | "original" | "cue_a")
                    }
                  />
                </Field>
              </>
            )}

            {/* Mini-doc */}
            {activePreset === "mini_doc" && (
              <>
                <Row>
                  <Field label="Story structure">
                    <Select
                      value={storyStructure}
                      onChange={(v) =>
                        setStoryStructure(
                          v as
                            | "3_act"
                            | "5_chapter"
                            | "chronological"
                            | "investigative",
                        )
                      }
                      options={[
                        { value: "3_act", label: "3-act" },
                        { value: "5_chapter", label: "5-chapter" },
                        { value: "chronological", label: "Chronological" },
                        { value: "investigative", label: "Investigative" },
                      ]}
                    />
                  </Field>
                  <Field label="Research depth">
                    <ChipRow
                      options={[
                        { k: "Light", label: "Light" },
                        { k: "Deep", label: "Deep" },
                        { k: "Investigative", label: "Investigative" },
                      ]}
                      value={researchDepth}
                      onChange={(v) =>
                        setResearchDepth(
                          v as "Light" | "Deep" | "Investigative",
                        )
                      }
                    />
                  </Field>
                </Row>
                <AnglePicker
                  angles={availableAngles}
                  value={angleId}
                  onChange={setAngleId}
                  allowFreeform
                  label="Angle source (pick or freeform)"
                />
                <Field label={`Number of angles — ${numAngles}`}>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={numAngles}
                    onChange={(e) => setNumAngles(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: "var(--accent)" }}
                  />
                </Field>
              </>
            )}

            {/* Sensational */}
            {activePreset === "sensational" && (
              <>
                <AnglePicker
                  angles={availableAngles.filter(
                    (a) => a.family === "sensational",
                  )}
                  value={angleId}
                  onChange={setAngleId}
                  label="Angle"
                />
                <Row>
                  <Field label="Narrator voice">
                    <Select
                      value={narrator}
                      onChange={(v) =>
                        setNarrator(v as "artist" | "neutral" | "fan")
                      }
                      options={[
                        { value: "artist", label: "Artist voice" },
                        { value: "neutral", label: "Neutral editorial" },
                        { value: "fan", label: "Fan narrator" },
                      ]}
                    />
                  </Field>
                  <Field label="Pacing curve">
                    <Select
                      value={pacing}
                      onChange={(v) =>
                        setPacing(v as "steady" | "cold_open" | "builder")
                      }
                      options={[
                        { value: "cold_open", label: "Cold open" },
                        { value: "builder", label: "Builder" },
                        { value: "steady", label: "Steady" },
                      ]}
                    />
                  </Field>
                </Row>
                {selectedAngle?.speculative && (
                  <div
                    className="rounded-[10px] px-3 py-2 text-[12px]"
                    style={{
                      background: "rgba(220,38,38,0.08)",
                      border: "1px solid rgba(220,38,38,0.25)",
                      color: "#dc2626",
                    }}
                  >
                    This angle is speculative. Review will flag it automatically
                    — you can still generate.
                  </div>
                )}
              </>
            )}

            {/* Self-help */}
            {activePreset === "self_help" && (
              <>
                <AnglePicker
                  angles={availableAngles.filter(
                    (a) => a.family === "self_help",
                  )}
                  value={angleId}
                  onChange={setAngleId}
                  label="Angle"
                />
                <Field label={`Tone — ${toneLabel(toneSlider)}`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={toneSlider}
                    onChange={(e) => setToneSlider(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <div
                    className="flex justify-between text-[10px] uppercase tracking-wide mt-1"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    <span>Warm</span>
                    <span>Clinical</span>
                  </div>
                </Field>
              </>
            )}

            {/* Tour recap */}
            {activePreset === "tour_recap" && (
              <>
                <Row>
                  <Field label="Tour date">
                    <Select
                      value="red-rocks-2026-04-19"
                      onChange={() => {
                        /* mock */
                      }}
                      options={[
                        {
                          value: "red-rocks-2026-04-19",
                          label: "Red Rocks — Apr 19, 2026",
                        },
                        {
                          value: "sentrum-2026-04-02",
                          label: "Sentrum Scene — Apr 2, 2026",
                        },
                        {
                          value: "paris-2026-03-14",
                          label: "Olympia Paris — Mar 14, 2026",
                        },
                      ]}
                    />
                  </Field>
                  <Field label="Highlight type">
                    <ChipRow
                      options={[
                        { k: "crowd", label: "Crowd moment" },
                        { k: "setlist", label: "Setlist" },
                        { k: "bts", label: "BTS" },
                      ]}
                      value={tourHighlight}
                      onChange={(v) =>
                        setTourHighlight(v as "crowd" | "setlist" | "bts")
                      }
                    />
                  </Field>
                </Row>
              </>
            )}

            {/* Fan brief — live: inline BriefCard list; mock fallback: simple picker */}
            {activePreset === "fan_brief" && (
              <>
                {pendingBriefsQuery.isLoading ? (
                  <div
                    className="rounded-[10px] px-3 py-2 text-[12px] flex items-center gap-2"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    <Loader2 size={12} className="animate-spin" />
                    Loading pending briefs…
                  </div>
                ) : usingLiveBriefs ? (
                  !wizardDone ? (
                    /* Phase 1 — wizard: pick artist + source + clip count */
                    <>
                      <Field label="Artist">
                        {labelArtistsQuery.isError ? (
                          <input
                            type="text"
                            value={briefArtistHandle}
                            onChange={(e) =>
                              setBriefArtistHandle(e.target.value.trim())
                            }
                            placeholder="@handle (roster fetch failed — type manually)"
                            className="w-full h-10 px-3 rounded-[10px] text-[13px] outline-none"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--ink)",
                              border: "1px solid var(--border)",
                            }}
                          />
                        ) : labelArtistsQuery.isLoading ? (
                          <div
                            className="rounded-[10px] px-3 py-2 text-[12px] flex items-center gap-2"
                            style={{
                              background: "var(--bg-subtle)",
                              border: "1px solid var(--border)",
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            <Loader2 size={12} className="animate-spin" />
                            Loading roster…
                          </div>
                        ) : labelArtists.length === 0 ? (
                          <div
                            className="rounded-[10px] px-3 py-2 text-[12px]"
                            style={{
                              background: "var(--bg-subtle)",
                              border: "1px solid var(--border)",
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            No artists in roster — see /label/admin to onboard.
                          </div>
                        ) : (
                          <Select
                            value={briefArtistHandle}
                            onChange={setBriefArtistHandle}
                            options={[
                              { value: "", label: "— pick an artist —" },
                              ...labelArtists.map((a) => ({
                                value: a.artist_handle,
                                label: `${a.artist_name} · @${a.artist_handle}`,
                              })),
                            ]}
                          />
                        )}
                      </Field>

                      <Field label="Source">
                        <ChipRow
                          options={[
                            {
                              k: "live_performance",
                              label: "Live performance",
                            },
                            { k: "podcasts", label: "Podcasts" },
                          ]}
                          value={briefSource}
                          onChange={(v) =>
                            setBriefSource(v as "live_performance" | "podcasts")
                          }
                        />
                      </Field>

                      <Field label={`Clip count — up to ${briefCount}`}>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={briefCount}
                          onChange={(e) =>
                            setBriefCount(Number(e.target.value))
                          }
                          className="w-full"
                          style={{ accentColor: "var(--accent)" }}
                        />
                        <div
                          className="flex justify-between text-[10px] uppercase tracking-wide mt-1"
                          style={{ color: "var(--ink-tertiary)" }}
                        >
                          <span>1</span>
                          <span>20</span>
                        </div>
                      </Field>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div
                          className="text-[11px]"
                          style={{ color: "var(--ink-tertiary)" }}
                        >
                          {!briefArtistHandle || !briefSource
                            ? "Pick an artist and a source to continue."
                            : `Will filter ${livePendingBriefs.length} pending brief${
                                livePendingBriefs.length === 1 ? "" : "s"
                              } on this label.`}
                        </div>
                        <button
                          type="button"
                          onClick={() => setWizardDone(true)}
                          disabled={!briefArtistHandle || !briefSource}
                          className="h-10 px-5 rounded-[10px] text-[14px] font-semibold disabled:opacity-40"
                          style={{
                            background: "var(--accent)",
                            color: "#fff",
                            border: "none",
                          }}
                        >
                          Show briefs
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Phase 2 — filtered BriefCard list */
                    <>
                      <div
                        className="rounded-[10px] px-3 py-2 flex items-center gap-2 flex-wrap"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: "var(--accent-light)",
                            color: "var(--accent)",
                          }}
                        >
                          @{briefArtistHandle}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: "var(--accent-light)",
                            color: "var(--accent)",
                          }}
                        >
                          {briefSource === "live_performance"
                            ? "Live performance"
                            : "Podcasts"}
                        </span>
                        <span
                          className="text-[11px] font-['JetBrains_Mono',monospace] tabular-nums"
                          style={{ color: "var(--ink-tertiary)" }}
                        >
                          up to {briefCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setWizardDone(false)}
                          className="ml-auto h-7 px-3 rounded-[8px] text-[11px] font-semibold"
                          style={{
                            background: "transparent",
                            color: "var(--ink-secondary)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          Change filters
                        </button>
                      </div>

                      <div
                        className="text-[11px] flex items-center gap-1.5"
                        style={{ color: "var(--ink-tertiary)" }}
                      >
                        <span style={{ color: "#4aa07a" }}>●</span>
                        {briefSource === "live_performance"
                          ? "Live performance"
                          : "Podcasts"}{" "}
                        · @{briefArtistHandle} · {filteredBriefs.length} of{" "}
                        {totalMatches} pending brief
                        {totalMatches === 1 ? "" : "s"} on this label.
                      </div>

                      {filteredBriefs.length === 0 ? (
                        <div
                          className="rounded-[10px] px-4 py-6 text-[13px] text-center"
                          style={{
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border)",
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          No{" "}
                          {briefSource === "live_performance"
                            ? "live-performance"
                            : "podcast / interview"}{" "}
                          briefs for @{briefArtistHandle} yet — seed via{" "}
                          <code
                            className="font-['JetBrains_Mono',monospace] text-[12px]"
                            style={{ color: "var(--ink-secondary)" }}
                          >
                            scripts/fan-briefs/discover-live.ts @
                            {briefArtistHandle}
                          </code>
                          , or change filters.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {filteredBriefs.map((brief) => (
                            <div
                              key={brief.id}
                              style={{
                                opacity: mutatingBriefId === brief.id ? 0.5 : 1,
                                pointerEvents:
                                  mutatingBriefId === brief.id
                                    ? "none"
                                    : "auto",
                                transition: "opacity 0.15s",
                              }}
                            >
                              <BriefCard
                                brief={brief}
                                mode="content"
                                staticPreview
                                onApprove={handleApproveBrief}
                                onSkip={handleSkipBrief}
                                onModifyHook={handleModifyBriefHook}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <>
                    <Field label="Pending brief (mock)">
                      <Select
                        value={fanBriefId}
                        onChange={(id) => {
                          setFanBriefId(id);
                          setFanBriefEdit("");
                        }}
                        options={[
                          { value: "", label: "— pick a mock brief —" },
                          ...PENDING_FAN_BRIEFS.map((b) => ({
                            value: b.id,
                            label: b.title,
                          })),
                        ]}
                      />
                    </Field>
                    <Field label="Edit hook / caption">
                      <textarea
                        value={fanBriefEdit}
                        onChange={(e) => setFanBriefEdit(e.target.value)}
                        placeholder="Mock-only — live /label/fan-briefs renders inline with real peak_evidence when a scoped session is active."
                        className="w-full min-h-[80px] px-3 py-2 rounded-[10px] text-[14px] outline-none resize-y"
                        style={{
                          background: "var(--bg-subtle)",
                          color: "var(--ink)",
                          border: "1px solid var(--border)",
                        }}
                      />
                    </Field>
                    <div
                      className="text-[11px] flex items-center gap-1.5"
                      style={{ color: "var(--ink-tertiary)" }}
                    >
                      {pendingBriefsQuery.isError ? (
                        <>
                          <span style={{ color: "#d9a44a" }}>●</span>
                          Couldn't fetch live briefs — showing mock. See
                          console.
                        </>
                      ) : labelId ? (
                        <>
                          <span style={{ color: "var(--ink-tertiary)" }}>
                            ●
                          </span>
                          No pending briefs for this label — showing mock.
                        </>
                      ) : (
                        <>
                          <span style={{ color: "var(--ink-tertiary)" }}>
                            ●
                          </span>
                          No label scope — showing mock.
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Link → video */}
            {activePreset === "link_video" && (
              <>
                <Field label="Reference URL (TikTok or YouTube)">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => {
                        setLinkUrl(e.target.value);
                        setLinkExtracted(false);
                      }}
                      placeholder="https://www.tiktok.com/@creator/video/..."
                      className="flex-1 h-10 px-3 rounded-[10px] text-[14px] outline-none"
                      style={{
                        background: "var(--bg-subtle)",
                        color: "var(--ink)",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setLinkExtracted(!!linkUrl.trim())}
                      disabled={!linkUrl.trim()}
                      className="h-10 px-4 rounded-[10px] text-[13px] font-semibold disabled:opacity-40"
                      style={{
                        background: "var(--bg-subtle)",
                        color: "var(--ink)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Extract
                    </button>
                  </div>
                </Field>
                {linkExtracted && (
                  <div
                    className="rounded-[10px] p-3 flex items-center gap-3"
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-16 h-20 rounded-[8px] flex items-center justify-center"
                      style={{ background: "#000" }}
                    >
                      <Film size={20} color="var(--ink-tertiary)" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold truncate"
                        style={{ color: "var(--ink)" }}
                      >
                        Reference extracted — 28s · 9:16 · vibe: melodic
                        vertical
                      </div>
                      <div
                        className="text-[11px] font-['JetBrains_Mono',monospace] truncate"
                        style={{ color: "var(--ink-tertiary)" }}
                      >
                        {linkUrl}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer — Tune + Generate. Hidden for live fan-brief mode
                since Approve lives on each BriefCard. */}
            {!(activePreset === "fan_brief" && usingLiveBriefs) && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTuneOpen(true)}
                  className="h-10 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-2"
                  style={{
                    background: "transparent",
                    color: "var(--ink)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Settings2 size={14} />
                  Tune
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="h-10 px-5 rounded-[10px] text-[14px] font-semibold"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Generate
                </button>
              </div>
            )}
          </section>
        )}

        {!activePreset && (
          <div
            className="rounded-2xl px-5 py-8 text-center text-[13px]"
            style={{
              background: "var(--surface)",
              borderTop: "0.5px solid var(--card-edge)",
              color: "var(--ink-tertiary)",
            }}
          >
            Pick a preset above to reveal its fields.
          </div>
        )}
      </div>

      {/* Right sidebar — artist + avatar picker */}
      <aside
        className="rounded-2xl p-5 flex flex-col gap-5 h-fit"
        style={{
          background: "var(--surface)",
          borderTop: "0.5px solid var(--card-edge)",
          position: "sticky",
          top: 20,
        }}
      >
        <div>
          <SidebarLabel>Artist</SidebarLabel>
          <div className="relative">
            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="w-full h-10 pl-3 pr-9 rounded-[10px] text-[13px] font-medium outline-none appearance-none cursor-pointer"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            >
              {MOCK_ARTISTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              color="var(--ink-tertiary)"
            />
          </div>
          {selectedArtist && (
            <div
              className="text-[11px] font-['JetBrains_Mono',monospace] mt-1.5"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {selectedArtist.handle} · {selectedArtist.labelName}
            </div>
          )}
        </div>

        <div>
          <SidebarLabel>Avatar / Soul ID</SidebarLabel>
          <div className="flex flex-col gap-1.5">
            {[
              { id: "av-native", label: "Native — artist voice" },
              { id: "av-narrator", label: "Neutral narrator" },
              { id: "av-fan", label: "Fan persona A" },
              { id: "av-fan2", label: "Fan persona B" },
            ].map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelectedAvatar(av.id)}
                className="px-3 h-9 rounded-[10px] text-left text-[13px] flex items-center gap-2"
                style={{
                  background:
                    selectedAvatar === av.id
                      ? "var(--accent-light)"
                      : "var(--bg-subtle)",
                  color:
                    selectedAvatar === av.id ? "var(--accent)" : "var(--ink)",
                  border: `1px solid ${
                    selectedAvatar === av.id ? "var(--accent)" : "var(--border)"
                  }`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full"
                  style={{
                    background:
                      selectedAvatar === av.id
                        ? "var(--accent)"
                        : "var(--border-hover, var(--border))",
                  }}
                />
                <span className="truncate">{av.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SidebarLabel>Brand kit</SidebarLabel>
          <div
            className="rounded-[10px] p-3 flex items-center gap-3"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex gap-1">
              <Swatch color="#0b0b0c" />
              <Swatch color="#e8430a" />
              <Swatch color="#e8e2d4" />
            </div>
            <div className="min-w-0">
              <div
                className="text-[12px] font-semibold truncate"
                style={{ color: "var(--ink)" }}
              >
                {selectedArtist?.name ?? "—"} · default kit
              </div>
              <div
                className="text-[11px] truncate"
                style={{ color: "var(--ink-tertiary)" }}
              >
                DM Sans · burn-orange accent
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Tune drawer */}
      {tuneOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setTuneOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-[440px] overflow-y-auto p-6 flex flex-col gap-5"
            style={{
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-[18px] font-semibold"
                style={{ color: "var(--ink)" }}
              >
                Tune
              </h2>
              <button
                type="button"
                onClick={() => setTuneOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                }}
              >
                <X size={14} color="var(--ink-tertiary)" />
              </button>
            </div>
            <p className="text-[12px]" style={{ color: "var(--ink-tertiary)" }}>
              Advanced knobs — every preset reads from here unless overridden
              above.
            </p>

            <TuneGroup title="Caption style">
              <ChipRow
                options={[
                  { k: "burned_bottom", label: "Burned — bottom" },
                  { k: "karaoke", label: "Karaoke" },
                  { k: "none", label: "None" },
                ]}
                value="burned_bottom"
                onChange={() => {
                  /* mock */
                }}
              />
            </TuneGroup>

            <TuneGroup title="Voiceover model">
              <Select
                value="opus-v1"
                onChange={() => {
                  /* mock */
                }}
                options={[
                  { value: "opus-v1", label: "Opus v1 — editorial" },
                  { value: "fan-clone", label: "Fan-voice clone" },
                  { value: "elevenlabs-pro", label: "ElevenLabs Pro" },
                ]}
              />
            </TuneGroup>

            <TuneGroup title="B-roll density">
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={45}
                className="w-full"
                style={{ accentColor: "var(--accent)" }}
              />
            </TuneGroup>

            <TuneGroup title="Hook placement">
              <ChipRow
                options={[
                  { k: "first_1s", label: "< 1s" },
                  { k: "first_3s", label: "< 3s" },
                  { k: "slow_build", label: "Slow build" },
                ]}
                value="first_3s"
                onChange={() => {
                  /* mock */
                }}
              />
            </TuneGroup>

            <TuneGroup title="Music bed library">
              <Select
                value="cue_a"
                onChange={() => {
                  /* mock */
                }}
                options={[
                  { value: "artist", label: "Artist catalog only" },
                  { value: "cue_a", label: "Cue library A — ambient" },
                  { value: "cue_b", label: "Cue library B — cinematic" },
                  { value: "fair_use", label: "Fair-use cleared" },
                ]}
              />
            </TuneGroup>

            <TuneGroup title="Output format">
              <ChipRow
                options={[
                  { k: "mp4_h264", label: "MP4 h.264" },
                  { k: "mov_prores", label: "MOV ProRes" },
                  { k: "webm", label: "WebM" },
                ]}
                value="mp4_h264"
                onChange={() => {
                  /* mock */
                }}
              />
            </TuneGroup>
          </div>
        </div>
      )}
    </div>
  );
}

function buildMockTitle(
  preset: OutputType,
  artistName: string,
  angle: Angle | undefined,
  linkUrl: string,
  liveBrief?: { handle: string; hook: string },
): string {
  if (preset === "link_video") {
    const short = linkUrl ? linkUrl.slice(0, 48) : artistName;
    return `Link → video · ${short}`;
  }
  if (preset === "fan_brief") {
    if (liveBrief) {
      const hook = liveBrief.hook.trim();
      const short = hook.length > 56 ? `${hook.slice(0, 56)}…` : hook;
      return `Fan brief · @${liveBrief.handle} — ${short || "(no hook)"}`;
    }
    return `Fan brief edit — ${artistName}`;
  }
  if (angle) {
    return `${OUTPUT_TYPE_LABEL[preset]}: ${angle.title.slice(0, 56)}`;
  }
  return `${OUTPUT_TYPE_LABEL[preset]} — ${artistName}`;
}

function toneLabel(v: number): string {
  if (v < 25) return "warm";
  if (v < 55) return "balanced";
  if (v < 80) return "reserved";
  return "clinical";
}

function SectionHeader({
  title,
  subtitle,
  tight,
}: {
  title: string;
  subtitle?: string;
  tight?: boolean;
}) {
  return (
    <div className={tight ? "" : "mb-3"}>
      <div
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-secondary)" }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          className="text-[12px] mt-0.5"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
      style={{ color: "var(--ink-secondary)" }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-3 pr-9 rounded-[10px] text-[13px] outline-none appearance-none cursor-pointer"
        style={{
          background: "var(--bg-subtle)",
          color: "var(--ink)",
          border: "1px solid var(--border)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        color="var(--ink-tertiary)"
      />
    </div>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { k: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.k === value;
        return (
          <button
            key={o.k}
            type="button"
            onClick={() => onChange(o.k)}
            className="px-3 h-8 rounded-[10px] text-[12px] font-semibold"
            style={{
              background: active ? "var(--accent-light)" : "var(--bg-subtle)",
              color: active ? "var(--accent)" : "var(--ink-secondary)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function AnglePicker({
  angles,
  value,
  onChange,
  label = "Angle",
  allowFreeform,
}: {
  angles: Angle[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  allowFreeform?: boolean;
}) {
  if (angles.length === 0) {
    return (
      <Field label={label}>
        <div
          className="rounded-[10px] px-3 py-2 text-[12px]"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            color: "var(--ink-tertiary)",
          }}
        >
          No angles for this artist + family. Try a broader family or switch
          artists.
        </div>
      </Field>
    );
  }
  return (
    <Field label={label}>
      <Select
        value={value || ""}
        onChange={onChange}
        options={[
          ...(allowFreeform
            ? [{ value: "", label: "— freeform / no angle —" }]
            : [{ value: "", label: "— pick an angle —" }]),
          ...angles.map((a) => ({
            value: a.id,
            label: `${ANGLE_FAMILY_LABEL[a.family]} · ${a.title.slice(0, 56)}${a.title.length > 56 ? "…" : ""}`,
          })),
        ]}
      />
      {value && <AnglePreview angle={angles.find((a) => a.id === value)!} />}
    </Field>
  );
}

function AnglePreview({ angle }: { angle: Angle }) {
  const fam = ANGLE_FAMILY_COLOR[angle.family];
  return (
    <div
      className="rounded-[10px] p-3 flex flex-col gap-1.5"
      style={{
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: fam.bg, color: fam.fg }}
        >
          {ANGLE_FAMILY_LABEL[angle.family]}
        </span>
        <span
          className="text-[11px] font-['JetBrains_Mono',monospace]"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {angle.sourceCount} source{angle.sourceCount === 1 ? "" : "s"}
          {angle.mostRecentSourceMonth
            ? ` · ${angle.mostRecentSourceMonth}`
            : ""}
          {angle.speculative ? " · speculative" : ""}
        </span>
      </div>
      <div
        className="text-[12px] font-semibold"
        style={{ color: "var(--ink)" }}
      >
        {angle.title}
      </div>
    </div>
  );
}

function TuneGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-secondary)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <div
      className="w-6 h-6 rounded"
      style={{ background: color, border: "1px solid var(--border)" }}
    />
  );
}

// placeholder to prevent unused-import warnings if a preset icon is dropped later
export const __FileTextIcon = FileText;

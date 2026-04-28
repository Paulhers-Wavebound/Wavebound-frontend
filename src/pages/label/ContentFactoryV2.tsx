import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Factory, Inbox, Loader2, Sparkles } from "lucide-react";
import RailArrow from "@/components/content-factory-v2/_carousel/RailArrow";
import ExploreView from "@/components/content-factory-v2/ExploreView";
import CreateView from "@/components/content-factory-v2/CreateView";
import type {
  CreateJobInput,
  LinkVideoJobInput,
} from "@/components/content-factory-v2/CreateView";
import type { CartoonGenerateInput } from "@/components/content-factory-v2/CartoonPanel";
import ReviewView from "@/components/content-factory-v2/ReviewView";
import { INITIAL_QUEUE } from "@/components/content-factory-v2/mockData";
import {
  RETRY_MAX,
  type OutputType,
  type QueueItem,
} from "@/components/content-factory-v2/types";
import { logRetryAttempt } from "@/components/content-factory-v2/retryTelemetry";
import {
  buildCartoonItemFromScript,
  type CartoonFormat,
  type CartoonScriptRow,
  deriveCartoonItemState,
  FORMAT_TITLE_PREFIX,
  itemFromSnapshot,
  loadCartoonRuns,
  reconcileCartoonItem,
  saveCartoonRuns,
  snapshotFromItem,
} from "@/components/content-factory-v2/cartoonReconciler";
import {
  buildLinkVideoItemFromJob,
  type CfJobRow,
  deriveLinkVideoItemState,
  linkVideoItemFromSnapshot,
  linkVideoSnapshotFromItem,
  loadLinkVideoRuns,
  reconcileLinkVideoItem,
  saveLinkVideoRuns,
} from "@/components/content-factory-v2/linkVideoReconciler";
import type { FanBrief } from "@/types/fanBriefs";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { streamChatMessage } from "@/services/chatJobService";
import { toast } from "@/hooks/use-toast";
import type { LeadHunterLead } from "@/types/cartoonLeadHunter";

type TabKey = "explore" | "create" | "assets";

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { key: "explore", label: "Explore", icon: Sparkles },
  { key: "create", label: "Create", icon: Factory },
  { key: "assets", label: "Assets", icon: Inbox },
];

function isTabKey(v: string | null): v is TabKey {
  return v === "explore" || v === "create" || v === "assets";
}

/**
 * Set up a polling interval that runs at `visibleMs` while the tab is in the
 * foreground and `hiddenMs` (slower) when backgrounded. Browsers throttle
 * setInterval on hidden tabs anyway, but our useEffects also need a way to
 * cut Supabase query volume to a hidden tab without losing the catch-up
 * tick when it returns. Returns a cleanup function suitable for a useEffect
 * return value.
 */
function setupVisibilityAwareInterval(
  visibleMs: number,
  hiddenMs: number,
  tick: () => void,
): () => void {
  let intervalId: number | undefined;
  const start = () => {
    if (intervalId !== undefined) window.clearInterval(intervalId);
    const ms = document.visibilityState === "visible" ? visibleMs : hiddenMs;
    intervalId = window.setInterval(tick, ms);
  };
  start();
  const onVisible = () => {
    start();
    if (document.visibilityState === "visible") tick();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    if (intervalId !== undefined) window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

// Backward-compat: old query-param values map to the renamed tabs. Bookmarks
// and inbound links from before the Higgsfield-style rename still resolve.
function migrateLegacyTab(v: string | null): TabKey | null {
  if (v === "angles") return "explore";
  if (v === "review") return "assets";
  return null;
}

function buildStoryWriterMessage({
  artistName,
  isRealfootage,
  selectedLead,
}: {
  artistName: string;
  isRealfootage: boolean;
  selectedLead?: LeadHunterLead;
}): string {
  const formatInstruction = isRealfootage
    ? 'IMPORTANT: include "format": "realfootage" at the top level of the fenced JSON output so the renderer routes to the real-footage pipeline.'
    : "";

  if (!selectedLead) {
    return isRealfootage
      ? `Make a 60-second real-footage story for ${artistName}. Pick the most compelling, factually-grounded story angle from their dossier — viral moment, hidden lore, fan obsession, chart breakthrough, anything that hooks in 3 words. Run the dossier tools first. ${formatInstruction}`
      : `Make a cartoon for ${artistName}. Pick the most compelling, factually-grounded story angle from their dossier — viral moment, hidden lore, fan obsession, chart breakthrough, anything that hooks in 3 words. Run the dossier tools first.`;
  }

  const leadContext = {
    lead_id: selectedLead.lead_id,
    working_title: selectedLead.working_title,
    one_sentence_angle: selectedLead.one_sentence_angle,
    raw_story_arc: selectedLead.raw_story_arc,
    why_fans_would_care: selectedLead.why_fans_would_care,
    artist_positive_frame: selectedLead.artist_positive_frame,
    tension_source: selectedLead.tension_source,
    curiosity_engine: selectedLead.curiosity_engine,
    possible_hook_energy: selectedLead.possible_hook_energy,
    known_or_suspected_facts: selectedLead.known_or_suspected_facts,
    source_breadcrumbs: selectedLead.source_breadcrumbs,
    verification_questions: selectedLead.verification_questions,
    risk_notes: selectedLead.risk_notes,
    scores: selectedLead.scores,
  };

  return `Make a ${isRealfootage ? "60-second real-footage story" : "cartoon"} for ${artistName} using the operator-selected Lead Hunter story below.

Treat the selected lead as the CHOSEN CREATIVE DIRECTION, not as a fully verified script. A human already picked this story because each render is expensive — do not pick a different angle just because another shiny fact is in the dossier.

Verify enough to avoid obviously false claims. If a specific detail is weak, conflicting between sources, or shakier than the rest of the lead, SOFTEN it — don't change the story. Drop the exact number, drop the exact dollar amount, drop the unverifiable quote, and keep the human beat. Example: if "$93 vs $40" is in conflict, write "he busked on the pier and strangers actually stopped" instead of guessing the number.

Only abandon this lead if the CORE CLAIM (the one_sentence_angle) is clearly unsupported once you research it, OR landing it would make the artist look bad in a way the artist_positive_frame can't repair. If you do abandon, say so briefly in Part 1 and pivot to the closest verified artist-positive version of this story — not a totally unrelated angle from the dossier.

Run the dossier tools first to verify the selected lead, fill gaps, and replace any obviously broken specifics. Keep the artist-positive frame: the artist should feel more magnetic, impressive, resilient, or misunderstood in a good way.
${formatInstruction}

<operator_selected_lead>
${JSON.stringify(leadContext, null, 2)}
</operator_selected_lead>`;
}

interface ActiveJob {
  jobId: string;
  artistHandle: string;
  source: OutputType;
  count: number;
  stage: string;
}

function ActiveJobsRail({
  activeJobs,
  onOpen,
}: {
  activeJobs: ActiveJob[];
  onOpen: () => void;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = useCallback((delta: number) => {
    railRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  return (
    <div className="mb-12 group relative">
      <div className="flex items-end justify-between mb-4">
        <div
          className="flex items-center gap-3"
          style={{
            fontFamily: "var(--display-font)",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--accent)",
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full higgs-orb-running"
            style={{ background: "var(--accent)" }}
          />
          Currently generating · {activeJobs.length}
        </div>
        <div
          className="text-[11px]"
          style={{
            color: "var(--ink-tertiary)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          click to open
        </div>
      </div>
      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {activeJobs.map((job) => (
          <button
            key={job.jobId}
            type="button"
            onClick={onOpen}
            className="relative w-[220px] aspect-square shrink-0 rounded-[14px] overflow-hidden text-left snap-start group/card"
            style={{
              background: "var(--surface)",
              boxShadow: "inset 0 0 0 1px var(--accent-hairline)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "var(--accent-soft)" }}
            />
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(transparent 50%, rgba(0,0,0,0.85) 100%)",
              }}
            />
            <span
              className="absolute top-3 right-3 w-2 h-2 rounded-full higgs-orb-running"
              style={{ background: "var(--accent)" }}
            />
            <span
              className="absolute inset-0 rounded-[14px] pointer-events-none opacity-0 group-hover/card:opacity-100"
              style={{
                boxShadow:
                  "inset 0 0 0 1px var(--accent), 0 0 32px var(--accent-glow)",
                transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            <div className="absolute bottom-3 left-3 right-3">
              <div
                className="truncate"
                style={{
                  fontFamily: "var(--display-font)",
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "-0.005em",
                  color: "#fff",
                }}
              >
                @{job.artistHandle}
              </div>
              <div
                className="text-[11px] truncate mt-0.5"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {job.stage} · {job.count} brief
                {job.count === 1 ? "" : "s"}
              </div>
            </div>
          </button>
        ))}
      </div>
      <RailArrow direction="left" onClick={() => scrollBy(-240)} yOffset={14} />
      <RailArrow direction="right" onClick={() => scrollBy(240)} yOffset={14} />
    </div>
  );
}

export default function ContentFactoryV2() {
  const [params, setParams] = useSearchParams();
  const tabFromUrl = params.get("tab");
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const pendingCount = queue.filter((q) => q.status === "pending").length;
  // Default landing depends on whether the user has anything to triage. New
  // users / empty queues land on Explore (the tool grid). Returning users
  // mid-queue land on Assets so their workflow isn't interrupted.
  const defaultTab: TabKey = pendingCount > 0 ? "assets" : "explore";
  const legacy = migrateLegacyTab(tabFromUrl);
  const activeTab: TabKey = isTabKey(tabFromUrl)
    ? tabFromUrl
    : (legacy ?? defaultTab);
  const { labelId } = useUserProfile();
  const queryClient = useQueryClient();

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      const next = new URLSearchParams(params);
      next.set("tab", tab);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  // If the user landed via an old `?tab=angles|review` URL, normalize the
  // query param to the new key without breaking history.
  useEffect(() => {
    if (legacy && tabFromUrl !== legacy) {
      const next = new URLSearchParams(params);
      next.set("tab", legacy);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacy]);

  // Handoff state — Explore's tool cards set draftPreset, then push the user
  // into the Create tab with the right form pre-selected. Cleared after the
  // CreateView consumes it.
  const [draftPreset, setDraftPreset] = useState<OutputType | null>(null);

  // DB-backed source for the Review queue. Pulls every approved fan_brief for
  // this label and merges them into the in-memory queue (deduped by
  // fanBriefId). Solves the "I refreshed mid-job and lost my placeholders"
  // case: the briefs land in fan_briefs at status='approved' regardless of
  // FE state, and this query surfaces them next time the user opens v2.
  const approvedBriefsQuery = useQuery({
    queryKey: ["fan-briefs-v2-approved", labelId],
    enabled: !!labelId,
    staleTime: 30_000,
    // Refetch every 30s so renderedClipUrl populated by the render-worker
    // after approval shows up in the queue without a manual refresh. The
    // merge effect below patches the existing item in place rather than
    // re-adding, so this is cheap.
    refetchInterval: 30_000,
    queryFn: async (): Promise<FanBrief[]> => {
      const { data, error } = await supabase
        .from("fan_briefs")
        .select(
          "id, artist_id, artist_handle, content_type, hook_text, modified_hook, created_at, status, source_url, youtube_timestamp_url, rendered_clip_url, generation_context, render_error, render_error_at",
        )
        .eq("label_id", labelId!)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as FanBrief[];
    },
  });

  // Merge fetched briefs into the queue. Two paths:
  //   • New brief id → prepend a fresh QueueItem at status='pending'.
  //   • Existing brief id (placeholder reconciled or earlier fetch) → patch
  //     in-place to pick up render-worker-populated fields (renderedClipUrl,
  //     thumbnailUrl, sourceUrl) and any modified_hook updates. Preserves
  //     in-session state — status, scheduledFor, jobError stay put.
  useEffect(() => {
    const briefs = approvedBriefsQuery.data;
    if (!briefs || briefs.length === 0) return;
    setQueue((prev) => {
      const briefById = new Map(briefs.map((b) => [b.id, b]));
      let mutated = false;

      // Pass 1: patch existing items.
      const patched = prev.map((q) => {
        if (!q.fanBriefId) return q;
        const brief = briefById.get(q.fanBriefId);
        if (!brief) return q;
        const hook = brief.modified_hook || brief.hook_text;
        const short = hook.length > 56 ? `${hook.slice(0, 56)}…` : hook;
        const nextRenderedClipUrl = brief.rendered_clip_url ?? undefined;
        const nextSourceUrl =
          brief.youtube_timestamp_url ?? brief.source_url ?? undefined;
        const nextThumb = youtubeThumbnailFromUrl(brief.source_url);
        const nextTitle = `Fan brief · @${brief.artist_handle} — ${short || "(no hook)"}`;
        // If a previous session persisted a schedule slot, reflect that
        // state — but only adopt it when the local item is still pending.
        // A locally-killed item shouldn't get resurrected by a stale row.
        const persistedSlot = brief.generation_context?.scheduled_for;
        const adoptScheduled =
          q.status === "pending" && typeof persistedSlot === "string";
        const nextStatus = adoptScheduled ? "scheduled" : q.status;
        const nextScheduledFor = adoptScheduled
          ? persistedSlot
          : q.scheduledFor;
        const nextApprovedAt = brief.created_at ?? q.approvedAtIso;
        const nextRenderError = brief.render_error ?? undefined;
        const nextRenderStalled = computeRenderStalled(
          nextStatus,
          nextRenderedClipUrl,
          nextApprovedAt,
          nextRenderError,
        );
        const changed =
          q.renderedClipUrl !== nextRenderedClipUrl ||
          q.sourceUrl !== nextSourceUrl ||
          q.thumbnailUrl !== nextThumb ||
          q.title !== nextTitle ||
          q.status !== nextStatus ||
          q.scheduledFor !== nextScheduledFor ||
          q.approvedAtIso !== nextApprovedAt ||
          q.renderStalled !== nextRenderStalled ||
          q.renderError !== nextRenderError;
        if (!changed) return q;
        mutated = true;
        return {
          ...q,
          renderedClipUrl: nextRenderedClipUrl,
          sourceUrl: nextSourceUrl,
          thumbnailUrl: nextThumb,
          title: nextTitle,
          status: nextStatus,
          scheduledFor: nextScheduledFor,
          approvedAtIso: nextApprovedAt,
          renderStalled: nextRenderStalled,
          renderError: nextRenderError,
        };
      });

      // Pass 2: prepend brand-new briefs.
      const existingBriefIds = new Set(
        patched.filter((q) => q.fanBriefId).map((q) => q.fanBriefId!),
      );
      const additions: QueueItem[] = [];
      for (const brief of briefs) {
        if (existingBriefIds.has(brief.id)) continue;
        const hook = brief.modified_hook || brief.hook_text;
        const short = hook.length > 56 ? `${hook.slice(0, 56)}…` : hook;
        const persistedSlot = brief.generation_context?.scheduled_for;
        const startScheduled = typeof persistedSlot === "string";
        const startStatus: QueueItem["status"] = startScheduled
          ? "scheduled"
          : "pending";
        const startRenderedClipUrl = brief.rendered_clip_url ?? undefined;
        const startRenderError = brief.render_error ?? undefined;
        additions.push({
          id: `q-fb-${brief.id}`,
          artistId: `fb-${brief.artist_handle}`,
          artistDisplayHandle: brief.artist_handle,
          artistDisplayName: `@${brief.artist_handle}`,
          title: `Fan brief · @${brief.artist_handle} — ${short || "(no hook)"}`,
          outputType: "fan_brief",
          source: "fan_brief",
          status: startStatus,
          scheduledFor: startScheduled ? persistedSlot : undefined,
          risk: "low",
          riskNotes: [],
          thumbKind: "brief",
          createdAt: relativeTime(brief.created_at),
          fanBriefId: brief.id,
          thumbnailUrl: youtubeThumbnailFromUrl(brief.source_url),
          sourceUrl:
            brief.youtube_timestamp_url ?? brief.source_url ?? undefined,
          renderedClipUrl: startRenderedClipUrl,
          approvedAtIso: brief.created_at,
          renderError: startRenderError,
          renderStalled: computeRenderStalled(
            startStatus,
            startRenderedClipUrl,
            brief.created_at,
            startRenderError,
          ),
        });
      }

      if (!mutated && additions.length === 0) return prev;
      return additions.length > 0 ? [...additions, ...patched] : patched;
    });
  }, [approvedBriefsQuery.data]);

  // Refresh resilience: pull any fan_brief_jobs still in flight for this
  // label and rebuild placeholder QueueItems for them. Without this, a hard
  // refresh while a 4-min pipeline run is going wipes the in-memory queue
  // and leaves the user with no progress signal until the briefs land at
  // status='approved'. We reconstruct the placeholders from requested_count
  // and let the channel-subscribe + reconcile flow take it from there.
  //
  // Caps: only jobs <1h old, max 10. Older jobs are functionally dead from
  // the user's perspective — the briefs (if any) will surface via
  // approvedBriefsQuery anyway.
  const activeJobsQuery = useQuery({
    queryKey: ["fan-brief-jobs-active", labelId],
    enabled: !!labelId,
    staleTime: 30_000,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("fan_brief_jobs")
        .select(
          "id, artist_handle, source, requested_count, status, current_stage, created_at",
        )
        .eq("label_id", labelId!)
        .not("status", "in", "(complete,failed)")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const jobs = activeJobsQuery.data;
    if (!jobs || jobs.length === 0) return;
    setQueue((prev) => {
      const knownJobIds = new Set(
        prev.filter((q) => q.fanBriefJobId).map((q) => q.fanBriefJobId!),
      );
      const additions: QueueItem[] = [];
      for (const job of jobs) {
        if (knownJobIds.has(job.id)) continue;
        const sourceLabel =
          job.source === "live_performance" ? "live performance" : "podcast";
        const stage =
          (job.current_stage as string | null) ||
          statusFallbackLabel((job.status as string) ?? "queued");
        const count = Math.max(1, Math.min(20, job.requested_count ?? 1));
        for (let i = 0; i < count; i++) {
          additions.push({
            id: `q-job-${job.id}-${i}`,
            artistId: `fb-${job.artist_handle}`,
            artistDisplayName: `@${job.artist_handle}`,
            artistDisplayHandle: job.artist_handle,
            title: `Generating ${sourceLabel} brief · @${job.artist_handle}`,
            outputType: "fan_brief",
            source: "fan_brief",
            status: "generating",
            risk: "low",
            riskNotes: [],
            thumbKind: "brief",
            createdAt: relativeTime(job.created_at),
            fanBriefJobId: job.id,
            jobIndex: i,
            jobStage: stage,
          });
        }
      }
      if (additions.length === 0) return prev;
      return [...additions, ...prev];
    });
  }, [activeJobsQuery.data]);

  // Pick a preset from the Explore tool grid → switch to Create with the
  // form pre-selected. Mirrors the legacy "Send to Create" mechanic from the
  // dropped Angles tab; CreateView still consumes draftPreset on mount.
  const handlePickPreset = useCallback(
    (preset: OutputType) => {
      setDraftPreset(preset);
      setActiveTab("create");
    },
    [setActiveTab],
  );

  const handleDraftConsumed = useCallback(() => {
    setDraftPreset(null);
  }, []);

  // Create handler
  const handleGenerate = useCallback((item: QueueItem) => {
    setQueue((prev) => [item, ...prev]);
    toast({
      title: "Added to Review",
      description: item.title.slice(0, 72),
    });
  }, []);

  // On-demand fan-brief job handoff. The wizard POSTed to the edge function
  // and got back a jobId; we push N placeholder QueueItems with status
  // 'generating' and the same fanBriefJobId so the Realtime subscription
  // below can flip them as the worker progresses.
  const handleCreateJob = useCallback(
    ({ jobId, count, artistHandle, source }: CreateJobInput) => {
      const sourceLabel =
        source === "live_performance" ? "live performance" : "podcast";
      const placeholders: QueueItem[] = Array.from(
        { length: count },
        (_, i) => ({
          id: `q-job-${jobId}-${i}`,
          artistId: `fb-${artistHandle}`,
          artistDisplayName: `@${artistHandle}`,
          artistDisplayHandle: artistHandle,
          title: `Generating ${sourceLabel} brief · @${artistHandle}`,
          outputType: "fan_brief",
          source: "fan_brief",
          status: "generating",
          risk: "low",
          riskNotes: [],
          thumbKind: "brief",
          createdAt: "just now",
          fanBriefJobId: jobId,
          jobIndex: i,
          jobStage: "Queued — worker picks up within 60s.",
        }),
      );
      setQueue((prev) => [...placeholders, ...prev]);
      setActiveTab("assets");
      toast({
        title: `Discovering ${count} ${sourceLabel} brief${count === 1 ? "" : "s"}`,
        description: `for @${artistHandle} — pipeline runs 3–8 min.`,
      });
    },
    [setActiveTab],
  );

  // Realtime reconciliation for in-flight on-demand fan-brief jobs. The
  // backend updates fan_brief_jobs as the pipeline progresses; we listen
  // per-jobId and flip placeholder QueueItems to real briefs (status flips
  // generating → pending) or red-failed states. Channels live in a ref so
  // this effect can re-run on queue changes without thrashing subscriptions.
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  // Settled job IDs — once a job reaches a terminal state (complete/failed,
  // or our local 20-min timeout) we record it here so a stray Realtime/poll
  // double-fire doesn't re-toast or re-mutate the queue.
  const settledJobsRef = useRef<Set<string>>(new Set());
  // Per-job consecutive fetch error counts. After MAX_RECONCILE_ERRORS the
  // job's placeholders flip to failed so the user isn't staring at a stuck
  // "Queued…" forever when the DB read keeps erroring (RLS regression,
  // network, etc.).
  const jobErrorCountsRef = useRef<Map<string, number>>(new Map());

  const reconcileJobUpdate = useCallback(
    async (jobId: string, row: Record<string, unknown>) => {
      const status = row.status as string;
      const stage = (row.current_stage as string | null) ?? null;
      const errorMessage = (row.error_message as string | null) ?? null;
      // Defensive parse: DB column is text[] but a malformed row (manual
      // edit, codec bug) could land as null/string/garbage. Coerce to a
      // clean string[] so .length / indexed access don't blow up.
      const producedBriefIds: string[] = Array.isArray(row.produced_brief_ids)
        ? row.produced_brief_ids.filter(
            (x): x is string => typeof x === "string",
          )
        : [];
      const createdAtRaw = row.created_at as string | null | undefined;
      const createdAtMs = createdAtRaw ? Date.parse(createdAtRaw) : NaN;

      const isTerminal = status === "complete" || status === "failed";

      // Stale-job timeout: a row that's still in flight after 20 minutes is
      // almost certainly orphaned (worker crash, flock held forever). Mark
      // the placeholders failed locally — if the worker eventually finishes,
      // the produced briefs surface via approvedBriefsQuery anyway.
      const STALE_AFTER_MS = 20 * 60 * 1000;
      if (
        !isTerminal &&
        Number.isFinite(createdAtMs) &&
        Date.now() - createdAtMs > STALE_AFTER_MS &&
        !settledJobsRef.current.has(jobId)
      ) {
        settledJobsRef.current.add(jobId);
        setQueue((prev) => {
          if (
            !prev.some(
              (q) => q.fanBriefJobId === jobId && q.status === "generating",
            )
          ) {
            return prev;
          }
          return prev.map((q) =>
            q.fanBriefJobId === jobId && q.status === "generating"
              ? {
                  ...q,
                  status: "failed",
                  jobError:
                    "Job timed out — pipeline didn't report back. The briefs may still land later.",
                  jobStage: undefined,
                }
              : q,
          );
        });
        toast({
          title: "Job timed out",
          description:
            "The pipeline hasn't reported back in 20 minutes. The briefs may still arrive — check Review later.",
          variant: "destructive",
        });
        return;
      }

      // Idempotent terminal reconcile: skip if we've already toasted+swapped
      // for this jobId. Realtime + poll + visibility-refetch can all race to
      // call us with the same final row.
      if (isTerminal && settledJobsRef.current.has(jobId)) return;

      if (status === "complete") {
        if (producedBriefIds.length === 0) {
          settledJobsRef.current.add(jobId);
          setQueue((prev) => {
            if (
              !prev.some(
                (q) => q.fanBriefJobId === jobId && q.status === "generating",
              )
            ) {
              return prev;
            }
            return prev.map((q) =>
              q.fanBriefJobId === jobId && q.status === "generating"
                ? {
                    ...q,
                    status: "failed",
                    jobError:
                      stage ||
                      "Pipeline completed but produced no briefs. Try a different artist or source.",
                    jobStage: undefined,
                  }
                : q,
            );
          });
          toast({
            title: "No briefs generated",
            description:
              stage || "Pipeline ran but found no usable peaks for that pick.",
            variant: "destructive",
          });
          return;
        }

        const { data: briefs, error } = await supabase
          .from("fan_briefs")
          .select(
            "id, artist_id, artist_handle, hook_text, modified_hook, source_url, youtube_timestamp_url, rendered_clip_url, created_at, render_error",
          )
          .in("id", producedBriefIds);

        if (error) {
          console.error("[fan-brief-reconcile] fetch briefs failed", {
            jobId,
            error,
          });
          toast({
            title: "Briefs ready — fetch failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        // Mark settled BEFORE the setQueue mutation so a racing concurrent
        // reconcile bails at the idempotent check above.
        settledJobsRef.current.add(jobId);

        setQueue((prev) => {
          // Race guard: if no generating placeholder exists for this job,
          // a concurrent reconcile already swapped them. No-op.
          if (
            !prev.some(
              (q) => q.fanBriefJobId === jobId && q.status === "generating",
            )
          ) {
            return prev;
          }
          const reconciled = prev.flatMap((q) => {
            if (q.fanBriefJobId !== jobId) return [q];
            const briefId = producedBriefIds[q.jobIndex ?? 0];
            if (!briefId) return []; // drop surplus placeholder (got fewer briefs than requested)
            const brief = briefs?.find((b) => b.id === briefId);
            if (!brief) return [q];
            const hook = brief.modified_hook || brief.hook_text;
            const short = hook.length > 56 ? `${hook.slice(0, 56)}…` : hook;
            const reconciledRenderedClipUrl =
              brief.rendered_clip_url ?? undefined;
            const reconciledBriefAny = brief as {
              created_at?: string;
              render_error?: QueueItem["renderError"] | null;
            };
            const reconciledRenderError =
              reconciledBriefAny.render_error ?? undefined;
            return [
              {
                ...q,
                status: "pending" as const,
                fanBriefId: brief.id,
                artistDisplayHandle: brief.artist_handle,
                artistDisplayName: `@${brief.artist_handle}`,
                title: `Fan brief · @${brief.artist_handle} — ${short || "(no hook)"}`,
                jobStage: undefined,
                thumbnailUrl: youtubeThumbnailFromUrl(brief.source_url),
                sourceUrl:
                  brief.youtube_timestamp_url ?? brief.source_url ?? undefined,
                renderedClipUrl: reconciledRenderedClipUrl,
                approvedAtIso: reconciledBriefAny.created_at,
                renderError: reconciledRenderError,
                renderStalled: computeRenderStalled(
                  "pending",
                  reconciledRenderedClipUrl,
                  reconciledBriefAny.created_at,
                  reconciledRenderError,
                ),
              },
            ];
          });
          // Dedupe by fanBriefId — the approvedBriefsQuery may have raced
          // ahead and seeded a brief that just got reconciled here. Keep
          // the first occurrence (which is now the reconciled placeholder
          // since placeholders were prepended on Create).
          const seen = new Set<string>();
          return reconciled.filter((q) => {
            if (!q.fanBriefId) return true;
            if (seen.has(q.fanBriefId)) return false;
            seen.add(q.fanBriefId);
            return true;
          });
        });

        // Make sure the next refetch picks up these brief IDs as already-
        // surfaced (the merge effect dedupes by fanBriefId so this is mostly
        // belt-and-suspenders, but it also keeps the cache fresh).
        queryClient.invalidateQueries({
          queryKey: ["fan-briefs-v2-approved", labelId],
        });

        toast({
          title: `${briefs?.length ?? 0} brief${(briefs?.length ?? 0) === 1 ? "" : "s"} ready`,
          description: stage || "Now in Review — schedule when ready.",
        });
        return;
      }

      if (status === "failed") {
        settledJobsRef.current.add(jobId);
        setQueue((prev) => {
          if (
            !prev.some(
              (q) => q.fanBriefJobId === jobId && q.status === "generating",
            )
          ) {
            return prev;
          }
          return prev.map((q) =>
            q.fanBriefJobId === jobId && q.status === "generating"
              ? {
                  ...q,
                  status: "failed",
                  jobError: errorMessage ?? "Pipeline failed",
                  jobStage: undefined,
                }
              : q,
          );
        });
        toast({
          title: "Generation failed",
          description: errorMessage ?? "Pipeline error",
          variant: "destructive",
        });
        return;
      }

      // discovering / mining / synthesizing — just update the stage label.
      const stageLabel = stage ?? statusFallbackLabel(status);
      setQueue((prev) =>
        prev.map((q) =>
          q.fanBriefJobId === jobId ? { ...q, jobStage: stageLabel } : q,
        ),
      );
    },
    [labelId, queryClient],
  );

  // Pull the current row for a job and reconcile. Used to catch up after a
  // Realtime miss (WS race on subscribe, silent disconnect, throttled hidden
  // tab). Reconciler handles complete/failed/in-flight uniformly.
  const MAX_RECONCILE_ERRORS = 3;
  const fetchAndReconcileJob = useCallback(
    async (jobId: string) => {
      const { data, error } = await supabase
        .from("fan_brief_jobs")
        .select(
          "status, current_stage, error_message, produced_brief_ids, created_at",
        )
        .eq("id", jobId)
        .maybeSingle();
      if (error || !data) {
        const nextCount = (jobErrorCountsRef.current.get(jobId) ?? 0) + 1;
        jobErrorCountsRef.current.set(jobId, nextCount);
        console.error("[fan-brief-reconcile] fetch failed", {
          jobId,
          attempt: nextCount,
          error,
        });
        if (
          nextCount >= MAX_RECONCILE_ERRORS &&
          !settledJobsRef.current.has(jobId)
        ) {
          settledJobsRef.current.add(jobId);
          setQueue((prev) =>
            prev.map((q) =>
              q.fanBriefJobId === jobId && q.status === "generating"
                ? {
                    ...q,
                    status: "failed",
                    jobError:
                      "Couldn't reach job status. The briefs may still land — please refresh.",
                    jobStage: undefined,
                  }
                : q,
            ),
          );
          toast({
            title: "Job status unreachable",
            description:
              "Lost contact with the briefs service. Refresh to retry.",
            variant: "destructive",
          });
        }
        return;
      }
      // Reset the error counter on a successful read.
      jobErrorCountsRef.current.delete(jobId);
      await reconcileJobUpdate(jobId, data as Record<string, unknown>);
    },
    [reconcileJobUpdate],
  );

  useEffect(() => {
    const activeJobIds = new Set<string>();
    for (const q of queue) {
      if (q.status === "generating" && q.fanBriefJobId) {
        activeJobIds.add(q.fanBriefJobId);
      }
    }

    // Subscribe to any newly-active jobs.
    for (const jobId of activeJobIds) {
      if (channelsRef.current.has(jobId)) continue;
      const channel = supabase
        .channel(`fan-brief-job-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "fan_brief_jobs",
            filter: `id=eq.${jobId}`,
          },
          (payload) => {
            void reconcileJobUpdate(
              jobId,
              payload.new as Record<string, unknown>,
            );
          },
        )
        .subscribe((status) => {
          // Catch-up fetch the moment we're subscribed — closes the race
          // where the worker advanced before our channel was live.
          if (status === "SUBSCRIBED") {
            void fetchAndReconcileJob(jobId);
            return;
          }
          // Non-SUBSCRIBED terminal statuses indicate Realtime is degraded.
          // Log so we can diagnose; the 15s polling below covers correctness.
          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            console.warn("[fan-brief-realtime] subscription degraded", {
              jobId,
              status,
            });
          }
        });
      channelsRef.current.set(jobId, channel);
    }

    // Drop subscriptions whose jobs have settled (no longer in 'generating').
    for (const [jobId, channel] of channelsRef.current.entries()) {
      if (!activeJobIds.has(jobId)) {
        supabase.removeChannel(channel);
        channelsRef.current.delete(jobId);
      }
    }

    // Polling fallback: Realtime can drop silently (network blip, browser
    // throttling a hidden tab) and there's no way to detect it. Re-fetch
    // every 15s while visible / 30s when backgrounded — Realtime is the
    // primary signal and the poll is just a safety net, so a slower hidden
    // cadence cuts Supabase load without hurting UX.
    if (activeJobIds.size === 0) return;
    return setupVisibilityAwareInterval(15_000, 30_000, () => {
      for (const jobId of activeJobIds) void fetchAndReconcileJob(jobId);
    });
  }, [queue, reconcileJobUpdate, fetchAndReconcileJob]);

  // Unmount: drop every channel that the per-job effect didn't get to drain.
  // Logs if anything's left — that's a leak signal and worth seeing.
  useEffect(() => {
    const channels = channelsRef.current;
    return () => {
      if (channels.size > 0) {
        console.warn("[fan-brief-realtime] unmount draining channels", {
          remaining: channels.size,
        });
      }
      for (const channel of channels.values()) {
        supabase.removeChannel(channel);
      }
      channels.clear();
    };
  }, []);

  // ── Cartoon pipeline orchestration ──────────────────────────────────────
  // Hydrates cartoon QueueItems from localStorage on label change so the user
  // sees in-flight + completed runs after a refresh; persists every state
  // change back so the list stays current.
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    if (!labelId) return;
    const snapshots = loadCartoonRuns(labelId);
    if (snapshots.length === 0) return;
    setQueue((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const additions = snapshots
        .filter((s) => !existingIds.has(s.itemId))
        .map(itemFromSnapshot);
      if (additions.length === 0) return prev;
      return [...additions, ...prev];
    });
  }, [labelId]);

  // Persist cartoon snapshots back to localStorage whenever the queue
  // changes. The first fire for a given labelId is SKIPPED — the load
  // effect above schedules a setQueue with localStorage's content, but
  // that hasn't applied yet when the save effect runs in the same flush.
  // Without this guard, the empty INITIAL_QUEUE wipes localStorage, and
  // any page lifecycle event (navigation, route change, hot reload) that
  // fires before the next render kills the snapshot. This is the bug
  // that made cartoons silently disappear on refresh.
  const cartoonSaveSkippedForLabelRef = useRef<string | null>(null);
  useEffect(() => {
    if (!labelId) return;
    if (cartoonSaveSkippedForLabelRef.current !== labelId) {
      cartoonSaveSkippedForLabelRef.current = labelId;
      return;
    }
    const snapshots = queue
      .map(snapshotFromItem)
      .filter((s): s is NonNullable<typeof s> => s !== null);
    saveCartoonRuns(labelId, snapshots);
  }, [labelId, queue]);

  // DB-backed rehydrate for cartoons. localStorage is a best-effort cache;
  // it loses runs when HMR / refresh hits before the SSE first event lands
  // (the placeholder gets persisted without `cartoonChatJobId`, so the
  // reconciler can't pick up where it left off). cartoon_scripts has
  // label_id + source_chat_job_id, so we can rebuild the placeholder from
  // the DB regardless of FE state.
  //
  // Window: last 24h, max 50 rows. Older runs are functionally historical;
  // if the user wants those they belong in a feed, not Review.
  const recentCartoonScriptsQuery = useQuery({
    queryKey: ["cartoon-scripts-recent", labelId],
    enabled: !!labelId,
    staleTime: 30_000,
    // Initial fetch always runs (it's how we discover orphans). Periodic
    // polling only when something is in flight — the moment all cartoons
    // hit a terminal state, polling stops and starts again on next push.
    refetchInterval: queue.some(
      (q) => q.outputType === "cartoon" && q.status === "generating",
    )
      ? 30_000
      : false,
    queryFn: async (): Promise<CartoonScriptRow[]> => {
      // 7-day window. 24h was too tight — a cartoon rendered yesterday
      // afternoon disappears from the rehydrate query the next morning,
      // even though it's still very much "in the queue" from the user's
      // POV. 7d covers any reasonable "I want to see what I've made
      // recently" while still bounding the response.
      const cutoff = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabase
        .from("cartoon_scripts")
        .select(
          "id, status, label_id, artist_handle, artist_name, source_chat_job_id, script_json, created_at, voice_id_used, cartoon_videos(id, status, final_url)",
        )
        .eq("label_id", labelId!)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      // Tag each row with its source format so the merge effect can route
      // to the right failed-status set / error label / cartoonFormat field
      // without re-querying.
      return (data ?? []).map((r) => ({
        ...r,
        format: "cartoon" as CartoonFormat,
      })) as unknown as CartoonScriptRow[];
    },
  });

  // Sibling query against realfootage_scripts. Same shape, same window,
  // same staleTime — diff is the table + cartoonFormat tag. Without this,
  // a realfootage card disappears on refresh after localStorage expires
  // (the cartoon_scripts query has no idea it exists), and even when it
  // sticks around via localStorage it never gets a fresh status read for
  // failure cases like materializing_failed.
  const recentRealfootageScriptsQuery = useQuery({
    queryKey: ["realfootage-scripts-recent", labelId],
    enabled: !!labelId,
    staleTime: 30_000,
    refetchInterval: queue.some(
      (q) =>
        q.outputType === "cartoon" &&
        q.cartoonFormat === "realfootage" &&
        q.status === "generating",
    )
      ? 30_000
      : false,
    queryFn: async (): Promise<CartoonScriptRow[]> => {
      const cutoff = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabase
        .from("realfootage_scripts")
        .select(
          "id, status, label_id, artist_handle, artist_name, source_chat_job_id, script_json, created_at, voice_id_used, realfootage_videos(id, status, final_url)",
        )
        .eq("label_id", labelId!)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        format: "realfootage" as CartoonFormat,
      })) as unknown as CartoonScriptRow[];
    },
  });

  // Merge DB rows into the queue. Three paths:
  //   • Existing item matched by cartoonScriptId → patch any fields that
  //     advanced (status, stage, finalUrl, jobError).
  //   • Existing item with cartoonChatJobId but no cartoonScriptId yet
  //     (mid-script-phase placeholder) → patch in cartoonScriptId so the
  //     reconciler graduates from chat_jobs to cartoon_scripts watching.
  //   • DB row with no in-memory match → prepend a fresh QueueItem. This
  //     is the recovery path after HMR / refresh wiped the placeholder.
  //
  // Items locally killed (status='scheduled' or absent because user
  // dismissed) aren't resurrected: we only patch by ID match.
  useEffect(() => {
    // Merge both pipelines into one tagged list. Either query can be empty
    // (e.g. user has no realfootage scripts in the last 7d) — combine
    // whatever's available.
    const cartoonRows = recentCartoonScriptsQuery.data ?? [];
    const realfootageRows = recentRealfootageScriptsQuery.data ?? [];
    const scripts: CartoonScriptRow[] = [...cartoonRows, ...realfootageRows];
    if (scripts.length === 0) return;
    setQueue((prev) => {
      let mutated = false;
      const claimed = new Set<string>();

      const patched = prev.map((q) => {
        if (q.outputType !== "cartoon") return q;

        let row: CartoonScriptRow | undefined;
        if (q.cartoonScriptId) {
          row = scripts.find((s) => s.id === q.cartoonScriptId);
        }
        if (!row && q.cartoonChatJobId) {
          row = scripts.find(
            (s) => s.source_chat_job_id === q.cartoonChatJobId,
          );
        }
        if (!row) return q;
        claimed.add(row.id);

        const derived = deriveCartoonItemState(row);
        // Don't downgrade locally-scheduled items back to pending.
        const nextStatus =
          q.status === "scheduled" ? "scheduled" : derived.status;
        const nextHook = row.script_json?.hook_title ?? q.cartoonHook;
        const nextScriptId = q.cartoonScriptId ?? row.id;
        const nextChatJobId =
          q.cartoonChatJobId ?? row.source_chat_job_id ?? undefined;
        const nextThumb = derived.thumbnailUrl ?? q.thumbnailUrl;
        // Backfill voice_id from the DB row when the in-memory placeholder
        // never picked it up (DB-only rehydrate after localStorage expired).
        // Don't overwrite an already-set local value — the user's original
        // pick is more trustworthy than what the dispatcher echoed back.
        const nextVoiceId = q.cartoonVoiceId ?? row.voice_id_used ?? undefined;
        // Trust the matched row's pipeline over a missing/stale local tag.
        // Critical when matching by chat_job_id before the dispatcher echo
        // landed: a realfootage row is the source of truth for format.
        const nextFormat = row.format ?? q.cartoonFormat;
        const changed =
          q.cartoonScriptId !== nextScriptId ||
          q.cartoonChatJobId !== nextChatJobId ||
          q.cartoonStage !== derived.stage ||
          q.cartoonStageDetail !== derived.stageDetail ||
          q.cartoonFinalUrl !== derived.finalUrl ||
          q.renderedClipUrl !== derived.finalUrl ||
          q.cartoonHook !== nextHook ||
          q.jobError !== derived.jobError ||
          q.status !== nextStatus ||
          q.thumbnailUrl !== nextThumb ||
          q.cartoonVoiceId !== nextVoiceId ||
          q.cartoonFormat !== nextFormat;
        if (!changed) return q;
        mutated = true;
        return {
          ...q,
          cartoonScriptId: nextScriptId,
          cartoonChatJobId: nextChatJobId,
          cartoonStage: derived.stage,
          cartoonStageDetail: derived.stageDetail,
          cartoonFinalUrl: derived.finalUrl,
          renderedClipUrl: derived.finalUrl ?? q.renderedClipUrl,
          cartoonHook: nextHook,
          jobError: derived.jobError,
          status: nextStatus,
          thumbnailUrl: nextThumb,
          cartoonVoiceId: nextVoiceId,
          cartoonFormat: nextFormat,
        };
      });

      const additions: QueueItem[] = [];
      for (const row of scripts) {
        if (claimed.has(row.id)) continue;
        additions.push(buildCartoonItemFromScript(row));
      }

      if (!mutated && additions.length === 0) return prev;
      return additions.length > 0 ? [...additions, ...patched] : patched;
    });
  }, [recentCartoonScriptsQuery.data, recentRealfootageScriptsQuery.data]);

  // Process-local gate against double-firing cartoon-vo when a Realtime
  // UPDATE event and a polling tick race after chat_jobs flips to complete.
  // setQueue alone can't gate this — there's a render delay between the
  // setQueue call and queueRef catching up, so concurrent reconciles read
  // the old item with `cartoonVoCallInFlight` still false. A synchronous
  // Set<itemId> is the only thing that closes the window.
  const cartoonReconcileLocksRef = useRef<Set<string>>(new Set());

  // Single-item reconciler — reads chat_jobs / cartoon_scripts /
  // cartoon_videos and applies the resulting patch to the QueueItem.
  const reconcileCartoon = useCallback(async (item: QueueItem) => {
    if (cartoonReconcileLocksRef.current.has(item.id)) return;
    cartoonReconcileLocksRef.current.add(item.id);
    try {
      const patch = await reconcileCartoonItem(item);
      if (!patch) return;
      setQueue((prev) =>
        prev.map((q) => {
          if (q.id !== item.id) return q;
          const next = { ...q, ...patch } as QueueItem;
          delete next.cartoonVoCallInFlight;
          return next;
        }),
      );
    } finally {
      cartoonReconcileLocksRef.current.delete(item.id);
    }
  }, []);

  const fetchAndReconcileCartoonById = useCallback(
    async (itemId: string) => {
      const item = queueRef.current.find((q) => q.id === itemId);
      if (!item || item.outputType !== "cartoon") return;
      if (item.status !== "generating") return;

      // Stale-cartoon timeout: cartoons take 15-20 min end-to-end, so 45
      // minutes of no progress is solid "this run is dead" territory. Mark
      // failed locally so the user isn't watching a stuck spinner forever.
      const CARTOON_STALE_MS = 45 * 60 * 1000;
      const startedMs = Date.parse(item.createdAt);
      if (
        Number.isFinite(startedMs) &&
        Date.now() - startedMs > CARTOON_STALE_MS
      ) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId && q.status === "generating"
              ? {
                  ...q,
                  status: "failed",
                  jobError:
                    "Story stalled — pipeline didn't finish in 45 min. The video may still finish later.",
                  cartoonStage: undefined,
                }
              : q,
          ),
        );
        return;
      }

      await reconcileCartoon(item);
    },
    [reconcileCartoon],
  );

  // Realtime channels keyed per cartoon item, swapped when the lifecycle
  // moves from chat_jobs (script phase) to cartoon_scripts (render phase).
  const cartoonChannelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  useEffect(() => {
    const activeCartoons = queue.filter(
      (q) => q.outputType === "cartoon" && q.status === "generating",
    );

    const desiredKeys = new Set<string>();
    for (const item of activeCartoons) {
      if (item.cartoonScriptId) {
        desiredKeys.add(`script-${item.id}-${item.cartoonScriptId}`);
      } else if (item.cartoonChatJobId) {
        desiredKeys.add(`chat-${item.id}-${item.cartoonChatJobId}`);
      }
    }

    for (const item of activeCartoons) {
      if (item.cartoonScriptId) {
        const key = `script-${item.id}-${item.cartoonScriptId}`;
        if (cartoonChannelsRef.current.has(key)) continue;
        // Realfootage items live in their own pair of tables. The cartoon
        // realtime publication doesn't broadcast realfootage row changes,
        // so without this branch a materializing_failed status sits in the
        // DB without ever flipping the queue card to Failed (until the 15s
        // polling fallback catches up).
        const format: CartoonFormat = item.cartoonFormat ?? "cartoon";
        const scriptsTable =
          format === "realfootage" ? "realfootage_scripts" : "cartoon_scripts";
        const videosTable =
          format === "realfootage" ? "realfootage_videos" : "cartoon_videos";
        const ch = supabase
          .channel(`cf-${format}-${item.id}-${item.cartoonScriptId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: scriptsTable,
              filter: `id=eq.${item.cartoonScriptId}`,
            },
            () => void fetchAndReconcileCartoonById(item.id),
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: videosTable,
              filter: `script_id=eq.${item.cartoonScriptId}`,
            },
            () => void fetchAndReconcileCartoonById(item.id),
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: videosTable,
              filter: `script_id=eq.${item.cartoonScriptId}`,
            },
            () => void fetchAndReconcileCartoonById(item.id),
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              void fetchAndReconcileCartoonById(item.id);
              return;
            }
            if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              console.warn("[cartoon-realtime] script subscription degraded", {
                itemId: item.id,
                scriptId: item.cartoonScriptId,
                format,
                status,
              });
            }
          });
        cartoonChannelsRef.current.set(key, ch);
      } else if (item.cartoonChatJobId) {
        const key = `chat-${item.id}-${item.cartoonChatJobId}`;
        if (cartoonChannelsRef.current.has(key)) continue;
        const ch = supabase
          .channel(`cf-cartoon-chat-${item.id}-${item.cartoonChatJobId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "chat_jobs",
              filter: `id=eq.${item.cartoonChatJobId}`,
            },
            () => void fetchAndReconcileCartoonById(item.id),
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              void fetchAndReconcileCartoonById(item.id);
              return;
            }
            if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              console.warn(
                "[cartoon-realtime] chat-job subscription degraded",
                {
                  itemId: item.id,
                  chatJobId: item.cartoonChatJobId,
                  status,
                },
              );
            }
          });
        cartoonChannelsRef.current.set(key, ch);
      }
    }

    // Tear down any channels whose item no longer needs them (lifecycle
    // moved on, or the run completed/failed).
    for (const [key, ch] of cartoonChannelsRef.current.entries()) {
      if (!desiredKeys.has(key)) {
        supabase.removeChannel(ch);
        cartoonChannelsRef.current.delete(key);
      }
    }

    if (activeCartoons.length === 0) return;

    // Polling fallback — 15s visible / 30s hidden. Realtime is primary; this
    // is the safety net that keeps stuck items moving when a UPDATE event
    // gets dropped or a hidden tab misses a window.
    return setupVisibilityAwareInterval(15_000, 30_000, () => {
      for (const item of activeCartoons) {
        void fetchAndReconcileCartoonById(item.id);
      }
    });
  }, [queue, fetchAndReconcileCartoonById]);

  useEffect(() => {
    const channels = cartoonChannelsRef.current;
    return () => {
      if (channels.size > 0) {
        console.warn("[cartoon-realtime] unmount draining channels", {
          remaining: channels.size,
        });
      }
      for (const ch of channels.values()) {
        supabase.removeChannel(ch);
      }
      channels.clear();
    };
  }, []);

  // Wizard handoff — pushes N placeholder cartoon QueueItems to Review with
  // status='generating', kicks off one SSE label-chat stream per run, and
  // captures `chat_job_id` from the first SSE event into the matching item.
  // The reconciler picks up from there.
  const handleCartoonGenerate = useCallback(
    async (input: CartoonGenerateInput) => {
      if (!labelId) {
        toast({
          title: "No label session",
          description: "Story generation requires a logged-in label.",
          variant: "destructive",
        });
        return;
      }
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast({
          title: "Session expired",
          description: "Please refresh and sign in again.",
          variant: "destructive",
        });
        return;
      }

      const {
        artistName,
        artistHandle,
        count,
        voiceId,
        voiceSettings,
        leadHunterJobId,
        selectedLead,
        subFormat,
      } = input;
      const isRealfootage = subFormat === "realfootage";
      const now = new Date().toISOString();
      const newItems: QueueItem[] = Array.from({ length: count }, () => ({
        id: `q-cartoon-${crypto.randomUUID()}`,
        artistId: `cartoon-${artistHandle}`,
        artistDisplayName: artistName,
        artistDisplayHandle: artistHandle,
        title: `${FORMAT_TITLE_PREFIX[subFormat]} · ${artistName} — ${selectedLead.working_title}`,
        outputType: "cartoon",
        source: "human",
        status: "generating",
        risk: "low",
        riskNotes: [],
        thumbKind: "video",
        createdAt: now,
        cartoonStage: "script",
        cartoonVoiceId: voiceId,
        cartoonVoiceSettings: voiceSettings,
        cartoonLeadHunterJobId: leadHunterJobId,
        cartoonSelectedLead: selectedLead,
        // Optimistic — vo-dispatch's response confirms it but the UI can show
        // the right label from the moment the placeholder lands.
        cartoonFormat: subFormat,
      }));

      setQueue((prev) => [...newItems, ...prev]);
      setActiveTab("assets");

      // The cartoon_writer prompt produces the same JSON shape for both sub-
      // formats; the only contract difference is the top-level `format` field
      // which content-factory-vo-dispatch reads to route to cartoon-vo vs
      // realfootage-vo. We pass the hint in the user message so the writer
      // tags the JSON correctly.
      const writerMessage = buildStoryWriterMessage({
        artistName,
        isRealfootage,
        selectedLead,
      });

      // Same key the Tune drawer in CreateView writes to. Reading at dispatch
      // time avoids prop-drilling the model preference through 4 layers.
      let scriptModel: string | undefined;
      try {
        const saved = window.localStorage.getItem("wavebound_cf_script_model");
        if (
          saved === "claude-opus-4-7" ||
          saved === "claude-sonnet-4-6" ||
          saved === "gpt-5.5"
        )
          scriptModel = saved;
      } catch {
        /* localStorage disabled — fall back to backend default (Opus 4.7) */
      }

      for (const item of newItems) {
        const sessionId = crypto.randomUUID();
        void streamChatMessage(
          {
            message: writerMessage,
            session_id: sessionId,
            role: "cartoon_writer",
            ...(scriptModel ? { model: scriptModel } : {}),
          },
          {
            onJobId: (jobId) => {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id ? { ...q, cartoonChatJobId: jobId } : q,
                ),
              );
            },
            onError: (err) => {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id
                    ? {
                        ...q,
                        status: "failed",
                        jobError: err || "Script stream errored",
                      }
                    : q,
                ),
              );
            },
          },
          undefined,
          "label-chat",
        ).catch((err) => {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: "failed",
                    jobError:
                      err instanceof Error
                        ? err.message
                        : "Script stream failed",
                  }
                : q,
            ),
          );
        });
      }

      toast({
        title: `Generating ${count} stor${count === 1 ? "y" : "ies"}`,
        description: `Using “${selectedLead.working_title}” for ${artistName} — script first, end-to-end ~15-20 min.`,
      });
    },
    [labelId, setActiveTab],
  );

  // ── Lyric Overlay (link_video) pipeline orchestration ──────────────────
  // Mirrors the cartoon plumbing: hydrate from sessionStorage on label
  // change, persist back on queue change, poll content-factory-status every
  // 3s for in-flight items. The legacy /label/content-factory page used a
  // 3s interval too — the pipeline reports stage transitions at that
  // cadence and the UI feels live.

  // Rehydrate in-flight link_video runs after a refresh. Only pulls back
  // jobs younger than 30 min (legacy ACTIVE_JOB_MAX_AGE_MS) so we don't
  // resurrect stale placeholders forever.
  useEffect(() => {
    if (!labelId) return;
    const snapshots = loadLinkVideoRuns(labelId);
    if (snapshots.length === 0) return;
    const MAX_AGE_MS = 30 * 60 * 1000;
    const fresh = snapshots.filter((s) => {
      const t = Date.parse(s.startedAt);
      return Number.isFinite(t) && Date.now() - t < MAX_AGE_MS;
    });
    if (fresh.length === 0) {
      saveLinkVideoRuns(labelId, []);
      return;
    }
    if (fresh.length !== snapshots.length) {
      saveLinkVideoRuns(labelId, fresh);
    }
    setQueue((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const additions = fresh
        .filter((s) => !existingIds.has(s.itemId))
        .map(linkVideoItemFromSnapshot);
      if (additions.length === 0) return prev;
      return [...additions, ...prev];
    });
  }, [labelId]);

  // Same first-fire skip pattern as the cartoon save effect — see comment
  // there for why this matters. Without the skip, the empty INITIAL_QUEUE
  // wipes link_video sessionStorage on the first labelId-load tick.
  const linkVideoSaveSkippedForLabelRef = useRef<string | null>(null);
  useEffect(() => {
    if (!labelId) return;
    if (linkVideoSaveSkippedForLabelRef.current !== labelId) {
      linkVideoSaveSkippedForLabelRef.current = labelId;
      return;
    }
    const snapshots = queue
      .map(linkVideoSnapshotFromItem)
      .filter((s): s is NonNullable<typeof s> => s !== null);
    saveLinkVideoRuns(labelId, snapshots);
  }, [labelId, queue]);

  // DB-backed rehydrate for link_video. sessionStorage is the instant
  // best-effort cache; `cf_jobs` is the canonical source of truth. Same
  // architecture as `recentCartoonScriptsQuery` — a hard refresh, HMR, or
  // a fresh tab can never orphan a run.
  //
  // Window: last 24h, max 50. Older runs are functionally historical.
  const recentCfJobsQuery = useQuery({
    queryKey: ["cf-jobs-recent", labelId],
    enabled: !!labelId,
    staleTime: 30_000,
    // Same gating as cartoon: initial fetch always runs (orphan discovery),
    // periodic polling only when at least one link_video item is generating.
    refetchInterval: queue.some(
      (q) => q.outputType === "link_video" && q.status === "generating",
    )
      ? 30_000
      : false,
    queryFn: async (): Promise<CfJobRow[]> => {
      // 7d, same reasoning as recentCartoonScriptsQuery above.
      const cutoff = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabase
        .from("cf_jobs")
        .select(
          "id, label_id, artist_handle, ref_tiktok_url, status, error, final_url, cost_cents, created_at, updated_at",
        )
        .eq("label_id", labelId!)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as CfJobRow[];
    },
  });

  // Merge cf_jobs rows into the queue. Two paths:
  //   • Existing item matched by linkVideoJobId → patch any fields that
  //     advanced (status, stage, finalUrl, jobError, cost).
  //   • DB row with no in-memory match → prepend a fresh QueueItem. This
  //     is the recovery path after refresh/HMR wiped the placeholder.
  // Locally-`scheduled` items aren't downgraded.
  useEffect(() => {
    const jobs = recentCfJobsQuery.data;
    if (!jobs || jobs.length === 0) return;
    setQueue((prev) => {
      let mutated = false;
      const claimed = new Set<string>();

      const patched = prev.map((q) => {
        if (q.outputType !== "link_video" || !q.linkVideoJobId) return q;
        const row = jobs.find((j) => j.id === q.linkVideoJobId);
        if (!row) return q;
        claimed.add(row.id);

        const derived = deriveLinkVideoItemState(row);
        const nextStatus =
          q.status === "scheduled" ? "scheduled" : derived.status;
        const nextRendered = derived.renderedClipUrl ?? q.renderedClipUrl;
        const changed =
          q.linkVideoStage !== derived.linkVideoStage ||
          q.jobStage !== derived.jobStage ||
          q.jobError !== derived.jobError ||
          q.linkVideoCostCents !== (row.cost_cents ?? undefined) ||
          q.renderedClipUrl !== nextRendered ||
          q.linkVideoRefUrl !== (row.ref_tiktok_url ?? q.linkVideoRefUrl) ||
          q.status !== nextStatus;
        if (!changed) return q;
        mutated = true;
        return {
          ...q,
          status: nextStatus,
          linkVideoStage: derived.linkVideoStage,
          linkVideoCostCents: row.cost_cents ?? undefined,
          linkVideoRefUrl: row.ref_tiktok_url ?? q.linkVideoRefUrl,
          renderedClipUrl: nextRendered,
          jobStage: derived.jobStage,
          jobError: derived.jobError,
        };
      });

      const additions: QueueItem[] = [];
      for (const row of jobs) {
        if (claimed.has(row.id)) continue;
        additions.push(buildLinkVideoItemFromJob(row));
      }

      if (!mutated && additions.length === 0) return prev;
      return additions.length > 0 ? [...additions, ...patched] : patched;
    });
  }, [recentCfJobsQuery.data]);

  // Single-item reconciler. Same shape as reconcileCartoon but no Realtime
  // channel — content-factory-status is the canonical read path.
  const reconcileLinkVideo = useCallback(async (item: QueueItem) => {
    const patch = await reconcileLinkVideoItem(item);
    if (!patch) return;
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, ...patch } : q)),
    );
  }, []);

  const fetchAndReconcileLinkVideoById = useCallback(
    async (itemId: string) => {
      const item = queueRef.current.find((q) => q.id === itemId);
      if (!item || item.outputType !== "link_video") return;
      if (item.status !== "generating") return;

      // Stale-job timeout: legacy pipeline finishes in 4–8 min typical, so
      // 30 min is a clear "this run is dead" signal. Mark failed locally so
      // the user isn't watching a stuck spinner forever.
      const STALE_MS = 30 * 60 * 1000;
      const startedMs = Date.parse(item.createdAt);
      if (Number.isFinite(startedMs) && Date.now() - startedMs > STALE_MS) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId && q.status === "generating"
              ? {
                  ...q,
                  status: "failed",
                  jobError:
                    "Job stalled — pipeline didn't finish in 30 min. The MP4 may still finish later.",
                  linkVideoStage: "error",
                  jobStage: undefined,
                }
              : q,
          ),
        );
        return;
      }

      await reconcileLinkVideo(item);
    },
    [reconcileLinkVideo],
  );

  // 3s polling tick across every in-flight link_video item, plus a
  // visibility-change catch-up so a hidden tab catches up on focus instead
  // of relying on the wall-clock tick.
  useEffect(() => {
    const active = queue.filter(
      (q) => q.outputType === "link_video" && q.status === "generating",
    );
    if (active.length === 0) return;

    // Link Video has no Realtime publication — polling IS the signal.
    // Stay aggressive when visible (3s) and back off when hidden (15s) so
    // a forgotten tab doesn't hammer cf_jobs but a watching user still
    // sees fast updates.
    return setupVisibilityAwareInterval(3_000, 15_000, () => {
      for (const item of active) {
        void fetchAndReconcileLinkVideoById(item.id);
      }
    });
  }, [queue, fetchAndReconcileLinkVideoById]);

  // Wizard handoff — push one placeholder QueueItem to Review with
  // status='generating', flip to the Review tab, let the polling tick own
  // the lifecycle from here.
  const handleLinkVideoJob = useCallback(
    ({
      jobId,
      artistHandle,
      refUrl,
      transcribeProvider,
    }: LinkVideoJobInput) => {
      const placeholder: QueueItem = {
        id: `q-linkvideo-${jobId}`,
        artistId: `linkvideo-${artistHandle}`,
        artistDisplayName: `@${artistHandle}`,
        artistDisplayHandle: artistHandle,
        title: `Lyric Overlay · @${artistHandle}`,
        outputType: "link_video",
        source: "human",
        status: "generating",
        risk: "low",
        riskNotes: [],
        thumbKind: "link",
        createdAt: new Date().toISOString(),
        linkVideoJobId: jobId,
        linkVideoRefUrl: refUrl,
        linkVideoTranscribeProvider: transcribeProvider,
        linkVideoStage: "pending",
        jobStage: "Queued — pipeline picking up.",
      };
      setQueue((prev) => [placeholder, ...prev]);
      setActiveTab("assets");
      toast({
        title: "Generating from TikTok ref",
        description: `for @${artistHandle} — pipeline runs ~4–8 min.`,
      });
    },
    [setActiveTab],
  );

  // Review handlers
  // Schedule slot is mock for now (the v1 release-cadence engine isn't wired
  // yet), but for fan-brief items we persist it to fan_briefs.generation_context.scheduled_for
  // so the schedule survives a refresh. Other output types (cartoon, etc.)
  // still mutate in-memory only — they have their own persistence layers.
  const handleApproveSchedule = useCallback(
    async (itemId: string) => {
      const when = mockScheduleSlot();
      const item = queue.find((q) => q.id === itemId);
      const fanBriefId = item?.fanBriefId;

      // Optimistically update local state so the card moves to Scheduled
      // immediately; revert on backend failure.
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? { ...q, status: "scheduled", scheduledFor: when }
            : q,
        ),
      );
      toast({
        title: "Approved & scheduled",
        description: `Drops ${when} · find it under Scheduled.`,
      });

      if (!fanBriefId) return;

      // Read current generation_context, merge scheduled_for, write back. We
      // can't use a Postgres jsonb operator from the JS client, so we do a
      // read-modify-write — fine for a single-user-action mutation.
      const { data: current, error: readErr } = await supabase
        .from("fan_briefs")
        .select("generation_context")
        .eq("id", fanBriefId)
        .maybeSingle();
      if (readErr) {
        console.error(
          "[approve-schedule] failed to read generation_context",
          readErr,
        );
      }
      const merged = {
        ...((current?.generation_context as Record<string, unknown>) ?? {}),
        scheduled_for: when,
      };
      const { error: writeErr } = await supabase
        .from("fan_briefs")
        .update({ generation_context: merged })
        .eq("id", fanBriefId);
      if (writeErr) {
        console.error(
          "[approve-schedule] failed to persist scheduled_for",
          writeErr,
        );
        // Revert optimistic update so the user sees the failure rather
        // than thinking it stuck.
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? { ...q, status: "pending", scheduledFor: undefined }
              : q,
          ),
        );
        toast({
          title: "Schedule didn't persist",
          description: writeErr.message,
          variant: "destructive",
        });
        return;
      }
      // Refresh the cached briefs so a refetch sees the updated slot.
      queryClient.invalidateQueries({
        queryKey: ["fan-briefs-v2-approved", labelId],
      });
    },
    [queue, queryClient, labelId],
  );

  const handleSendToTune = useCallback((_itemId: string) => {
    toast({
      title: "Send to Tune",
      description: "Would open Tune drawer in v1.",
    });
  }, []);

  // Retry a failed/stalled queue item using the same settings the user
  // originally picked. Branches by outputType:
  //
  //   • fan_brief  → clear render_error on the fan_briefs row; the worker's
  //                  Realtime UPDATE handler re-queues it (status=approved
  //                  AND no clip AND no render_error fires automatically).
  //   • cartoon    → re-fire the writer chat stream with the original
  //                  artistName/handle/voice — same prompt, same voice id +
  //                  voice settings, fresh chat job.
  //   • link_video → re-invoke content-factory-generate with the original
  //                  artist_handle / ref_tiktok_url / transcribe_provider;
  //                  swap the placeholder onto the new job_id.
  //
  // For yt_blocked / geo_blocked the user is choosing to try anyway — could
  // work if the worker's IP situation changed since the original failure.
  const handleRetryRender = useCallback(
    async (itemId: string) => {
      const item = queue.find((q) => q.id === itemId);
      if (!item) return;

      const priorAttempts = item.retryCount ?? 0;
      if (priorAttempts >= RETRY_MAX) {
        toast({
          title: `Already retried ${RETRY_MAX}×`,
          description:
            "The source — not the pipeline — is probably the issue. Dismiss and start a fresh job from a different angle.",
          variant: "destructive",
        });
        return;
      }
      const attemptNo = priorAttempts + 1;
      const originalError = item.jobError ?? item.renderError ?? null;
      logRetryAttempt({
        itemId,
        outputType: item.outputType,
        originalError,
        attempt: attemptNo,
      });

      // ── fan_brief ──────────────────────────────────────────────────────
      if (item.outputType === "fan_brief" || item.fanBriefId) {
        if (!item.fanBriefId) return;
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? {
                  ...q,
                  status: q.status === "failed" ? "pending" : q.status,
                  renderError: undefined,
                  renderStalled: false,
                  jobError: undefined,
                  retryCount: attemptNo,
                }
              : q,
          ),
        );
        toast({
          title: "Retrying render",
          description: "Worker will pick this back up within a few seconds.",
        });

        const { error } = await supabase
          .from("fan_briefs")
          .update({ render_error: null, render_error_at: null })
          .eq("id", item.fanBriefId);
        if (error) {
          console.error("[retry-render] failed to clear render_error", error);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId
                ? { ...q, renderError: item.renderError, renderStalled: true }
                : q,
            ),
          );
          toast({
            title: "Retry failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        queryClient.invalidateQueries({
          queryKey: ["fan-briefs-v2-approved", labelId],
        });
        return;
      }

      // ── cartoon ────────────────────────────────────────────────────────
      if (item.outputType === "cartoon") {
        const artistName = item.artistDisplayName ?? "this artist";
        const artistHandle = item.artistDisplayHandle ?? "";
        if (!item.cartoonVoiceId) {
          toast({
            title: "Can't retry this cartoon",
            description:
              "Original voice setting wasn't recorded — kick off a fresh one from Create.",
            variant: "destructive",
          });
          return;
        }

        // Two retry paths depending on how far the original run got:
        //   • chat_job exists → re-POST to content-factory-vo-dispatch with
        //     the same chat_job_id. Skips the writer phase, reuses the
        //     existing fenced JSON, and the VO functions are idempotent on
        //     source_chat_job_id so this won't duplicate scripts.
        //   • no chat_job → writer never produced one (e.g. SSE never landed
        //     a job_id). Restart the writer from scratch.
        // The dispatcher path is what the realfootage `materializing_failed`
        // case wants — re-running the writer there is wasteful and loses
        // the user's original story angle.
        if (item.cartoonChatJobId) {
          const chatJobId = item.cartoonChatJobId;
          const voiceId = item.cartoonVoiceId;
          const voiceSettings = item.cartoonVoiceSettings;
          const formatLabel =
            item.cartoonFormat === "realfootage" ? "real edit" : "cartoon";

          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId
                ? {
                    ...q,
                    status: "generating",
                    cartoonStage: "vo",
                    cartoonStageDetail: undefined,
                    cartoonScriptId: undefined,
                    cartoonHook: undefined,
                    cartoonFinalUrl: undefined,
                    cartoonVoCallInFlight: false,
                    jobError: undefined,
                    jobStage: undefined,
                    renderedClipUrl: undefined,
                    createdAt: new Date().toISOString(),
                    retryCount: attemptNo,
                    // KEEP: cartoonChatJobId, cartoonFormat, cartoonVoiceId,
                    // cartoonVoiceSettings, cartoonSelectedLead — the
                    // dispatcher/retry path needs these.
                  }
                : q,
            ),
          );
          toast({
            title: `Retrying ${formatLabel}`,
            description: `for ${artistName} — re-running render only, ~5–15 min.`,
          });

          try {
            // kickoff_source distinguishes user-clicked retry from the
            // FE-reconciler initial kick and the BE pg_cron sweeper in
            // dispatcher logs. See cartoonReconciler.ts for the matching
            // tag on the initial-kick path.
            console.info("[cf-dispatch-kick]", {
              source: "fe-retry",
              itemId,
              chatJobId,
              attempt: attemptNo,
              format: item.cartoonFormat ?? "cartoon",
              at: new Date().toISOString(),
            });
            const { data, error } = await supabase.functions.invoke(
              "content-factory-vo-dispatch",
              {
                body: {
                  chat_job_id: chatJobId,
                  kickoff_source: "fe-retry",
                  voice_id: voiceId,
                  ...(voiceSettings ? { voice_settings: voiceSettings } : {}),
                },
              },
            );
            if (error) throw error;
            const scriptId = (data?.script_id ?? data?.id) as
              | string
              | undefined;
            const dispatchedFormat: CartoonFormat =
              data?.format === "realfootage" ? "realfootage" : "cartoon";
            if (!scriptId) {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === itemId
                    ? {
                        ...q,
                        status: "failed",
                        jobError: "Render kick-off returned no script_id",
                      }
                    : q,
                ),
              );
              return;
            }
            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId
                  ? {
                      ...q,
                      cartoonScriptId: scriptId,
                      cartoonFormat: dispatchedFormat,
                    }
                  : q,
              ),
            );
          } catch (err) {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId
                  ? {
                      ...q,
                      status: "failed",
                      jobError:
                        err instanceof Error
                          ? err.message
                          : "Retry dispatch failed",
                    }
                  : q,
              ),
            );
          }
          void artistHandle;
          return;
        }

        // Fallback: writer never produced a chat_job_id. Restart the writer.
        const isRealfootageRetry = item.cartoonFormat === "realfootage";
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? {
                  ...q,
                  status: "generating",
                  cartoonStage: "script",
                  cartoonStageDetail: undefined,
                  cartoonChatJobId: undefined,
                  cartoonScriptId: undefined,
                  cartoonHook: undefined,
                  cartoonFinalUrl: undefined,
                  cartoonFormat: undefined,
                  cartoonVoCallInFlight: false,
                  jobError: undefined,
                  jobStage: undefined,
                  renderedClipUrl: undefined,
                  createdAt: new Date().toISOString(),
                  retryCount: attemptNo,
                }
              : q,
          ),
        );
        toast({
          title: `Retrying ${isRealfootageRetry ? "real edit" : "cartoon"}`,
          description: `for ${artistName} — script first, end-to-end ~15-20 min.`,
        });

        const writerMessage = buildStoryWriterMessage({
          artistName,
          isRealfootage: isRealfootageRetry,
          selectedLead: item.cartoonSelectedLead,
        });
        const sessionId = crypto.randomUUID();
        void streamChatMessage(
          {
            message: writerMessage,
            session_id: sessionId,
            role: "cartoon_writer",
          },
          {
            onJobId: (jobId) => {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === itemId ? { ...q, cartoonChatJobId: jobId } : q,
                ),
              );
            },
            onError: (err) => {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === itemId
                    ? {
                        ...q,
                        status: "failed",
                        jobError: err || "Script stream errored",
                      }
                    : q,
                ),
              );
            },
          },
          undefined,
          "label-chat",
        ).catch((err) => {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId
                ? {
                    ...q,
                    status: "failed",
                    jobError:
                      err instanceof Error
                        ? err.message
                        : "Script stream failed",
                  }
                : q,
            ),
          );
        });
        // Reference handle to silence unused-var when handle is empty.
        void artistHandle;
        return;
      }

      // ── link_video ─────────────────────────────────────────────────────
      if (item.outputType === "link_video") {
        const artistHandle = item.artistDisplayHandle;
        const refUrl = item.linkVideoRefUrl;
        const transcribeProvider =
          item.linkVideoTranscribeProvider ?? "audioshake";
        if (!labelId || !artistHandle || !refUrl) {
          toast({
            title: "Can't retry this Lyric Overlay",
            description:
              "Original ref URL or artist handle wasn't recorded — start a fresh job from Create.",
            variant: "destructive",
          });
          return;
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? {
                  ...q,
                  status: "generating",
                  linkVideoStage: "pending",
                  jobStage: "Queued — pipeline picking up.",
                  jobError: undefined,
                  renderedClipUrl: undefined,
                  createdAt: new Date().toISOString(),
                  retryCount: attemptNo,
                }
              : q,
          ),
        );
        toast({
          title: "Retrying Lyric Overlay",
          description: `for @${artistHandle} — pipeline runs ~4–8 min.`,
        });

        const { data, error: invokeError } = await supabase.functions.invoke(
          "content-factory-generate",
          {
            body: {
              label_id: labelId,
              artist_handle: artistHandle,
              ref_tiktok_url: refUrl,
              transcribe_provider: transcribeProvider,
            },
          },
        );
        if (invokeError) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId
                ? {
                    ...q,
                    status: "failed",
                    jobError: invokeError.message,
                  }
                : q,
            ),
          );
          toast({
            title: "Retry failed",
            description: invokeError.message,
            variant: "destructive",
          });
          return;
        }
        const newJobId = (data as { job_id?: string } | null)?.job_id ?? null;
        if (!newJobId) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId
                ? {
                    ...q,
                    status: "failed",
                    jobError: "No job_id returned from generate endpoint",
                  }
                : q,
            ),
          );
          return;
        }
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, linkVideoJobId: newJobId } : q,
          ),
        );
        return;
      }

      // Other output types don't have a retry path yet — kept silent so the
      // button remains harmless if it ever gets exposed for them.
      toast({
        title: "Nothing to retry",
        description: "This item type doesn't support retry yet.",
      });
    },
    [queue, queryClient, labelId],
  );

  // Hard-delete an Assets queue item. Yanks the in-memory card AND the
  // backing DB row so the item doesn't re-appear on the next refresh.
  // Replaces the old "Kill + feedback" archive-only flow that left
  // cartoon_scripts / realfootage_scripts / cf_jobs rows behind, which
  // recentCartoonScriptsQuery / recentRealfootageScriptsQuery / the
  // link_video rehydrate would resurrect on the next page load.
  //
  // FK cascades clean up child rows (cartoon_videos, cartoon_image_*,
  // realfootage_videos, realfootage_clip_*, etc.), so a single DELETE
  // on the script row is enough. RLS DELETE policies were added by
  // migration 20260427_cf_assets_label_user_delete_policies.sql.
  //
  // Edge case: a generating cartoon with only cartoonChatJobId (no script
  // row yet) leaves an orphaned chat_jobs entry. chat_jobs has no DELETE
  // policy for label users (it's the writer audit trail), so we let it
  // orphan. The pg_cron kickoff sweeper would normally re-create the
  // script row, but the user just deleted by intent — they'll only see
  // it return on a subsequent refresh, where they can delete again.
  // Acceptable for "for now"; revisit when chat_jobs gets a delete policy.
  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      const item = queue.find((q) => q.id === itemId);
      setQueue((prev) => prev.filter((q) => q.id !== itemId));
      if (!item) return;

      let deleteError: string | null = null;

      if (item.outputType === "cartoon" && item.cartoonScriptId) {
        const table =
          item.cartoonFormat === "realfootage"
            ? "realfootage_scripts"
            : "cartoon_scripts";
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", item.cartoonScriptId);
        if (error) deleteError = error.message;
        await queryClient.invalidateQueries({
          queryKey: ["cartoon-scripts-recent", labelId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["realfootage-scripts-recent", labelId],
        });
      } else if (item.outputType === "fan_brief" && item.fanBriefId) {
        const { error } = await supabase
          .from("fan_briefs")
          .delete()
          .eq("id", item.fanBriefId);
        if (error) deleteError = error.message;
      } else if (item.outputType === "link_video" && item.linkVideoJobId) {
        const { error } = await supabase
          .from("cf_jobs")
          .delete()
          .eq("id", item.linkVideoJobId);
        if (error) deleteError = error.message;
      }

      if (deleteError) {
        toast({
          title: "Delete failed on the server",
          description: `${deleteError} — the card was removed locally but may re-appear on refresh.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Deleted",
        description: `"${item.title}" is gone for good.`,
      });
    },
    [queue, labelId, queryClient],
  );

  // Aggregate generating placeholders by fanBriefJobId so the global "Active
  // jobs" strip can render one card per job instead of one per placeholder.
  // The user clicks a card to jump straight to Review.
  const activeJobs = useMemo(() => {
    const byJob = new Map<
      string,
      {
        jobId: string;
        artistHandle: string;
        source: OutputType;
        count: number;
        stage: string;
      }
    >();
    for (const q of queue) {
      if (q.status !== "generating" || !q.fanBriefJobId) continue;
      const existing = byJob.get(q.fanBriefJobId);
      if (existing) {
        existing.count += 1;
        // Prefer a non-default stage label if any placeholder has one.
        if (q.jobStage && !existing.stage) existing.stage = q.jobStage;
      } else {
        byJob.set(q.fanBriefJobId, {
          jobId: q.fanBriefJobId,
          artistHandle: q.artistDisplayHandle ?? "—",
          source: q.outputType,
          count: 1,
          stage: q.jobStage ?? "Working…",
        });
      }
    }
    return Array.from(byJob.values());
  }, [queue]);

  const tabTitle = useMemo(() => {
    switch (activeTab) {
      case "explore":
        return "Explore";
      case "create":
        return "Create";
      case "assets":
        return "Assets";
    }
  }, [activeTab]);

  // Combined "needs your attention" count for the Assets nav badge —
  // pending + actively-generating items. Closer to what the user actually
  // wants to know at a glance than just one or the other.
  const assetsBadgeCount = useMemo(
    () =>
      queue.filter((q) => q.status === "pending" || q.status === "generating")
        .length,
    [queue],
  );

  const cartoonsInFlight = useMemo(
    () =>
      queue.filter(
        (q) => q.outputType === "cartoon" && q.status === "generating",
      ).length,
    [queue],
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-cfv2="true"
        data-label-theme="dark"
        className="min-h-[calc(100vh-64px)]"
        style={{ background: "var(--bg)", color: "var(--ink)" }}
      >
        <div
          className="mx-auto pt-12 pb-24"
          style={{
            maxWidth: 1440,
            paddingLeft: "clamp(20px, 4vw, 64px)",
            paddingRight: "clamp(20px, 4vw, 64px)",
          }}
        >
          {/* Page header — oversized Space Grotesk caps, accent eyebrow */}
          <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div
                className="mb-3"
                style={{
                  fontFamily: "var(--display-font)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "var(--accent)",
                }}
              >
                Content Factory · v2
              </div>
              <h1
                style={{
                  fontFamily: "var(--display-font)",
                  fontSize: "clamp(40px, 6vw, 64px)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                {tabTitle}
              </h1>
            </div>
            <div
              className="text-[11px] uppercase tracking-wider"
              style={{
                color: "var(--ink-tertiary)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              mock data · routes untouched
            </div>
          </div>

          {/* Top-nav — flat horizontal label list, Higgsfield style. Caps
            Space Grotesk, 3px accent underline with glow on the active tab. */}
          <div
            className="mb-10 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {TABS.map((t) => {
              const active = activeTab === t.key;
              const badge = t.key === "assets" ? assetsBadgeCount : null;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className="group relative h-14 px-5 flex items-center gap-2.5 transition-colors"
                  style={{
                    fontFamily: "var(--display-font)",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: active ? "var(--ink)" : "var(--ink-tertiary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.color = "var(--ink-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.color = "var(--ink-tertiary)";
                  }}
                >
                  <t.icon
                    size={15}
                    color={active ? "var(--accent)" : "currentColor"}
                  />
                  <span>{t.label}</span>
                  {badge != null && badge > 0 && (
                    <span
                      className="inline-flex items-center justify-center h-6 px-2 rounded-full text-[11px] tabular-nums"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontWeight: 600,
                        background: active
                          ? "var(--accent-soft)"
                          : "rgba(255,255,255,0.08)",
                        color: active
                          ? "var(--accent)"
                          : "var(--ink-secondary)",
                        minWidth: 24,
                        letterSpacing: 0,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="cf2-tab-underline"
                      className="absolute left-4 right-4 -bottom-[1px] h-[3px] rounded-full"
                      style={{
                        background: "var(--accent)",
                        boxShadow: "0 0 24px var(--accent-glow)",
                      }}
                      transition={{
                        type: "tween",
                        duration: 0.28,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* "Currently generating" rail — visible across all tabs while a
            fan-brief pipeline run is in flight. Horizontal scroll of square
            cards, each with a breathing status orb. Click to jump to Review.
            Arrow buttons follow the higgsfield-aesthetic skill recipe:
            frosted-glass round buttons that fade in on rail hover, hidden on
            touch viewports where the rail scrolls directly. */}
          {activeJobs.length > 0 && (
            <ActiveJobsRail
              activeJobs={activeJobs}
              onOpen={() => setActiveTab("assets")}
            />
          )}

          {/* Tab content — keyed crossfade. The wrapper (not the inner view)
            is keyed by activeTab so AnimatePresence handles mount/unmount,
            but each view's own state survives if React reuses it. The
            polling/Realtime channels live inside ReviewView; they only
            unmount when the user actually navigates away from Assets. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: 0.24,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {activeTab === "explore" && (
                <ExploreView onPickPreset={handlePickPreset} />
              )}

              {activeTab === "create" && (
                <CreateView
                  angles={[]}
                  draftAngleId={null}
                  draftPreset={draftPreset}
                  onDraftConsumed={handleDraftConsumed}
                  onGenerate={handleGenerate}
                  onCreateJob={handleCreateJob}
                  onCartoonGenerate={handleCartoonGenerate}
                  cartoonsInFlight={cartoonsInFlight}
                  onLinkVideoJob={handleLinkVideoJob}
                />
              )}

              {activeTab === "assets" && (
                <ReviewView
                  queue={queue}
                  onApproveSchedule={handleApproveSchedule}
                  onSendToTune={handleSendToTune}
                  onDelete={handleDeleteItem}
                  onRetryRender={handleRetryRender}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

// Pull a YouTube video ID out of any common URL shape (watch?v=, youtu.be/,
// shorts/, embed/) and return its hqdefault thumbnail. Returns undefined if
// the URL doesn't look like YouTube.
function youtubeThumbnailFromUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/);
  if (!m) return undefined;
  return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
}

// Compact relative-time string for QueueCard's createdAt slot.
function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "just now";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Friendly fallback when the worker hasn't set a current_stage yet.
function statusFallbackLabel(status: string): string {
  switch (status) {
    case "queued":
      return "Queued — worker picks up within 60s.";
    case "discovering":
      return "Finding videos and fetching fan comments…";
    case "mining":
      return "Mining peak fan-comment moments…";
    case "synthesizing":
      return "Writing briefs (Claude Opus)…";
    default:
      return status;
  }
}

// Time after approval at which we give up on the render-worker and surface
// a "this didn't work" state to the user. Renders normally take 3–5 min;
// 10 min with no clip means the worker had its chance and didn't deliver
// (yt-dlp block, geo fence, dead worker, classifier mistag — doesn't matter
// which from the FE's perspective).
const RENDER_STALLED_AFTER_MS = 10 * 60 * 1000;

// True when a fan-brief is approved but the render-worker has failed to
// produce a clip. Drives the red-border + "couldn't render" UI. Two paths
// flip this on:
//   • Explicit: `render_error` is set on the row (yt_blocked, geo_blocked,
//     download_failed, render_failed) — definitive backend signal.
//   • Implicit: time-based fallback — approved >10min with no clip and no
//     render_error yet. Worker had its chance.
// Recomputed at every merge tick (~30s) so it self-heals if a clip lands.
function computeRenderStalled(
  status: QueueItem["status"],
  renderedClipUrl: string | undefined,
  approvedAtIso: string | null | undefined,
  renderError: string | undefined,
): boolean {
  if (renderedClipUrl) return false;
  if (status !== "pending" && status !== "scheduled") return false;
  if (renderError) return true;
  if (!approvedAtIso) return false;
  const approvedMs = Date.parse(approvedAtIso);
  if (!Number.isFinite(approvedMs)) return false;
  return Date.now() - approvedMs > RENDER_STALLED_AFTER_MS;
}

// Mock scheduler — picks the next plausible slot (morning or evening) a day or
// two out. Real v1 wires this to whatever the label's release cadence is.
function mockScheduleSlot(): string {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const offset = 1 + Math.floor(Math.random() * 3);
  const target = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
  const slots = ["9:00 am", "12:30 pm", "4:00 pm", "6:00 pm"];
  const slot = slots[Math.floor(Math.random() * slots.length)];
  return `${days[target.getDay()]} · ${slot}`;
}

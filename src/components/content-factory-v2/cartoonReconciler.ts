import { supabase } from "@/integrations/supabase/client";
import type { QueueItem } from "./types";

const SUPABASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY";

export type CartoonStage = "script" | "vo" | "images" | "video";
export const CARTOON_STAGE_ORDER: CartoonStage[] = [
  "script",
  "vo",
  "images",
  "video",
];

export type CartoonFormat = "cartoon" | "realfootage";

/**
 * Map a cartoon_scripts.status value to the UI stage. Returns "done" when the
 * row is fully complete (caller still verifies cartoon_videos.final_url
 * before flipping the QueueItem to 'pending').
 */
export function scriptStatusToStage(
  status: string | null | undefined,
): CartoonStage | "done" {
  switch (status) {
    case "draft":
    case "rendering_vo":
      return "vo";
    case "vo_complete":
    case "planning_images":
    case "rendering_images":
      return "images";
    case "images_complete":
    case "rendering_video":
      return "video";
    case "complete":
      return "done";
    default:
      return "vo";
  }
}

/**
 * Real-footage status → UI stage. Different post-VO sub-states than cartoon
 * (selecting_clips / materializing_clips instead of planning_images /
 * rendering_images) but they collapse to the same 4-stage timeline so the
 * QueueCard pills don't need a format-specific layout.
 */
export function realfootageStatusToStage(
  status: string | null | undefined,
): CartoonStage | "done" {
  switch (status) {
    case "draft":
    case "rendering_vo":
      return "vo";
    case "vo_complete":
    case "selecting_clips":
    case "clips_selected":
    case "materializing_clips":
      return "images"; // visual-asset prep stage; UI label stays generic
    case "clips_complete":
    case "rendering_video":
      return "video";
    case "complete":
      return "done";
    default:
      return "vo";
  }
}

const REALFOOTAGE_FAILED_STATUSES = new Set([
  "failed",
  "vo_failed",
  "clips_failed",
  "materializing_failed",
  "video_failed",
]);

function realfootageErrorLabel(status: string): string {
  switch (status) {
    case "vo_failed":
      return "Voice generation failed";
    case "clips_failed":
      return "Clip selection failed";
    case "materializing_failed":
      return "Footage download failed";
    case "video_failed":
      return "Video composition failed";
    default:
      return "Render failed";
  }
}

/**
 * Sub-state label for the active pill. Returns "Queued · waiting for slot"
 * when the cartoon is sitting at a backend-throttled handoff (image and video
 * rendering are serialized server-side, so N>1 cartoons spend real time at
 * vo_complete / images_complete waiting for the previous run to vacate).
 */
export function scriptStatusToDetail(
  status: string | null | undefined,
): string | undefined {
  switch (status) {
    case "vo_complete":
    case "images_complete":
      return "Queued · waiting for slot";
    case "planning_images":
      return "Preparing";
    default:
      return undefined;
  }
}

export const CARTOON_FAILED_STATUSES = new Set([
  "failed",
  "vo_failed",
  "images_failed",
  "video_failed",
]);

export function cartoonErrorLabel(status: string): string {
  switch (status) {
    case "vo_failed":
      return "Voice generation failed";
    case "images_failed":
      return "Image generation failed";
    case "video_failed":
      return "Video composition failed";
    default:
      return "Render failed";
  }
}

// User-facing prefix for the cartoon-bucket queue card title. Mirrors the
// sub-format dropdown ("Cartoon" / "Real edit") so the card label matches
// what the user picked at create time. Anything that builds a card title
// goes through this map so the two formats can never diverge again — the
// prior bug was three different code paths each hard-coding their own
// prefix string.
export const FORMAT_TITLE_PREFIX: Record<CartoonFormat, string> = {
  cartoon: "Cartoon",
  realfootage: "Real edit",
};

export function cartoonStorageKey(labelId: string | null): string {
  return `cartoon-runs-v1.5-${labelId ?? "anon"}`;
}

/**
 * Subset of QueueItem fields persisted to localStorage so the cartoon list
 * survives refresh in-tab. DB-backed recovery (via the
 * `cartoon-scripts-recent` query in ContentFactoryV2) is the authoritative
 * source — this snapshot just gets the placeholder on screen instantly
 * before the 30s query runs.
 */
export interface CartoonRunSnapshot {
  itemId: string;
  artistId: string;
  artistName: string;
  artistHandle: string;
  startedAt: string;
  status: "generating" | "pending" | "scheduled" | "failed";
  cartoonChatJobId?: string;
  cartoonScriptId?: string;
  cartoonFormat?: CartoonFormat;
  cartoonStage?: CartoonStage;
  cartoonStageDetail?: string;
  cartoonHook?: string;
  cartoonFinalUrl?: string;
  thumbnailUrl?: string;
  scheduledFor?: string;
  jobError?: string;
  // ElevenLabs voice the user picked at creation time. Persisted so the
  // Retry button can re-fire the cartoon stream with the original voice
  // even after a page refresh wipes in-memory state.
  cartoonVoiceId?: string;
  cartoonVoiceSettings?: {
    stability: number;
    style: number;
    use_speaker_boost: boolean;
  };
  retryCount?: number;
}

export function loadCartoonRuns(labelId: string | null): CartoonRunSnapshot[] {
  try {
    const raw = localStorage.getItem(cartoonStorageKey(labelId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartoonRunSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveCartoonRuns(
  labelId: string | null,
  runs: CartoonRunSnapshot[],
) {
  try {
    localStorage.setItem(cartoonStorageKey(labelId), JSON.stringify(runs));
  } catch {
    /* quota exceeded — non-fatal */
  }
}

/**
 * Pluck the cartoon-relevant fields off a QueueItem to mirror in localStorage.
 */
export function snapshotFromItem(item: QueueItem): CartoonRunSnapshot | null {
  if (item.outputType !== "cartoon") return null;
  return {
    itemId: item.id,
    artistId: item.artistId,
    artistName:
      item.artistDisplayName ?? `@${item.artistDisplayHandle ?? "artist"}`,
    artistHandle: item.artistDisplayHandle ?? "",
    startedAt: item.createdAt,
    status: item.status,
    cartoonChatJobId: item.cartoonChatJobId,
    cartoonScriptId: item.cartoonScriptId,
    cartoonFormat: item.cartoonFormat,
    cartoonStage: item.cartoonStage,
    cartoonStageDetail: item.cartoonStageDetail,
    cartoonHook: item.cartoonHook,
    cartoonFinalUrl: item.cartoonFinalUrl,
    thumbnailUrl: item.thumbnailUrl,
    scheduledFor: item.scheduledFor,
    jobError: item.jobError,
    cartoonVoiceId: item.cartoonVoiceId,
    cartoonVoiceSettings: item.cartoonVoiceSettings,
    retryCount: item.retryCount,
  };
}

/**
 * Build a placeholder QueueItem from a localStorage snapshot. Used at mount
 * to repopulate Review with in-flight + completed cartoons.
 */
export function itemFromSnapshot(s: CartoonRunSnapshot): QueueItem {
  const prefix = FORMAT_TITLE_PREFIX[s.cartoonFormat ?? "cartoon"];
  const display = s.cartoonHook
    ? `${s.artistName} — ${s.cartoonHook}`
    : `${prefix} · ${s.artistName}`;
  return {
    id: s.itemId,
    artistId: s.artistId,
    artistDisplayName: s.artistName,
    artistDisplayHandle: s.artistHandle,
    title: display,
    outputType: "cartoon",
    source: "human",
    status: s.status,
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    createdAt: s.startedAt,
    cartoonChatJobId: s.cartoonChatJobId,
    cartoonScriptId: s.cartoonScriptId,
    cartoonFormat: s.cartoonFormat,
    cartoonStage: s.cartoonStage,
    cartoonStageDetail: s.cartoonStageDetail,
    cartoonHook: s.cartoonHook,
    cartoonFinalUrl: s.cartoonFinalUrl,
    renderedClipUrl: s.cartoonFinalUrl, // makes the existing thumb-click viewer Just Work
    thumbnailUrl: s.thumbnailUrl,
    scheduledFor: s.scheduledFor,
    jobError: s.jobError,
    cartoonVoiceId: s.cartoonVoiceId,
    cartoonVoiceSettings: s.cartoonVoiceSettings,
    retryCount: s.retryCount,
  };
}

/**
 * Reconcile one cartoon item's state against the backend. Returns the patch
 * to apply (or null if no change). When the chat job completes, fires the
 * cartoon-vo edge function to persist the script and capture the script_id.
 */
export async function reconcileCartoonItem(
  item: QueueItem,
): Promise<Partial<QueueItem> | null> {
  if (item.outputType !== "cartoon") return null;
  if (item.status !== "generating") return null;

  // ── step 1 → step 2 transition ───────────────────────────────────────────
  if (item.cartoonChatJobId && !item.cartoonScriptId) {
    const { data: job, error: jobErr } = await supabase
      .from("chat_jobs")
      .select("status, error_message")
      .eq("id", item.cartoonChatJobId)
      .maybeSingle();
    if (jobErr) {
      console.error("[cartoon-reconcile] chat_jobs read failed", {
        chatJobId: item.cartoonChatJobId,
        itemId: item.id,
        error: jobErr,
      });
    }
    if (!job) return null;
    if (job.status === "failed") {
      return {
        status: "failed",
        jobError: job.error_message ?? "Script generation failed",
      };
    }
    if (job.status !== "complete") return null;
    if (item.cartoonVoCallInFlight) return null;

    // Mark the call as in-flight before firing it so the next tick (or a
    // racing Realtime callback) doesn't double-fire.
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      return {
        status: "failed",
        jobError: "Session expired before render kicked off",
      };
    }

    try {
      // Route through the dispatcher: it reads the chat-job's fenced JSON for
      // a `format` field and forwards to cartoon-vo OR realfootage-vo. The
      // response echoes which target ran so we can poll the correct tables.
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/content-factory-vo-dispatch`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            chat_job_id: item.cartoonChatJobId,
            ...(item.cartoonVoiceId ? { voice_id: item.cartoonVoiceId } : {}),
            ...(item.cartoonVoiceSettings
              ? { voice_settings: item.cartoonVoiceSettings }
              : {}),
          }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: "failed",
          jobError: body?.error || `Render kick-off failed (${res.status})`,
        };
      }
      const scriptId = (body?.script_id ?? body?.id) as string | undefined;
      if (!scriptId) {
        return {
          status: "failed",
          jobError: "Render kick-off returned no script_id",
        };
      }
      const format =
        (body?.format as CartoonFormat | undefined) === "realfootage"
          ? "realfootage"
          : "cartoon";
      return {
        cartoonScriptId: scriptId,
        cartoonStage: "vo",
        cartoonFormat: format,
      };
    } catch (err) {
      return {
        status: "failed",
        jobError:
          err instanceof Error ? err.message : "Render kick-off errored",
      };
    }
  }

  // ── step 2: scriptId set, walk through scripts + videos for the right format ──
  if (item.cartoonScriptId) {
    const format: CartoonFormat = item.cartoonFormat ?? "cartoon";
    const scriptsTable =
      format === "realfootage" ? "realfootage_scripts" : "cartoon_scripts";
    const videosTable =
      format === "realfootage" ? "realfootage_videos" : "cartoon_videos";
    const failedSet =
      format === "realfootage"
        ? REALFOOTAGE_FAILED_STATUSES
        : CARTOON_FAILED_STATUSES;
    const errorLabel =
      format === "realfootage" ? realfootageErrorLabel : cartoonErrorLabel;
    const stageMapper =
      format === "realfootage" ? realfootageStatusToStage : scriptStatusToStage;

    const [scriptRes, videoRes] = await Promise.all([
      supabase
        .from(scriptsTable as never)
        .select("status, error_message, hook_title")
        .eq("id", item.cartoonScriptId)
        .maybeSingle(),
      supabase
        .from(videosTable as never)
        .select("status, final_url, error_message")
        .eq("script_id", item.cartoonScriptId)
        .maybeSingle(),
    ]);

    if (scriptRes.error) {
      console.error(`[cartoon-reconcile] ${scriptsTable} read failed`, {
        scriptId: item.cartoonScriptId,
        itemId: item.id,
        format,
        error: scriptRes.error,
      });
    }
    if (videoRes.error) {
      console.error(`[cartoon-reconcile] ${videosTable} read failed`, {
        scriptId: item.cartoonScriptId,
        itemId: item.id,
        format,
        error: videoRes.error,
      });
    }

    const script = scriptRes.data as {
      status: string | null;
      error_message: string | null;
      hook_title: string | null;
    } | null;
    const video = videoRes.data as {
      status: string | null;
      final_url: string | null;
      error_message: string | null;
    } | null;

    if (!script) return null;

    if (script.status && failedSet.has(script.status)) {
      return {
        status: "failed",
        cartoonStageDetail: undefined,
        jobError: script.error_message ?? errorLabel(script.status),
      };
    }
    if (video?.status === "failed") {
      return {
        status: "failed",
        cartoonStageDetail: undefined,
        jobError: video.error_message ?? "Video composition failed",
      };
    }

    if (script.status === "complete" && video?.final_url) {
      // Cartoon: shot 0's rendered image as Review thumbnail. Realfootage:
      // skip the thumb extraction — clip 0's first frame isn't deterministically
      // available as a still, so the QueueCard's video-player fallback handles
      // preview. v2 task: lift a poster frame out of the cached clip via ffmpeg.
      let thumbnailUrl: string | undefined;
      if (format === "cartoon") {
        const shotRes = await supabase
          .from("cartoon_image_assets" as never)
          .select("storage_url")
          .eq("script_id", item.cartoonScriptId)
          .eq("status", "complete")
          .order("segment_index", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (shotRes.error) {
          console.error(
            "[cartoon-reconcile] cartoon_image_assets read failed",
            {
              scriptId: item.cartoonScriptId,
              itemId: item.id,
              error: shotRes.error,
            },
          );
        }
        thumbnailUrl =
          (shotRes.data as { storage_url: string | null } | null)
            ?.storage_url ?? undefined;
      }

      const hook = script.hook_title ?? item.cartoonHook;
      const titlePrefix = FORMAT_TITLE_PREFIX[format];
      return {
        status: "pending",
        cartoonStage: undefined,
        cartoonStageDetail: undefined,
        cartoonFinalUrl: video.final_url,
        cartoonHook: hook,
        renderedClipUrl: video.final_url,
        thumbnailUrl,
        title: hook ? `${titlePrefix} — ${hook}` : item.title,
      };
    }

    const stage = stageMapper(script.status);
    if (stage === "done") return null; // wait for *_videos.final_url

    const detail = scriptStatusToDetail(script.status);
    const patch: Partial<QueueItem> = {};
    if (stage !== item.cartoonStage) patch.cartoonStage = stage;
    if (detail !== item.cartoonStageDetail) patch.cartoonStageDetail = detail;
    if (script.hook_title && script.hook_title !== item.cartoonHook) {
      patch.cartoonHook = script.hook_title;
    }
    return Object.keys(patch).length > 0 ? patch : null;
  }

  return null;
}

// ── DB-backed rehydrate helpers ─────────────────────────────────────────
// Used by ContentFactoryV2's `recentCartoonScriptsQuery` so a hard refresh
// or HMR mid-pipeline can recover the placeholder from the DB rather than
// depending on localStorage, which is fragile (race with the SSE first
// `event: job_id`, lost across browsers / incognito, etc.).

/**
 * Shape returned by the recent-scripts query. The videos embed is either a
 * single object (PostgREST 1:1 inference), an array (1:many), or null when
 * no video row exists yet. Both cartoon_scripts and realfootage_scripts hit
 * this shape — the rehydrate effect tags each row with `format` so the
 * derive/build helpers know which status set + error labels to apply, and
 * which downstream tables the resulting QueueItem will poll.
 */
export interface CartoonScriptRow {
  id: string;
  status: string | null;
  label_id: string;
  artist_handle: string | null;
  artist_name: string | null;
  source_chat_job_id: string | null;
  script_json: { hook_title?: string | null } | null;
  created_at: string;
  // Original ElevenLabs voice the user picked at create time. Projected so
  // a long-absent rehydrate (localStorage gone, DB only) still has enough
  // to power the Retry button. voice_settings isn't on the table, so retries
  // on a rehydrated item fall back to the dispatcher's defaults.
  voice_id_used: string | null;
  // Frontend tag — not a DB column. Set by the rehydrate effect after
  // selecting from cartoon_scripts vs realfootage_scripts so deriveState /
  // buildItem can pick the right status set and not have to re-query.
  format?: CartoonFormat;
  cartoon_videos:
    | { id: string; status: string | null; final_url: string | null }
    | { id: string; status: string | null; final_url: string | null }[]
    | null;
  // Realfootage scripts return their video join under this name. Same
  // shape as cartoon_videos — pickVideo() handles either.
  realfootage_videos?:
    | { id: string; status: string | null; final_url: string | null }
    | { id: string; status: string | null; final_url: string | null }[]
    | null;
}

function pickVideo(row: CartoonScriptRow): {
  id: string;
  status: string | null;
  final_url: string | null;
} | null {
  const v = row.cartoon_videos ?? row.realfootage_videos ?? null;
  if (!v) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

/**
 * Compute the QueueItem `status` + `cartoonStage` derived from a script row
 * and its joined video. Centralizes the rules so the merge effect doesn't
 * have to reimplement them. Format-aware: realfootage rows use a different
 * failure-status set, error label fn, and stage mapper, and don't have a
 * deterministic still thumbnail (the cartoon-images bucket is cartoon-only).
 */
export function deriveCartoonItemState(row: CartoonScriptRow): {
  status: QueueItem["status"];
  stage: CartoonStage | undefined;
  stageDetail: string | undefined;
  finalUrl: string | undefined;
  jobError: string | undefined;
  thumbnailUrl: string | undefined;
} {
  const format: CartoonFormat = row.format ?? "cartoon";
  const failedSet =
    format === "realfootage"
      ? REALFOOTAGE_FAILED_STATUSES
      : CARTOON_FAILED_STATUSES;
  const errorLabel =
    format === "realfootage" ? realfootageErrorLabel : cartoonErrorLabel;
  const stageMapper =
    format === "realfootage" ? realfootageStatusToStage : scriptStatusToStage;

  const video = pickVideo(row);
  const finalUrl = video?.final_url ?? undefined;
  const scriptStatus = row.status ?? "";
  // Cartoon: 000.png lands in the public cartoon-images bucket as soon as
  // shot 0 renders. Realfootage: poster.jpg lands in the public
  // realfootage-thumbs bucket once the final MP4 is ready (backend writes
  // it via ffmpeg post-render). To avoid 404 flicker we only surface
  // either URL once all shots are guaranteed done (status flipped to
  // rendering_video) or the final MP4 is ready. The <img onError> in
  // ReviewView hides whichever URL ends up missing — safe to set the
  // realfootage URL even if the backend hasn't shipped the writer yet,
  // the broken-image fallback hides it gracefully.
  const allShotsDone =
    scriptStatus === "rendering_video" || scriptStatus === "complete";
  const thumbnailUrl =
    finalUrl || allShotsDone
      ? format === "realfootage"
        ? `${SUPABASE_URL}/storage/v1/object/public/realfootage-thumbs/${row.id}/poster.jpg`
        : `${SUPABASE_URL}/storage/v1/object/public/cartoon-images/${row.id}/000.png`
      : undefined;

  if (failedSet.has(scriptStatus)) {
    return {
      status: "failed",
      stage: undefined,
      stageDetail: undefined,
      finalUrl,
      jobError: errorLabel(scriptStatus),
      thumbnailUrl,
    };
  }
  if (video?.status === "failed") {
    return {
      status: "failed",
      stage: undefined,
      stageDetail: undefined,
      finalUrl,
      jobError: "Video composition failed",
      thumbnailUrl,
    };
  }
  if (finalUrl) {
    return {
      status: "pending",
      stage: undefined,
      stageDetail: undefined,
      finalUrl,
      jobError: undefined,
      thumbnailUrl,
    };
  }
  const stage = stageMapper(scriptStatus);
  return {
    status: "generating",
    stage: stage === "done" ? "video" : stage,
    stageDetail: scriptStatusToDetail(scriptStatus),
    finalUrl: undefined,
    jobError: undefined,
    thumbnailUrl,
  };
}

/**
 * Build a fresh QueueItem for a script row that the in-memory queue
 * doesn't know about yet. Mirrors `itemFromSnapshot` but reads from DB
 * shape. Used when the user refreshed before the SSE first event landed
 * and localStorage has nothing — DB still has the script row.
 *
 * The row's `format` tag is the single source of truth for which pipeline
 * the resulting QueueItem belongs to. It drives the title prefix, the
 * cartoonFormat field (so subsequent reconciles hit the right tables),
 * and indirectly the failure-status set via deriveCartoonItemState.
 */
export function buildCartoonItemFromScript(row: CartoonScriptRow): QueueItem {
  const format: CartoonFormat = row.format ?? "cartoon";
  const handle = row.artist_handle ?? "artist";
  const name = row.artist_name ?? `@${handle}`;
  const hook = row.script_json?.hook_title ?? undefined;
  const { status, stage, stageDetail, finalUrl, jobError, thumbnailUrl } =
    deriveCartoonItemState(row);
  return {
    id: `q-cartoon-script-${row.id}`,
    artistId: `cartoon-${handle}`,
    artistDisplayName: name,
    artistDisplayHandle: handle,
    title: hook
      ? `${name} — ${hook}`
      : `${FORMAT_TITLE_PREFIX[format]} · ${name}`,
    outputType: "cartoon",
    source: "human",
    status,
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    thumbnailUrl,
    createdAt: row.created_at,
    cartoonChatJobId: row.source_chat_job_id ?? undefined,
    cartoonScriptId: row.id,
    cartoonFormat: format,
    cartoonStage: stage,
    cartoonStageDetail: stageDetail,
    cartoonHook: hook,
    cartoonFinalUrl: finalUrl,
    renderedClipUrl: finalUrl,
    cartoonVoiceId: row.voice_id_used ?? undefined,
    jobError,
  };
}

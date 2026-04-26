import {
  supabase,
  SUPABASE_URL_RAW,
  SUPABASE_ANON_KEY,
} from "@/integrations/supabase/client";
import type { QueueItem } from "./types";

export type LinkVideoStage = NonNullable<QueueItem["linkVideoStage"]>;

export const LINK_VIDEO_STAGE_ORDER: LinkVideoStage[] = [
  "pending",
  "ingested",
  "decomposed",
  "transcribed",
  "lyrics_fixed",
  "cast",
  "rendering",
  "done",
];

const STAGE_LABEL: Record<LinkVideoStage, string> = {
  pending: "Queued — pipeline picking up.",
  ingested: "Ingested ref clip.",
  decomposed: "Stems separated.",
  transcribed: "Transcribed lyrics.",
  lyrics_fixed: "Lyrics aligned.",
  cast: "Cast & shotlist locked.",
  rendering: "Rendering MP4.",
  done: "Ready.",
  error: "Failed.",
};

interface JobStatusResponse {
  status: string;
  error: string | null;
  final_url: string | null;
  cost_cents: number;
  created_at: string;
  updated_at: string;
}

function isLinkVideoStage(s: string): s is LinkVideoStage {
  return (
    s === "pending" ||
    s === "ingested" ||
    s === "decomposed" ||
    s === "transcribed" ||
    s === "lyrics_fixed" ||
    s === "cast" ||
    s === "rendering" ||
    s === "done" ||
    s === "error"
  );
}

// Map raw backend error codes to operator-friendly copy. Mirrors the legacy
// /label/content-factory error surface so users see the same explanations.
export function friendlyLinkVideoError(raw: string | null | undefined): string {
  if (!raw) return "Pipeline failed";
  if (raw === "sound_no_play_url") {
    return "This TikTok has no usable audio. Upload an MP3 or pick a different reference clip.";
  }
  if (raw.startsWith("sound_fetch_")) {
    return "Could not download the TikTok's sound. Try again or upload an MP3.";
  }
  if (raw.startsWith("audioshake_") || raw.startsWith("whisperx_")) {
    return `${raw} — try the other provider and re-submit.`;
  }
  return raw;
}

/**
 * Single GET against content-factory-status/{jobId}. Throws on non-2xx so the
 * caller can decide whether to retry or give up.
 */
async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");
  const res = await fetch(
    `${SUPABASE_URL_RAW}/functions/v1/content-factory-status/${jobId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Status ${res.status}: ${text}`);
  }
  return (await res.json()) as JobStatusResponse;
}

/**
 * Reconcile one link_video QueueItem against the content-factory-status
 * endpoint. Returns the patch to apply (or null if nothing changed).
 *
 * - In-flight statuses bump linkVideoStage + jobStage label.
 * - status='done' flips the item to 'pending' and sets renderedClipUrl from
 *   final_url, so Review's existing inline player Just Works.
 * - status='error' flips to 'failed' with a friendly message.
 *
 * 404 (job row vanished — typical after stale sessionStorage rehydrate) gets
 * surfaced as a synthetic "failed" patch so the placeholder doesn't sit
 * spinning forever.
 */
export async function reconcileLinkVideoItem(
  item: QueueItem,
): Promise<Partial<QueueItem> | null> {
  if (item.outputType !== "link_video") return null;
  if (item.status !== "generating") return null;
  if (!item.linkVideoJobId) return null;

  let data: JobStatusResponse;
  try {
    data = await fetchJobStatus(item.linkVideoJobId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/Status 404/.test(msg)) {
      return {
        status: "failed",
        jobError: "Job not found — it may have been cleaned up.",
        jobStage: undefined,
        linkVideoStage: "error",
      };
    }
    // Transient — let the next tick retry.
    console.warn("[link-video] status fetch failed:", msg);
    return null;
  }

  const stage: LinkVideoStage = isLinkVideoStage(data.status)
    ? data.status
    : "pending";

  if (data.status === "done") {
    return {
      status: "pending",
      linkVideoStage: "done",
      linkVideoCostCents: data.cost_cents,
      renderedClipUrl: data.final_url ?? undefined,
      jobStage: undefined,
      jobError: undefined,
    };
  }

  if (data.status === "error") {
    return {
      status: "failed",
      linkVideoStage: "error",
      jobError: friendlyLinkVideoError(data.error),
      linkVideoCostCents: data.cost_cents,
      jobStage: undefined,
    };
  }

  const stageLabel = STAGE_LABEL[stage];
  if (
    item.linkVideoStage === stage &&
    item.linkVideoCostCents === data.cost_cents &&
    item.jobStage === stageLabel
  ) {
    return null;
  }

  return {
    linkVideoStage: stage,
    linkVideoCostCents: data.cost_cents,
    jobStage: stageLabel,
  };
}

// ---- sessionStorage persistence ------------------------------------------
// One job per browser-session is unusual (legacy used a single key) but the V2
// queue can hold multiple in-flight link_video runs at once, so we mirror
// cartoonReconciler's array-of-snapshots shape. Lives in sessionStorage rather
// than localStorage because these are short-lived (4-8 min typical) and we
// don't want yesterday's run hanging around.

export interface LinkVideoRunSnapshot {
  itemId: string;
  artistId: string;
  artistDisplayName?: string;
  artistDisplayHandle?: string;
  title: string;
  startedAt: string;
  status: "generating" | "pending" | "scheduled" | "failed";
  linkVideoJobId: string;
  linkVideoStage?: LinkVideoStage;
  linkVideoRefUrl?: string;
  linkVideoCostCents?: number;
  renderedClipUrl?: string;
  jobStage?: string;
  jobError?: string;
}

// Bump the suffix to invalidate prior-shape snapshots if the contract changes.
function storageKey(labelId: string | null): string {
  return `cf-linkvideo-runs-v1-${labelId ?? "anon"}`;
}

export function loadLinkVideoRuns(
  labelId: string | null,
): LinkVideoRunSnapshot[] {
  try {
    const raw = window.sessionStorage.getItem(storageKey(labelId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LinkVideoRunSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveLinkVideoRuns(
  labelId: string | null,
  runs: LinkVideoRunSnapshot[],
): void {
  try {
    window.sessionStorage.setItem(storageKey(labelId), JSON.stringify(runs));
  } catch {
    /* quota exceeded — non-fatal */
  }
}

export function linkVideoSnapshotFromItem(
  item: QueueItem,
): LinkVideoRunSnapshot | null {
  if (item.outputType !== "link_video") return null;
  if (!item.linkVideoJobId) return null;
  return {
    itemId: item.id,
    artistId: item.artistId,
    artistDisplayName: item.artistDisplayName,
    artistDisplayHandle: item.artistDisplayHandle,
    title: item.title,
    startedAt: item.createdAt,
    status: item.status,
    linkVideoJobId: item.linkVideoJobId,
    linkVideoStage: item.linkVideoStage,
    linkVideoRefUrl: item.linkVideoRefUrl,
    linkVideoCostCents: item.linkVideoCostCents,
    renderedClipUrl: item.renderedClipUrl,
    jobStage: item.jobStage,
    jobError: item.jobError,
  };
}

export function linkVideoItemFromSnapshot(s: LinkVideoRunSnapshot): QueueItem {
  return {
    id: s.itemId,
    artistId: s.artistId,
    artistDisplayName: s.artistDisplayName,
    artistDisplayHandle: s.artistDisplayHandle,
    title: s.title,
    outputType: "link_video",
    source: "human",
    status: s.status,
    risk: "low",
    riskNotes: [],
    thumbKind: s.renderedClipUrl ? "video" : "link",
    createdAt: s.startedAt,
    linkVideoJobId: s.linkVideoJobId,
    linkVideoStage: s.linkVideoStage,
    linkVideoRefUrl: s.linkVideoRefUrl,
    linkVideoCostCents: s.linkVideoCostCents,
    renderedClipUrl: s.renderedClipUrl,
    jobStage: s.jobStage,
    jobError: s.jobError,
  };
}

// ── DB-backed rehydrate helpers ─────────────────────────────────────────
// Same architecture as cartoonReconciler.buildCartoonItemFromScript:
// `cf_jobs` is the canonical source of truth for link_video runs, and a
// label-scoped query against it is what makes refresh / HMR / cross-
// browser-session orphans impossible.

const STAGE_LABEL_FOR_DB: Record<LinkVideoStage, string> = {
  pending: "Queued — pipeline picking up.",
  ingested: "Ingested ref clip.",
  decomposed: "Stems separated.",
  transcribed: "Transcribed lyrics.",
  lyrics_fixed: "Lyrics aligned.",
  cast: "Cast & shotlist locked.",
  rendering: "Rendering MP4.",
  done: "Ready.",
  error: "Failed.",
};

export interface CfJobRow {
  id: string;
  label_id: string;
  artist_handle: string | null;
  ref_tiktok_url: string | null;
  status: string | null;
  error: string | null;
  final_url: string | null;
  cost_cents: number | null;
  created_at: string;
  updated_at: string;
}

function isLinkVideoStageString(s: string): s is LinkVideoStage {
  return (
    s === "pending" ||
    s === "ingested" ||
    s === "decomposed" ||
    s === "transcribed" ||
    s === "lyrics_fixed" ||
    s === "cast" ||
    s === "rendering" ||
    s === "done" ||
    s === "error"
  );
}

/**
 * Single source of truth for translating a cf_jobs row into the QueueItem
 * fields the UI needs. Mirrors `deriveCartoonItemState`.
 */
export function deriveLinkVideoItemState(row: CfJobRow): {
  status: QueueItem["status"];
  linkVideoStage: LinkVideoStage | undefined;
  jobStage: string | undefined;
  jobError: string | undefined;
  renderedClipUrl: string | undefined;
} {
  const finalUrl = row.final_url ?? undefined;
  const stage: LinkVideoStage =
    row.status && isLinkVideoStageString(row.status) ? row.status : "pending";

  if (row.status === "done") {
    return {
      status: "pending",
      linkVideoStage: "done",
      jobStage: undefined,
      jobError: undefined,
      renderedClipUrl: finalUrl,
    };
  }
  if (row.status === "error") {
    return {
      status: "failed",
      linkVideoStage: "error",
      jobStage: undefined,
      jobError: friendlyLinkVideoError(row.error),
      renderedClipUrl: finalUrl,
    };
  }
  return {
    status: "generating",
    linkVideoStage: stage,
    jobStage: STAGE_LABEL_FOR_DB[stage],
    jobError: undefined,
    renderedClipUrl: finalUrl,
  };
}

/**
 * Build a fresh QueueItem from a cf_jobs row. Used when an in-flight or
 * recently-completed job exists in the DB but the in-memory queue (and
 * sessionStorage) doesn't know about it — the recovery path after HMR /
 * refresh / a different tab.
 */
export function buildLinkVideoItemFromJob(row: CfJobRow): QueueItem {
  const handle = row.artist_handle ?? "artist";
  const derived = deriveLinkVideoItemState(row);
  return {
    id: `q-linkvideo-${row.id}`,
    artistId: `linkvideo-${handle}`,
    artistDisplayName: `@${handle}`,
    artistDisplayHandle: handle,
    title: `Lyric Overlay · @${handle}`,
    outputType: "link_video",
    source: "human",
    status: derived.status,
    risk: "low",
    riskNotes: [],
    thumbKind: derived.renderedClipUrl ? "video" : "link",
    createdAt: row.created_at,
    linkVideoJobId: row.id,
    linkVideoRefUrl: row.ref_tiktok_url ?? undefined,
    linkVideoStage: derived.linkVideoStage,
    linkVideoCostCents: row.cost_cents ?? undefined,
    renderedClipUrl: derived.renderedClipUrl,
    jobStage: derived.jobStage,
    jobError: derived.jobError,
  };
}

import type { LeadHunterLead } from "@/types/cartoonLeadHunter";

export type AngleFamily =
  | "sensational"
  | "self_help"
  | "tour_recap"
  | "bts"
  | "mini_doc";

export type RiskLevel = "low" | "medium" | "flagged";
export type QueueSource = "autopilot" | "human" | "fan_brief";
export type OutputType =
  | "short_form"
  | "mini_doc"
  | "sensational"
  | "self_help"
  | "tour_recap"
  | "fan_brief"
  | "link_video"
  | "cartoon";

export interface Artist {
  id: string;
  name: string;
  handle: string;
  labelName: string;
  market: string;
  chartPosition: string | null;
  monthlyListeners: string;
  unshippedAngles: number;
  scheduled: number;
  publishedThisWeek: number;
  isExample?: boolean;
}

export type AngleSourceKind =
  | "article"
  | "transcript"
  | "social"
  | "podcast"
  | "forum"
  | "other";

export interface AngleSource {
  label: string;
  kind: AngleSourceKind;
  date: string;
  url?: string;
}

export interface Angle {
  id: string;
  artistId: string;
  title: string;
  summary: string;
  family: AngleFamily;
  sourceCount: number;
  mostRecentSourceMonth: string | null;
  speculative: boolean;
  sources?: AngleSource[];
  favorited?: boolean;
  killed?: boolean;
}

export type QueueStatus = "generating" | "pending" | "scheduled" | "failed";

export interface QueueItem {
  id: string;
  artistId: string;
  title: string;
  outputType: OutputType;
  source: QueueSource;
  status: QueueStatus;
  risk: RiskLevel;
  riskNotes: string[];
  thumbKind: "video" | "brief" | "link";
  createdAt: string;
  scheduledFor?: string;
  angleId?: string;
  // Set when the item originated from a live fan_briefs row. Lets Review's
  // Kill-with-feedback cascade the archive back to fan_briefs, and lets
  // QueueCard fall back to the brief's own artist when it isn't in
  // MOCK_ARTISTS (live briefs can come from artists outside the v2 mock set).
  fanBriefId?: string;
  artistDisplayName?: string;
  artistDisplayHandle?: string;
  // On-demand fan-brief job tracking. Set on items created by the wizard's
  // Create button; cleared once the placeholder is reconciled into a real
  // brief. fanBriefJobId links N placeholders to one fan_brief_jobs row;
  // jobIndex orders them so produced_brief_ids[i] swaps cleanly.
  fanBriefJobId?: string;
  jobIndex?: number;
  jobStage?: string;
  jobError?: string;
  // YouTube (or rendered-clip) thumbnail. Set for fan-brief items derived
  // from a real video; the placeholder/spinner shows when absent.
  thumbnailUrl?: string;
  // YouTube source URL (with ?t=<seconds> jump-to-peak when available) —
  // shown as a secondary "view source" path when the rendered edit isn't
  // ready yet.
  sourceUrl?: string;
  // The rendered 9:16 MP4 in fan-brief-clips storage. When set, clicking
  // the thumbnail opens an inline player with hook overlay + karaoke caps.
  // When null, the brief is approved but render-clip.ts hasn't run yet.
  renderedClipUrl?: string;
  // Raw ISO timestamp of when the brief landed at status='approved'. Used
  // to compute renderStalled below — kept separate from `createdAt`
  // (which is a display string like "5m ago") so we don't have to
  // re-parse a localized format every tick.
  approvedAtIso?: string;
  // Set true when the brief has been approved >10 min with no
  // renderedClipUrl OR when fan_briefs.render_error is explicitly set by
  // the backend worker. UI flag — drives the "didn't work" treatment.
  // Recomputed at every approvedBriefsQuery refetch so it self-heals
  // when a clip eventually does land.
  renderStalled?: boolean;
  // Explicit terminal-failure code from fan_briefs.render_error. When
  // set, takes precedence over the time-based stalled heuristic and
  // drives more specific UI copy (yt_blocked → "YouTube blocked",
  // geo_blocked → "not available in our region", etc.).
  renderError?:
    | "yt_blocked"
    | "geo_blocked"
    | "download_failed"
    | "render_failed";

  // Cartoon pipeline tracking (Image-Zoom Cartoon format). Set on items with
  // outputType='cartoon'. While generating, cartoonStage advances Script → VO
  // → Images → Video and the QueueCard shows a 5-stage pill timeline. When
  // status flips to 'pending', cartoonFinalUrl is set and the same MP4 plays
  // through renderedClipUrl + the BriefViewerModal.
  cartoonChatJobId?: string;
  cartoonScriptId?: string;
  // Which Content Factory pipeline this script is rendering through. Set from
  // the vo-dispatch response on POST. Drives which tables the reconciler polls
  // (cartoon_scripts/cartoon_videos vs realfootage_scripts/realfootage_videos)
  // and which set of statuses map to the UI stage timeline. Default 'cartoon'
  // for older items that pre-date the dispatcher migration.
  cartoonFormat?: "cartoon" | "realfootage";
  // ElevenLabs voice ID + tuned settings the user picked at creation time.
  // The reconciler forwards both to content-factory-vo-dispatch so the script
  // row gets voice_id_used set and the call uses the matching settings.
  cartoonVoiceId?: string;
  cartoonVoiceSettings?: {
    stability: number;
    style: number;
    use_speaker_boost: boolean;
  };
  // Lead Hunter decision gate. Set for Story items created from the new
  // Lead Hunter board so retries keep the same operator-approved angle.
  cartoonLeadHunterJobId?: string;
  cartoonSelectedLead?: LeadHunterLead;
  cartoonStage?: "script" | "vo" | "images" | "video";
  // Sub-state for the current stage. Set when the cartoon is sitting at a
  // backend handoff (e.g. status='vo_complete' waiting for the image-render
  // worker to pick it up — the backend serializes image rendering, so N>1
  // cartoons spend real time queued here). Without this, the timeline freezes
  // on the active pill and looks stalled.
  cartoonStageDetail?: string;
  cartoonHook?: string;
  cartoonFinalUrl?: string;
  // True while content-factory-cartoon-vo is being POSTed, so the polling
  // tick doesn't fire it twice.
  cartoonVoCallInFlight?: boolean;

  // Lyric Overlay (link_video) pipeline tracking (TikTok ref → 9:16 MP4 via
  // content-factory-generate). Set on items with outputType='link_video'.
  // Polled via content-factory-status until terminal; the final MP4 lands in
  // renderedClipUrl so Review's inline player just works.
  linkVideoJobId?: string;
  linkVideoStage?:
    | "pending"
    | "ingested"
    | "decomposed"
    | "transcribed"
    | "lyrics_fixed"
    | "cast"
    | "rendering"
    | "done"
    | "error";
  linkVideoRefUrl?: string;
  linkVideoCostCents?: number;
  // Whisper provider the user picked when the link_video job was first
  // dispatched. Persisted on the QueueItem so the Retry button can re-invoke
  // content-factory-generate with the same transcription engine the user
  // originally chose.
  linkVideoTranscribeProvider?: "audioshake" | "whisperx";
  // Number of times the user has hit Retry on this card. Capped at
  // RETRY_MAX in ReviewView so a permanently-broken source (yt_blocked,
  // missing audio, etc.) can't burn unbounded ElevenLabs / Replicate
  // spend. Persisted via the cartoon + link_video snapshots so the cap
  // survives a refresh.
  retryCount?: number;
}

export const RETRY_MAX = 3;

export type AngleFamilyFilter = "all" | AngleFamily;

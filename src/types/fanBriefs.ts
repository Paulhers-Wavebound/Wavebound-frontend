export type BriefContentType = "interview" | "live_performance" | "podcast";
export type RenderStyle = "talking_head" | "karaoke" | "banter";
export type RenderErrorCode =
  | "yt_blocked"
  | "geo_blocked"
  | "download_failed"
  | "render_failed";

/**
 * Shape of a fan comment used to evidence a live-performance peak. Populated by
 * scripts/fan-briefs/mine-live-signals.ts from the content_comments table.
 */
export interface PeakComment {
  id: string;
  author: string | null;
  content: string;
  like_count: number;
  referenced_seconds: number | null;
}

/**
 * Crowd-sourced evidence backing a live_performance brief. Stored on
 * content_segments.peak_evidence (not on fan_briefs itself) — read via the
 * nested join in ContentFactoryV2.
 */
export interface PeakEvidence {
  source: "comments";
  cluster_size: number;
  sum_likes: number;
  chapter_title: string | null;
  chapter_duration: number | null;
  top_comments: PeakComment[];
  synthesized_hook: string;
  cited_comment_idx: number | null;
}

/**
 * Partial shape of the content_segments join on fan_briefs. Nested catalog
 * carries live_venue + content_type of the underlying video.
 */
export interface BriefSegmentJoin {
  peak_evidence: PeakEvidence | null;
  hook_source: "comment" | "lyric" | "llm" | null;
  content_catalog: {
    live_venue: string | null;
    content_type: string | null;
    title: string | null;
    duration_seconds: number | null;
  } | null;
}

export interface FanBrief {
  id: string;
  artist_handle: string;
  artist_id: string;
  label_id: string;
  segment_id: string | null;

  content_type: BriefContentType | null;
  render_style: RenderStyle | null;

  hook_text: string;
  caption: string | null;
  format_recommendation: string;
  platform_recommendation: string[];
  sound_pairing: string | null;
  why_now: string;
  confidence_score: number;

  source_url: string | null;
  source_title: string | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  youtube_timestamp_url: string | null;

  clip_storage_url: string | null;
  clip_duration_seconds: number | null;
  rendered_clip_url: string | null;

  /**
   * Terminal render-failure code written by the backend render-clip.ts when
   * yt-dlp / ffmpeg / upload errors out. NULL = renderable (worker will
   * still try). Set to NULL via the FE Retry button or manual SQL to
   * re-queue.
   *
   * Codes: 'yt_blocked' | 'geo_blocked' | 'download_failed' | 'render_failed'.
   */
  render_error?: RenderErrorCode | null;
  render_error_at?: string | null;

  status:
    | "pending"
    | "approved"
    | "skipped"
    | "modified"
    | "posted"
    | "archived";
  approved_by: string | null;
  approved_at: string | null;
  modified_hook: string | null;

  created_at: string;

  /**
   * Free-form jsonb scratch space the pipeline stores classifier outputs in,
   * and where the v2 Review tab persists `scheduled_for` so a scheduled brief
   * survives a refresh without a dedicated column.
   */
  generation_context?: {
    scheduled_for?: string;
    [key: string]: unknown;
  } | null;

  /** Nested result of select(`*, content_segments(peak_evidence, content_catalog(live_venue, ...))`). */
  content_segments?: BriefSegmentJoin | null;
}

export interface ContentSegment {
  id: string;
  catalog_id: string;
  artist_handle: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  speaker: string | null;
  transcript_excerpt: string;
  moment_summary: string;
  moment_type: string | null;
  fan_potential_score: number;
  visual_description: string | null;
  visual_confirmed: boolean;
  clip_storage_url: string | null;
}

export interface ContentCatalogItem {
  id: string;
  artist_handle: string;
  source_platform: string;
  source_url: string;
  title: string | null;
  channel_name: string | null;
  upload_date: string | null;
  duration_seconds: number | null;
  view_count: number | null;
}

export type BriefStatus = FanBrief["status"];

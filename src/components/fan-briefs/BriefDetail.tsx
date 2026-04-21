import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Pencil,
  ExternalLink,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { FanBrief, ContentSegment } from "@/types/fanBriefs";

interface BriefDetailProps {
  brief: FanBrief | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onModifyHook: (id: string, newHook: string) => void;
}

function getVideoId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}

function formatTimestamp(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function confidenceChipStyle(score: number): { bg: string; color: string } {
  if (score >= 85) return { bg: "rgba(48,209,88,0.12)", color: "#30D158" };
  if (score >= 70) return { bg: "rgba(10,132,255,0.12)", color: "#0A84FF" };
  return { bg: "rgba(255,159,10,0.12)", color: "#FF9F0A" };
}

const tagColors = {
  format: { bg: "rgba(10,132,255,0.12)", color: "#0A84FF" },
  platform: { bg: "rgba(191,90,242,0.12)", color: "#BF5AF2" },
  reason: { bg: "rgba(255,159,10,0.12)", color: "#FF9F0A" },
};

export default function BriefDetail({
  brief,
  open,
  onOpenChange,
  onApprove,
  onSkip,
  onModifyHook,
}: BriefDetailProps) {
  const navigate = useNavigate();
  const [isEditingHook, setIsEditingHook] = useState(false);
  const [editedHook, setEditedHook] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Reset edit state whenever the brief changes or modal closes
  useEffect(() => {
    setIsEditingHook(false);
    setEditedHook(brief?.hook_text ?? "");
  }, [brief, open]);

  useEffect(() => {
    if (isEditingHook && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditingHook]);

  const segmentQuery = useQuery({
    queryKey: ["content-segment", brief?.segment_id],
    enabled: open && !!brief?.segment_id,
    staleTime: 60_000,
    queryFn: async (): Promise<ContentSegment | null> => {
      const { data, error } = await supabase
        .from("content_segments")
        .select(
          "id, catalog_id, artist_handle, start_seconds, end_seconds, duration_seconds, speaker, transcript_excerpt, moment_summary, moment_type, fan_potential_score, visual_description, visual_confirmed, clip_storage_url",
        )
        .eq("id", brief!.segment_id!)
        .maybeSingle();
      if (error) throw error;
      return (data as ContentSegment) ?? null;
    },
  });

  if (!brief) return null;

  const hook = brief.modified_hook || brief.hook_text;
  const videoId = getVideoId(brief.source_url);
  const embedUrl =
    videoId && brief.timestamp_start != null
      ? `https://www.youtube.com/embed/${videoId}?start=${Math.floor(brief.timestamp_start)}&end=${Math.floor(brief.timestamp_end ?? brief.timestamp_start + 60)}`
      : null;
  const chip = confidenceChipStyle(brief.confidence_score);
  const isPending = brief.status === "pending";

  const handleSaveHook = () => {
    const trimmed = editedHook.trim();
    if (trimmed && trimmed !== brief.hook_text) {
      onModifyHook(brief.id, trimmed);
    }
    setIsEditingHook(false);
  };

  const handleChatAboutThis = () => {
    const lines = [
      `I'm reviewing a fan brief for @${brief.artist_handle}:`,
      ``,
      `Hook: "${hook}"`,
      brief.caption ? `Caption: ${brief.caption}` : null,
      `Format: ${brief.format_recommendation.replace(/_/g, " ")}`,
      `Platforms: ${brief.platform_recommendation.join(", ")}`,
      brief.sound_pairing ? `Sound: ${brief.sound_pairing}` : null,
      `Confidence: ${brief.confidence_score}%`,
      `Why now: ${brief.why_now}`,
      ``,
      `What do you think about this brief? Any suggestions to improve the hook or approach?`,
    ]
      .filter(Boolean)
      .join("\n");
    onOpenChange(false);
    navigate("/label/assistant", {
      state: { prefill: lines, newSession: true },
    });
  };

  const segment = segmentQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[720px] max-h-[90vh] overflow-y-auto font-['DM_Sans',sans-serif] p-0"
        style={{ background: "var(--surface)", color: "var(--ink)" }}
      >
        <DialogHeader className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle
              className="text-base font-semibold"
              style={{ color: "var(--ink)" }}
            >
              @{brief.artist_handle}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold font-['JetBrains_Mono',monospace]"
                style={{ background: chip.bg, color: chip.color }}
              >
                {brief.confidence_score}%
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                style={{
                  background: "rgba(255,159,10,0.12)",
                  color: "#FF9F0A",
                }}
              >
                {brief.status}
              </span>
            </div>
          </div>
          {brief.source_title && (
            <div
              className="text-xs mt-1"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {brief.source_title}
            </div>
          )}
        </DialogHeader>

        {/* Video preview — rendered clip if present, otherwise source embed */}
        <div className="px-6">
          {brief.rendered_clip_url ? (
            <div className="mx-auto w-[270px] h-[480px] rounded-xl overflow-hidden bg-black">
              <video
                src={brief.rendered_clip_url}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            </div>
          ) : embedUrl ? (
            <div className="relative pb-[56.25%] rounded-xl overflow-hidden bg-black">
              <iframe
                src={embedUrl}
                title={brief.source_title || "Source video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          ) : null}
        </div>

        {/* Hook — editable */}
        <div className="px-6 pt-5">
          <div
            className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--ink-tertiary)" }}
          >
            Hook
          </div>
          {isEditingHook ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editRef}
                value={editedHook}
                onChange={(e) => setEditedHook(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveHook();
                  }
                  if (e.key === "Escape") {
                    setEditedHook(brief.hook_text);
                    setIsEditingHook(false);
                  }
                }}
                className="w-full min-h-[80px] p-3 rounded-[10px] text-base italic leading-relaxed resize-y outline-none"
                style={{
                  border: "1px solid var(--accent)",
                  background: "var(--bg)",
                  color: "var(--ink)",
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditedHook(brief.hook_text);
                    setIsEditingHook(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer bg-transparent"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--ink-secondary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHook}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer border-0"
                  style={{ background: "var(--accent)" }}
                >
                  Save Hook
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => isPending && setIsEditingHook(true)}
              className={`text-lg font-medium italic leading-relaxed ${
                isPending ? "cursor-text" : "cursor-default"
              }`}
              style={{ color: "var(--ink)" }}
              title={isPending ? "Click to edit hook" : undefined}
            >
              "{hook}"
              {isPending && (
                <Pencil
                  size={13}
                  color="var(--ink-tertiary)"
                  className="ml-2 inline-block align-middle opacity-50"
                />
              )}
            </div>
          )}
          {brief.caption && (
            <div
              className="text-[13px] mt-2 leading-snug"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {brief.caption}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 px-6 pt-4">
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{
              background: tagColors.format.bg,
              color: tagColors.format.color,
            }}
          >
            {brief.format_recommendation.replace(/_/g, " ")}
          </span>
          {brief.platform_recommendation.map((p) => (
            <span
              key={p}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize"
              style={{
                background: tagColors.platform.bg,
                color: tagColors.platform.color,
              }}
            >
              {p}
            </span>
          ))}
          {brief.sound_pairing && (
            <span
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{
                background: tagColors.reason.bg,
                color: tagColors.reason.color,
              }}
            >
              {brief.sound_pairing}
            </span>
          )}
        </div>

        {/* Why now — full, untruncated */}
        <div className="px-6 pt-5">
          <div
            className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--ink-tertiary)" }}
          >
            Why now
          </div>
          <div
            className="text-sm leading-relaxed"
            style={{ color: "var(--ink-secondary)" }}
          >
            {brief.why_now}
          </div>
        </div>

        {/* Source metadata */}
        {(brief.source_title || brief.source_url) && (
          <div className="px-6 pt-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--ink-tertiary)" }}
            >
              Source
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {brief.source_title && (
                <span
                  className="text-sm"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {brief.source_title}
                </span>
              )}
              {brief.timestamp_start != null && (
                <span
                  className="text-xs font-['JetBrains_Mono',monospace]"
                  style={{ color: "var(--ink-tertiary)" }}
                >
                  {formatTimestamp(brief.timestamp_start)} –{" "}
                  {formatTimestamp(brief.timestamp_end)}
                </span>
              )}
              {(brief.youtube_timestamp_url || brief.source_url) && (
                <a
                  href={brief.youtube_timestamp_url || brief.source_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium no-underline"
                  style={{ color: "var(--accent)" }}
                >
                  Open on YouTube
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Segment context from content_segments — only if linked */}
        {brief.segment_id && (
          <div className="px-6 pt-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--ink-tertiary)" }}
            >
              Transcript excerpt
            </div>
            {segmentQuery.isLoading ? (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--ink-tertiary)" }}
              >
                <Loader2 size={14} className="animate-spin" />
                Loading segment...
              </div>
            ) : segment ? (
              <>
                <div
                  className="text-sm italic leading-relaxed"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  "{segment.transcript_excerpt}"
                </div>
                {(segment.speaker || segment.moment_type) && (
                  <div
                    className="text-xs mt-2"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    {segment.speaker && <>Speaker: {segment.speaker}</>}
                    {segment.speaker && segment.moment_type && " · "}
                    {segment.moment_type && (
                      <>Type: {segment.moment_type.replace(/_/g, " ")}</>
                    )}
                  </div>
                )}
                {segment.moment_summary && (
                  <div
                    className="text-xs mt-2 leading-relaxed"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    {segment.moment_summary}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs" style={{ color: "var(--ink-tertiary)" }}>
                Segment not available.
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div
          className="flex items-center justify-between gap-2 px-6 py-4 mt-5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={handleChatAboutThis}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer bg-transparent"
            style={{
              border: "1px solid var(--border)",
              color: "var(--ink-tertiary)",
            }}
          >
            <MessageCircle size={14} />
            Chat about this
          </button>
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSkip(brief.id);
                  onOpenChange(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer bg-transparent"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--ink-tertiary)",
                }}
              >
                <X size={14} />
                Skip
              </button>
              <button
                onClick={() => {
                  onApprove(brief.id);
                  onOpenChange(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white cursor-pointer border-0"
                style={{ background: "#30D158" }}
              >
                <Check size={14} />
                Approve
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

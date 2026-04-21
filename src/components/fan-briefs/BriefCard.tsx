import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Check,
  X,
  Pencil,
  ExternalLink,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageCircle,
  Maximize2,
} from "lucide-react";
import type { FanBrief } from "@/types/fanBriefs";

interface BriefCardProps {
  brief: FanBrief;
  mode: "content" | "clips";
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onModifyHook: (id: string, newHook: string) => void;
  onDelete?: (id: string) => void;
  /** Render a static YouTube thumbnail instead of a live iframe embed */
  staticPreview?: boolean;
  /** When provided, renders a selection checkbox for batch actions. Content mode only. */
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** When provided, renders an "Expand" button that opens the BriefDetail modal. */
  onExpand?: (id: string) => void;
}

/**
 * Extract a YouTube video ID from any common URL shape:
 *   - youtube.com/watch?v=ID
 *   - youtu.be/ID
 *   - youtube.com/embed/ID
 *   - youtube.com/shorts/ID
 *   - youtube.com/v/ID
 * Returns null for non-YouTube URLs or unparseable shapes.
 */
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

function getEmbedUrl(brief: FanBrief): string | null {
  if (!brief.source_url || brief.timestamp_start == null) return null;
  const videoId = getVideoId(brief.source_url);
  if (!videoId) return null;
  const start = Math.floor(brief.timestamp_start);
  const end = Math.floor(brief.timestamp_end ?? brief.timestamp_start + 60);
  return `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}`;
}

function formatTimestamp(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const statusBadgeStyles: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  pending: { bg: "rgba(255,159,10,0.12)", color: "#FF9F0A", label: "Pending" },
  approved: { bg: "rgba(48,209,88,0.12)", color: "#30D158", label: "Approved" },
  skipped: { bg: "rgba(142,142,147,0.12)", color: "#8E8E93", label: "Skipped" },
  modified: {
    bg: "rgba(10,132,255,0.12)",
    color: "#0A84FF",
    label: "Modified",
  },
  posted: { bg: "rgba(48,209,88,0.12)", color: "#30D158", label: "Posted" },
  archived: {
    bg: "rgba(142,142,147,0.12)",
    color: "#8E8E93",
    label: "Archived",
  },
};

const tagColors = {
  format: { bg: "rgba(10,132,255,0.12)", color: "#0A84FF" },
  platform: { bg: "rgba(191,90,242,0.12)", color: "#BF5AF2" },
  reason: { bg: "rgba(255,159,10,0.12)", color: "#FF9F0A" },
};

/** Tier confidence chip color by score: <70 amber, 70–84 blue, ≥85 green. */
function confidenceChipStyle(score: number): { bg: string; color: string } {
  if (score >= 85) return { bg: "rgba(48,209,88,0.12)", color: "#30D158" };
  if (score >= 70) return { bg: "rgba(10,132,255,0.12)", color: "#0A84FF" };
  return { bg: "rgba(255,159,10,0.12)", color: "#FF9F0A" };
}

export default function BriefCard({
  brief,
  mode,
  onApprove,
  onSkip,
  onModifyHook,
  onDelete,
  staticPreview = false,
  selected = false,
  onToggleSelect,
  onExpand,
}: BriefCardProps) {
  const selectable = mode === "content" && !!onToggleSelect;
  const navigate = useNavigate();
  const [isEditingHook, setIsEditingHook] = useState(false);
  const [editedHook, setEditedHook] = useState(brief.hook_text);
  const [replayKey, setReplayKey] = useState(0);
  const [showSource, setShowSource] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const embedUrl = getEmbedUrl(brief);
  const badge = statusBadgeStyles[brief.status] ?? statusBadgeStyles.pending;
  const isActionable = mode === "content";

  const handleChatAboutThis = () => {
    const hook = brief.modified_hook || brief.hook_text;
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

    navigate("/label/assistant", {
      state: { prefill: lines, newSession: true },
    });
  };

  useEffect(() => {
    if (isEditingHook && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditingHook]);

  const handleSaveHook = () => {
    const trimmed = editedHook.trim();
    if (trimmed && trimmed !== brief.hook_text) {
      onModifyHook(brief.id, trimmed);
    }
    setIsEditingHook(false);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-transform font-['DM_Sans',sans-serif]"
      style={{
        background: "var(--surface)",
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      {/* Header: artist + confidence */}
      <div className="flex items-center justify-between pt-5 px-6">
        <div className="flex items-center gap-2.5">
          {selectable && (
            <button
              type="button"
              onClick={() => onToggleSelect!(brief.id)}
              aria-pressed={selected}
              aria-label={selected ? "Deselect brief" : "Select brief"}
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              style={{
                border: selected
                  ? "1.5px solid var(--accent)"
                  : "1.5px solid var(--border-hover)",
                background: selected ? "var(--accent)" : "transparent",
              }}
            >
              {selected && <Check size={13} color="#fff" strokeWidth={3} />}
            </button>
          )}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2"
            style={{
              background:
                "linear-gradient(135deg, var(--bg) 0%, var(--border) 100%)",
              borderColor: "var(--border)",
            }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {brief.artist_handle.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: "var(--ink)" }}
            >
              @{brief.artist_handle}
            </div>
            {brief.source_title && (
              <div
                className="text-xs mt-px max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ color: "var(--ink-tertiary)" }}
              >
                {brief.source_title}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence score — tiered by value */}
          {(() => {
            const chip = confidenceChipStyle(brief.confidence_score);
            return (
              <div
                className="px-2.5 py-1 rounded-full text-xs font-semibold font-['JetBrains_Mono',monospace]"
                style={{ background: chip.bg, color: chip.color }}
              >
                {brief.confidence_score}%
              </div>
            );
          })()}
          {/* Status badge */}
          <div
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </div>
        </div>
      </div>

      {/* Video section — mode-aware */}
      {mode === "clips" ? (
        <div className="px-6 pt-4">
          {brief.rendered_clip_url ? (
            <>
              {/* Rendered clip player — 9:16 */}
              <div className="w-[270px] h-[480px] rounded-xl overflow-hidden bg-black">
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
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={brief.rendered_clip_url}
                  download
                  className="inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-[10px] text-sm font-semibold text-white no-underline cursor-pointer"
                  style={{ background: "#30D158" }}
                >
                  <Download size={15} />
                  Download Clip
                </a>
                {embedUrl && (
                  <button
                    onClick={() => setShowSource((s) => !s)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[13px] font-medium cursor-pointer bg-transparent"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    <Play size={12} />
                    Source
                    {showSource ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                )}
              </div>
              {showSource && embedUrl && (
                <div className="relative pb-[56.25%] rounded-[10px] overflow-hidden bg-black mt-3">
                  <iframe
                    src={embedUrl}
                    title={brief.source_title || "Source video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              )}
            </>
          ) : (
            /* Rendering... placeholder */
            <div className="w-[270px] h-[480px] rounded-xl overflow-hidden bg-black">
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div
                  className="w-8 h-8 rounded-full animate-spin"
                  style={{
                    border: "3px solid rgba(255,255,255,0.15)",
                    borderTopColor: "var(--accent)",
                  }}
                />
                <span className="text-sm font-medium text-white/55">
                  Rendering...
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Content mode — YouTube embed or static thumbnail */
        embedUrl && (
          <div className="px-6 pt-4">
            <div className="relative pb-[56.25%] rounded-xl overflow-hidden bg-black">
              {staticPreview ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${getVideoId(brief.source_url)}/hqdefault.jpg`}
                    alt={brief.source_title || "Video preview"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                      <Play
                        size={28}
                        color="#fff"
                        fill="#fff"
                        className="ml-[3px]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <iframe
                  key={replayKey}
                  src={embedUrl}
                  title={brief.source_title || "Video preview"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              )}
            </div>
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer bg-transparent transition-colors hover:!text-[var(--accent)] hover:!border-[var(--accent)]"
              style={{
                border: "1px solid var(--border)",
                color: "var(--ink-secondary)",
              }}
            >
              <RotateCcw size={14} />
              Replay Clip
              {brief.timestamp_start != null && (
                <span className="text-[11px] opacity-70 font-['JetBrains_Mono',monospace]">
                  {formatTimestamp(brief.timestamp_start)} –{" "}
                  {formatTimestamp(brief.timestamp_end)}
                </span>
              )}
            </button>
          </div>
        )
      )}

      {/* Hook text — editable on click */}
      <div className="px-6 pt-4">
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
              className="w-full min-h-[60px] p-3 rounded-[10px] text-base italic leading-relaxed resize-y outline-none"
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
            onClick={() => isActionable && setIsEditingHook(true)}
            className={`text-lg font-medium italic leading-relaxed py-2 rounded-lg transition-colors ${
              isActionable ? "cursor-text" : "cursor-default"
            }`}
            style={{ color: "var(--ink)" }}
            title={isActionable ? "Click to edit hook" : undefined}
          >
            "{brief.modified_hook || brief.hook_text}"
            {isActionable && (
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
            className="text-[13px] mt-1 leading-snug"
            style={{ color: "var(--ink-tertiary)" }}
          >
            {brief.caption}
          </div>
        )}
      </div>

      {/* Tags row: format, platforms, sound pairing */}
      <div className="flex flex-wrap gap-1.5 px-6 pt-3">
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

      {/* Source info block */}
      <div
        className="mt-4 mx-6 p-4 rounded-xl"
        style={{
          background: "var(--surface-hover)",
          border: "1px solid var(--border)",
        }}
      >
        {brief.source_title && (
          <div className="flex items-center gap-1.5 mb-2">
            <ExternalLink size={12} color="var(--ink-tertiary)" />
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--ink-secondary)" }}
            >
              {brief.source_title}
            </span>
            {brief.timestamp_start != null && (
              <span
                className="text-[11px] font-['JetBrains_Mono',monospace]"
                style={{ color: "var(--ink-tertiary)" }}
              >
                {formatTimestamp(brief.timestamp_start)} –{" "}
                {formatTimestamp(brief.timestamp_end)}
              </span>
            )}
          </div>
        )}
        <div
          className="text-[13px] leading-relaxed"
          style={{ color: "var(--ink-secondary)" }}
        >
          {brief.why_now}
        </div>
      </div>

      {/* Chat + Details row */}
      <div className="flex items-center gap-2 px-6 pt-3">
        <button
          onClick={handleChatAboutThis}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer bg-transparent transition-colors hover:!text-[var(--accent)] hover:!border-[var(--accent)]"
          style={{
            border: "1px solid var(--border)",
            color: "var(--ink-tertiary)",
          }}
        >
          <MessageCircle size={14} />
          Chat about this
        </button>
        {onExpand && (
          <button
            onClick={() => onExpand(brief.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer bg-transparent transition-colors hover:!text-[var(--accent)] hover:!border-[var(--accent)]"
            style={{
              border: "1px solid var(--border)",
              color: "var(--ink-tertiary)",
            }}
          >
            <Maximize2 size={14} />
            Details
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-6 pt-4 pb-5">
        {isActionable ? (
          <>
            <button
              onClick={() => onApprove(brief.id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[10px] border-0 text-white text-sm font-semibold cursor-pointer transition-opacity"
              style={{ background: "#30D158" }}
            >
              <Check size={16} />
              Approve
            </button>
            <button
              onClick={() => setIsEditingHook(true)}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[10px] text-sm font-medium cursor-pointer bg-transparent transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--ink-secondary)",
              }}
            >
              <Pencil size={14} />
              Modify Hook
            </button>
            <button
              onClick={() => onSkip(brief.id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[10px] text-sm font-medium cursor-pointer bg-transparent transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--ink-tertiary)",
              }}
            >
              <X size={14} />
              Skip
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div
              className="text-[13px] italic"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {brief.status === "approved" && "Approved"}
              {brief.status === "skipped" && "Skipped"}
              {brief.status === "modified" &&
                `Modified: "${brief.modified_hook}"`}
              {brief.status === "posted" && "Posted"}
              {brief.status === "archived" && "Archived"}
            </div>
            {onDelete && (
              <>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs"
                      style={{ color: "var(--ink-tertiary)" }}
                    >
                      Delete this clip?
                    </span>
                    <button
                      onClick={() => {
                        onDelete(brief.id);
                        setConfirmDelete(false);
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border-0 text-xs font-semibold cursor-pointer"
                      style={{
                        background: "rgba(255,69,58,0.15)",
                        color: "#FF453A",
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg text-xs cursor-pointer bg-transparent"
                      style={{
                        border: "1px solid var(--border)",
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer bg-transparent transition-colors hover:!text-[#FF453A] hover:!border-[rgba(255,69,58,0.3)]"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

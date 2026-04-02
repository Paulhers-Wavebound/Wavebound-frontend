import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import type { FanBrief } from "@/types/fanBriefs";

interface BriefCardProps {
  brief: FanBrief;
  mode: "content" | "clips";
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onModifyHook: (id: string, newHook: string) => void;
}

function getEmbedUrl(brief: FanBrief): string | null {
  if (!brief.source_url || brief.timestamp_start == null) return null;
  const match = brief.source_url.match(/v=([^&]+)/);
  if (!match) return null;
  const videoId = match[1];
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
  pending: {
    bg: "rgba(255,159,10,0.12)",
    color: "#FF9F0A",
    label: "Pending",
  },
  approved: {
    bg: "rgba(48,209,88,0.12)",
    color: "#30D158",
    label: "Approved",
  },
  skipped: {
    bg: "rgba(142,142,147,0.12)",
    color: "#8E8E93",
    label: "Skipped",
  },
  modified: {
    bg: "rgba(10,132,255,0.12)",
    color: "#0A84FF",
    label: "Modified",
  },
  posted: {
    bg: "rgba(48,209,88,0.12)",
    color: "#30D158",
    label: "Posted",
  },
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

export default function BriefCard({
  brief,
  mode,
  onApprove,
  onSkip,
  onModifyHook,
}: BriefCardProps) {
  const [isEditingHook, setIsEditingHook] = useState(false);
  const [editedHook, setEditedHook] = useState(brief.hook_text);
  const [replayKey, setReplayKey] = useState(0);
  const [showSource, setShowSource] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const embedUrl = getEmbedUrl(brief);
  const badge = statusBadgeStyles[brief.status] ?? statusBadgeStyles.pending;
  const isActionable = mode === "content";

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
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        borderTop: "0.5px solid var(--card-edge)",
        overflow: "hidden",
        transition: "transform 150ms",
      }}
    >
      {/* Header: artist + confidence */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--bg) 0%, var(--border) 100%)",
              border: "2px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink-tertiary)",
              }}
            >
              {brief.artist_handle.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              @{brief.artist_handle}
            </div>
            {brief.source_title && (
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-tertiary)",
                  marginTop: 1,
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {brief.source_title}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Confidence score */}
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(48,209,88,0.12)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              fontWeight: 600,
              color: "#30D158",
            }}
          >
            {brief.confidence_score}%
          </div>
          {/* Status badge */}
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              background: badge.bg,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: badge.color,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            {badge.label}
          </div>
        </div>
      </div>

      {/* Video section — mode-aware */}
      {mode === "clips" ? (
        <div style={{ padding: "16px 24px 0" }}>
          {brief.rendered_clip_url ? (
            <>
              {/* Rendered clip player — 4:5 */}
              <div
                style={{
                  position: "relative",
                  paddingBottom: "125%",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#000",
                }}
              >
                <video
                  src={brief.rendered_clip_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <a
                  href={brief.rendered_clip_url}
                  download
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "#30D158",
                    color: "#fff",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  <Download size={15} />
                  Download Clip
                </a>
                {embedUrl && (
                  <button
                    onClick={() => setShowSource((s) => !s)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "9px 14px",
                      borderRadius: 10,
                      background: "none",
                      border: "1px solid var(--border)",
                      color: "var(--ink-tertiary)",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
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
                <div
                  style={{
                    position: "relative",
                    paddingBottom: "56.25%",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#000",
                    marginTop: 12,
                  }}
                >
                  <iframe
                    src={embedUrl}
                    title={brief.source_title || "Source video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            /* Rendering... placeholder */
            <div
              style={{
                position: "relative",
                paddingBottom: "125%",
                borderRadius: 12,
                overflow: "hidden",
                background: "#000",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: "3px solid rgba(255,255,255,0.15)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Rendering...
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Content mode — YouTube embed */
        embedUrl && (
          <div style={{ padding: "16px 24px 0" }}>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                borderRadius: 12,
                overflow: "hidden",
                background: "#000",
              }}
            >
              <iframe
                key={replayKey}
                src={embedUrl}
                title={brief.source_title || "Video preview"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
                padding: "8px 14px",
                borderRadius: 10,
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--ink-secondary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "color 150ms, border-color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--accent)";
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ink-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <RotateCcw size={14} />
              Replay Clip
              {brief.timestamp_start != null && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    opacity: 0.7,
                  }}
                >
                  {formatTimestamp(brief.timestamp_start)} –{" "}
                  {formatTimestamp(brief.timestamp_end)}
                </span>
              )}
            </button>
          </div>
        )
      )}

      {/* Hook text — editable on click */}
      <div style={{ padding: "16px 24px 0" }}>
        {isEditingHook ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
              style={{
                width: "100%",
                minHeight: 60,
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--accent)",
                background: "var(--bg)",
                color: "var(--ink)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 16,
                fontStyle: "italic",
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
              }}
            />
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setEditedHook(brief.hook_text);
                  setIsEditingHook(false);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "none",
                  color: "var(--ink-secondary)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHook}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Hook
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => isActionable && setIsEditingHook(true)}
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 18,
              fontWeight: 500,
              fontStyle: "italic",
              color: "var(--ink)",
              lineHeight: 1.5,
              cursor: isActionable ? "text" : "default",
              padding: "8px 0",
              borderRadius: 8,
              transition: "background 150ms",
            }}
            title={isActionable ? "Click to edit hook" : undefined}
          >
            "{brief.modified_hook || brief.hook_text}"
            {isActionable && (
              <Pencil
                size={13}
                color="var(--ink-tertiary)"
                style={{ marginLeft: 8, verticalAlign: "middle", opacity: 0.5 }}
              />
            )}
          </div>
        )}
        {brief.caption && (
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-tertiary)",
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {brief.caption}
          </div>
        )}
      </div>

      {/* Tags row: format, platforms, sound pairing */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: "12px 24px 0",
        }}
      >
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 8,
            background: tagColors.format.bg,
            color: tagColors.format.color,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {brief.format_recommendation.replace(/_/g, " ")}
        </span>
        {brief.platform_recommendation.map((p) => (
          <span
            key={p}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: tagColors.platform.bg,
              color: tagColors.platform.color,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {p}
          </span>
        ))}
        {brief.sound_pairing && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: tagColors.reason.bg,
              color: tagColors.reason.color,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {brief.sound_pairing}
          </span>
        )}
      </div>

      {/* Source info block */}
      <div
        style={{
          margin: "16px 24px 0",
          padding: 16,
          borderRadius: 12,
          background: "var(--surface-hover)",
          border: "1px solid var(--border)",
        }}
      >
        {brief.source_title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <ExternalLink size={12} color="var(--ink-tertiary)" />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink-secondary)",
              }}
            >
              {brief.source_title}
            </span>
            {brief.timestamp_start != null && (
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-tertiary)",
                }}
              >
                {formatTimestamp(brief.timestamp_start)} –{" "}
                {formatTimestamp(brief.timestamp_end)}
              </span>
            )}
          </div>
        )}
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-secondary)",
            lineHeight: 1.5,
          }}
        >
          {brief.why_now}
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "16px 24px 20px",
        }}
      >
        {isActionable ? (
          <>
            <button
              onClick={() => onApprove(brief.id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 10,
                border: "none",
                background: "#30D158",
                color: "#fff",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 150ms",
              }}
            >
              <Check size={16} />
              Approve
            </button>
            <button
              onClick={() => setIsEditingHook(true)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "none",
                color: "var(--ink-secondary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 150ms",
              }}
            >
              <Pencil size={14} />
              Modify Hook
            </button>
            <button
              onClick={() => onSkip(brief.id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "none",
                color: "var(--ink-tertiary)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 150ms",
              }}
            >
              <X size={14} />
              Skip
            </button>
          </>
        ) : (
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-tertiary)",
              fontStyle: "italic",
            }}
          >
            {brief.status === "approved" && "Approved"}
            {brief.status === "skipped" && "Skipped"}
            {brief.status === "modified" &&
              `Modified: "${brief.modified_hook}"`}
            {brief.status === "posted" && "Posted"}
            {brief.status === "archived" && "Archived"}
          </div>
        )}
      </div>
    </div>
  );
}

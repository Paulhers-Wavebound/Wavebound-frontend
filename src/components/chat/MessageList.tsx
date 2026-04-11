import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { AlertCircle, RotateCcw, Copy, Check } from "lucide-react";
import ToolStatusCard, {
  type ToolStatus,
  SOURCE_LABELS,
} from "./ToolStatusCard";
import VideoCardStrip from "./VideoCardStrip";
import { extractTikTokVideos } from "@/utils/extractTikTokVideos";
import TikTokLinkReplacer from "./TikTokLinkReplacer";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
}

type MaybeRef = React.RefObject<HTMLDivElement> | null;

// ── Extract follow-up suggestions from Claude's response ──
const TRIGGER_PATTERNS = [
  /want me to/i,
  /would you like/i,
  /i can also/i,
  /let me know if/i,
  /shall i/i,
  /dig deeper/i,
  /explore further/i,
  /next steps/i,
  /i could also/i,
  /here are some.*(?:follow|next|question)/i,
];

function extractFollowUps(content: string): string[] {
  const lines = content.split("\n");
  const results: string[] = [];

  let triggerIdx = -1;
  const searchStart = Math.max(0, lines.length - 20);

  for (let i = searchStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (TRIGGER_PATTERNS.some((p) => p.test(line))) {
      triggerIdx = i;
      break;
    }
  }

  const extractStart =
    triggerIdx >= 0 ? triggerIdx : Math.max(0, lines.length - 10);

  for (let i = extractStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let extracted = "";

    const emojiBold = line.match(
      /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*\*\*(.+?)\*\*/u,
    );
    if (emojiBold) {
      extracted = emojiBold[1].trim();
    } else if (/^[-*•]\s+/.test(line) && i > extractStart) {
      extracted = line.replace(/^[-*•]\s+/, "").trim();
    } else if (/^\d+[.)]\s+/.test(line) && i > extractStart) {
      extracted = line.replace(/^\d+[.)]\s+/, "").trim();
    }

    if (extracted) {
      extracted = extracted.replace(/\*\*(.*?)\*\*/g, "$1");
      extracted = extracted.replace(/\*(.*?)\*/g, "$1");
      extracted = extracted.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      extracted = extracted.replace(/[.!?]+$/, "").trim();
      if (extracted.length > 5 && extracted.length < 120) {
        results.push(extracted);
      }
    }
  }

  return results.slice(0, 4);
}

function generateGenericFollowUps(content: string): string[] {
  const lower = content.toLowerCase();
  if (lower.includes("morning brief"))
    return ["Tell me more", "Show me detailed metrics"];
  if (lower.includes("roster") || lower.includes("artist"))
    return ["Show me detailed metrics", "Who needs the most attention?"];
  if (
    lower.includes("tiktok") ||
    lower.includes("video") ||
    lower.includes("viral")
  )
    return ["Show me examples", "What formats are working?"];
  if (
    lower.includes("sound") ||
    lower.includes("audio") ||
    lower.includes("track")
  )
    return ["What sounds are trending?", "Show me sound analytics"];
  if (
    lower.includes("alert") ||
    lower.includes("breakout") ||
    lower.includes("drought")
  )
    return ["Show me the full roster status", "Any positive trends?"];
  if (lower.includes("stream") || lower.includes("spotify"))
    return ["Compare to last month", "Which tracks are growing?"];
  return ["Tell me more", "Create an action plan"];
}

// ── Source citation tags ──
const SourceTags = React.memo(function SourceTags({
  tools,
}: {
  tools: string[];
}) {
  const labels = [
    ...new Set(tools.map((t) => SOURCE_LABELS[t]).filter(Boolean)),
  ];
  if (labels.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
      <span
        className="text-xs font-mono"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        Sources
      </span>
      {labels.map((label) => (
        <span
          key={label}
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{
            color: "rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
});

// ── Skeleton shimmer (pre-first-token) ──
const StreamingSkeleton = React.memo(function StreamingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-2.5 py-2"
    >
      {[0.65, 0.85, 0.45].map((w, i) => (
        <div
          key={i}
          className="h-3.5 rounded animate-pulse"
          style={{
            width: `${w * 100}%`,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </motion.div>
  );
});

// ── Error card ──
const ErrorCard = React.memo(function ErrorCard({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-8"
    >
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
        style={{
          backgroundColor: "rgba(239,68,68,0.08)",
          borderColor: "rgba(239,68,68,0.15)",
        }}
      >
        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
        <span className="text-sm text-red-400 flex-1">{error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:bg-white/10 text-red-300"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
});

// ── Copy button (hover-only) ──
const CopyButton = React.memo(function CopyButton({
  content,
}: {
  content: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy");
      });
  }, [content]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-0 right-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-white/10"
      title="Copy response"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Copy className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
      )}
    </button>
  );
});

// ── Individual message item ──
const MessageItem = React.memo(function MessageItem({
  msg,
  isStreaming,
  containerRef,
  toolStatuses,
  sourceTags,
}: {
  msg: Message;
  isStreaming?: boolean;
  containerRef?: MaybeRef;
  toolStatuses?: Map<string, ToolStatus>;
  sourceTags?: string[];
}) {
  const streamdownRef = useRef<HTMLDivElement>(null);
  const isComplete = !isStreaming && !!msg.content;

  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-7">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap"
          style={{
            backgroundColor: "var(--surface-hover)",
            color: "var(--ink)",
          }}
        >
          {msg.image && (
            <img src={msg.image} alt="" className="max-w-xs rounded-lg mb-2" />
          )}
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant message — full-width, no bubble
  return (
    <div
      ref={containerRef ?? undefined}
      className="group relative mb-8"
      style={{ minHeight: isStreaming ? 60 : undefined }}
    >
      {/* Copy button — top-right on hover */}
      {isComplete && <CopyButton content={msg.content} />}

      {/* Source citation tags */}
      {isComplete && sourceTags && sourceTags.length > 0 && (
        <SourceTags tools={sourceTags} />
      )}

      {/* Inline tool status lines — above content during streaming */}
      {isStreaming && toolStatuses && toolStatuses.size > 0 && (
        <div className="mb-3">
          {Array.from(toolStatuses.values()).map((ts) => (
            <ToolStatusCard key={ts.tool} toolStatus={ts} />
          ))}
        </div>
      )}

      {/* TikTok video preview cards — completed messages only */}
      {isComplete &&
        (() => {
          const videos = extractTikTokVideos(msg.content);
          return videos.length > 0 ? <VideoCardStrip videos={videos} /> : null;
        })()}

      {/* Markdown content */}
      <div
        ref={streamdownRef}
        className={`streamdown-container${isStreaming ? " is-streaming" : ""}`}
        style={msg.content.length === 0 ? { minHeight: "2rem" } : undefined}
      >
        <Streamdown mode={isStreaming ? "streaming" : "static"}>
          {msg.content}
        </Streamdown>
      </div>

      {/* Replace TikTok links with inline pills */}
      <TikTokLinkReplacer containerRef={streamdownRef} active={isComplete} />
      {/* Style inline [Source] tags if Claude includes them */}
      <SourceTagReplacer containerRef={streamdownRef} active={isComplete} />
    </div>
  );
});

// ── Inline source tag replacer ──
// Scans rendered HTML for [Roster Data], [Artist KB], etc. and wraps them in styled spans.
// No-op if Claude doesn't include these patterns.
const SOURCE_TAG_RE =
  /\[(Roster Data|Artist KB|Viral DB|Sound Intel|Alerts|Web)\]/g;

const SourceTagReplacer = React.memo(function SourceTagReplacer({
  containerRef,
  active,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  active: boolean;
}) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
    );
    const replacements: {
      node: Text;
      matches: { start: number; end: number; label: string }[];
    }[] = [];

    let textNode: Node | null;
    while ((textNode = walker.nextNode())) {
      const text = textNode.textContent || "";
      const matches: { start: number; end: number; label: string }[] = [];
      let m: RegExpExecArray | null;
      SOURCE_TAG_RE.lastIndex = 0;
      while ((m = SOURCE_TAG_RE.exec(text)) !== null) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          label: m[1],
        });
      }
      if (matches.length > 0)
        replacements.push({ node: textNode as Text, matches });
    }

    for (const { node, matches } of replacements) {
      const text = node.textContent || "";
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const m of matches) {
        if (m.start > last)
          frag.appendChild(document.createTextNode(text.slice(last, m.start)));
        const span = document.createElement("span");
        span.className = "inline-source-tag";
        span.textContent = m.label;
        frag.appendChild(span);
        last = m.end;
      }
      if (last < text.length)
        frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode?.replaceChild(frag, node);
    }
  }, [active, containerRef]);

  return null;
});

// ── Follow-up suggestion pills ──
const FollowUpPills = React.memo(function FollowUpPills({
  content,
  onSubmit,
}: {
  content: string;
  onSubmit: (text: string) => void;
}) {
  let pills = extractFollowUps(content);
  if (pills.length === 0) {
    pills = generateGenericFollowUps(content);
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {pills.map((pill, i) => (
        <motion.button
          key={pill}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: i * 0.06 }}
          onClick={() => onSubmit(pill)}
          className="text-sm bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-full px-3.5 py-1.5 cursor-pointer transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {pill}
        </motion.button>
      ))}
    </div>
  );
});

// ── Message list ──
interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  showStatusIndicator: boolean;
  toolStatuses: Map<string, ToolStatus>;
  streamError: string | null;
  messageSourcesMap?: Map<string, string[]>;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onFollowUpSubmit?: (text: string) => void;
  streamingRef?: React.RefObject<HTMLDivElement>;
}

const MessageList = React.memo(function MessageList({
  messages,
  isStreaming,
  showStatusIndicator,
  toolStatuses,
  streamError,
  messageSourcesMap,
  onRetry,
  onFollowUpSubmit,
  streamingRef,
}: MessageListProps) {
  const hasStreamingText =
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    !!messages[messages.length - 1]?.content;

  const lastMsg = messages[messages.length - 1];
  const showPills =
    !isStreaming &&
    !streamError &&
    lastMsg?.role === "assistant" &&
    !!lastMsg.content &&
    !!onFollowUpSubmit;

  return (
    <>
      {messages.map((msg, i) => {
        if (
          msg.role === "assistant" &&
          !msg.content &&
          !(isStreaming && i === messages.length - 1)
        )
          return null;
        const isStreamingMsg =
          isStreaming && i === messages.length - 1 && msg.role === "assistant";
        return (
          <MessageItem
            key={msg.id}
            msg={msg}
            isStreaming={isStreamingMsg}
            containerRef={isStreamingMsg ? streamingRef : null}
            toolStatuses={isStreamingMsg ? toolStatuses : undefined}
            sourceTags={messageSourcesMap?.get(msg.id)}
          />
        );
      })}

      {/* Follow-up suggestion pills */}
      {showPills && (
        <FollowUpPills content={lastMsg.content} onSubmit={onFollowUpSubmit!} />
      )}

      {/* Skeleton shimmer — before any tool status or text arrives */}
      <AnimatePresence>
        {showStatusIndicator &&
          toolStatuses.size === 0 &&
          !hasStreamingText && <StreamingSkeleton />}
      </AnimatePresence>

      {/* Error card */}
      {streamError && !isStreaming && (
        <ErrorCard error={streamError} onRetry={onRetry} />
      )}
    </>
  );
});

export default MessageList;

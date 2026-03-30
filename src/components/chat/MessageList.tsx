import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { CheckCircle2, AlertCircle, RotateCcw, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ToolStatusCard, { type ToolStatus } from './ToolStatusCard';
import VideoCardStrip from './VideoCardStrip';
import { extractTikTokVideos } from '@/utils/extractTikTokVideos';
import TikTokLinkReplacer from './TikTokLinkReplacer';

const T = {
  elevated: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  accent: '#8B5CF6',
} as const;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type MaybeRef = React.RefObject<HTMLDivElement> | null;

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ── Typing indicator (3 bouncing dots) ──
const TypingIndicator = React.memo(function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-6"
    >
      <p className="text-xs mb-1.5 ml-1" style={{ color: T.textSecondary }}>Wavebound</p>
      <div className="flex items-center gap-1.5 ml-1 h-6">
        {[0, 150, 300].map(d => (
          <span
            key={d}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: T.accent, animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </motion.div>
  );
});

// ── Single status card ──
const StatusCard = React.memo(function StatusCard({
  status,
  isActive,
}: {
  status: string;
  isActive: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-opacity duration-300"
      style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        opacity: isActive ? 1 : 0.6,
      }}
    >
      <div className="shrink-0 w-4 h-4 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: T.accent, borderTopColor: 'transparent' }}
            />
          ) : (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm" style={{ color: T.textSecondary }}>{status}</span>
    </motion.div>
  );
});

// ── Status stack ──
const StatusStack = React.memo(function StatusStack({
  statusHistory,
  isStreamingText,
}: {
  statusHistory: string[];
  isStreamingText: boolean;
}) {
  if (statusHistory.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-4"
    >
      <p className="text-xs mb-1.5 ml-1" style={{ color: T.textSecondary }}>Wavebound</p>
      <div className="flex flex-col gap-1.5">
        {statusHistory.map((status, i) => (
          <StatusCard
            key={`${i}-${status}`}
            status={status}
            isActive={!isStreamingText && i === statusHistory.length - 1}
          />
        ))}
      </div>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-6"
    >
      <p className="text-xs mb-1.5 ml-1" style={{ color: T.textSecondary }}>Wavebound</p>
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
        style={{
          backgroundColor: 'rgba(239,68,68,0.1)',
          borderColor: 'rgba(239,68,68,0.2)',
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

// ── Message action buttons ──
const MessageActions = React.memo(function MessageActions({
  content,
  messageId,
  isLastAssistant,
  onRegenerate,
}: {
  content: string;
  messageId: string;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleVote = useCallback((direction: 'up' | 'down') => {
    setVote(prev => (prev === direction ? null : direction));
    // Silent log — table may not exist yet
    try {
      console.log('[feedback]', { messageId, vote: direction });
    } catch {}
  }, [messageId]);

  const btnBase = "w-8 h-8 rounded-lg bg-transparent hover:bg-white/10 flex items-center justify-center transition-colors duration-150";

  return (
    <div className="flex items-center gap-0.5 opacity-40 md:opacity-0 md:group-hover:opacity-100 active:opacity-100 transition-opacity duration-150">
      <button onClick={handleCopy} className={btnBase} title="Copy">
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Check className="w-4 h-4 text-emerald-400" />
            </motion.div>
          ) : (
            <motion.div key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Copy className="w-4 h-4" style={{ color: T.textSecondary }} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {isLastAssistant && onRegenerate && (
        <button onClick={onRegenerate} className={btnBase} title="Regenerate">
          <RefreshCw className="w-4 h-4" style={{ color: T.textSecondary }} />
        </button>
      )}

      <button onClick={() => handleVote('up')} className={btnBase} title="Thumbs up">
        <ThumbsUp className="w-4 h-4" style={{ color: vote === 'up' ? '#22c55e' : T.textSecondary }} fill={vote === 'up' ? '#22c55e' : 'none'} />
      </button>

      <button onClick={() => handleVote('down')} className={btnBase} title="Thumbs down">
        <ThumbsDown className="w-4 h-4" style={{ color: vote === 'down' ? '#ef4444' : T.textSecondary }} fill={vote === 'down' ? '#ef4444' : 'none'} />
      </button>
    </div>
  );
});

// ── Individual message item ──
const MessageItem = React.memo(function MessageItem({
  msg,
  isStreaming,
  containerRef,
  isLastAssistant,
  onRegenerate,
  toolStatuses,
}: {
  msg: Message;
  isStreaming?: boolean;
  containerRef?: MaybeRef;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  toolStatuses?: Map<string, ToolStatus>;
}) {
  const streamdownRef = useRef<HTMLDivElement>(null);
  const isComplete = !isStreaming && !!msg.content;

  return (
    <div
      ref={containerRef ?? undefined}
      data-role={msg.role}
      className="mb-6 group"
    >
      {msg.role === 'user' ? (
        <div>
          <div className="flex justify-end">
            <div className="max-w-[80%] px-4 py-3 rounded-2xl text-[15px] whitespace-pre-wrap" style={{ backgroundColor: T.elevated, color: T.text }}>
              {msg.content}
            </div>
          </div>
          <p className="text-xs mt-1 text-right" style={{ color: '#6B7280' }}>{formatTime(msg.timestamp)}</p>
        </div>
      ) : (
        <div className="relative md:hover:bg-white/[0.02] transition-colors duration-200 ease-out rounded-lg px-2 -mx-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs ml-1" style={{ color: T.textSecondary }}>Wavebound</p>
            {isComplete && (
              <MessageActions
                content={msg.content}
                messageId={msg.id}
                isLastAssistant={!!isLastAssistant}
                onRegenerate={onRegenerate}
              />
            )}
          </div>
          {/* TikTok video preview cards — completed messages only, ABOVE text */}
          {isComplete && (() => {
            const videos = extractTikTokVideos(msg.content);
            return videos.length > 0 ? <VideoCardStrip videos={videos} /> : null;
          })()}
          <div ref={streamdownRef} className="streamdown-container" style={msg.content.length === 0 ? { minHeight: '2rem' } : undefined}>
            <Streamdown mode={isStreaming ? 'streaming' : 'static'}>{msg.content}</Streamdown>
          </div>
          {/* Replace "Watch on TikTok" links with inline play pills */}
          <TikTokLinkReplacer containerRef={streamdownRef} active={isComplete} />
          {/* Inline tool status cards during streaming */}
          {isStreaming && toolStatuses && toolStatuses.size > 0 && (
            <div className="mt-1">
              {Array.from(toolStatuses.values()).map(ts => (
                <ToolStatusCard key={ts.tool} toolStatus={ts} />
              ))}
            </div>
          )}
          <p className="text-xs mt-1 ml-1" style={{ color: '#6B7280' }}>{formatTime(msg.timestamp)}</p>
        </div>
      )}
    </div>
  );
});

// ── Follow-up suggestion pills ──
function generateFollowUps(content: string): string[] {
  const lower = content.toLowerCase();
  if (lower.includes('tiktok') || lower.includes('video')) return ['Show me examples', 'Create a TikTok plan'];
  if (lower.includes('stream') || lower.includes('spotify')) return ['Compare to last month', 'Which tracks are growing?'];
  if (lower.includes('lyric') || lower.includes('song')) return ['Give me more lyric ideas', 'What themes work best?'];
  return ['Tell me more', 'Create an action plan', 'What else should I know?'];
}

const FollowUpPills = React.memo(function FollowUpPills({
  content,
  onSubmit,
}: {
  content: string;
  onSubmit: (text: string) => void;
}) {
  const pills = generateFollowUps(content);
  return (
    <div className="flex flex-wrap gap-2 mb-6 ml-1">
      {pills.map((pill, i) => (
        <motion.button
          key={pill}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: i * 0.08 }}
          onClick={() => onSubmit(pill)}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 cursor-pointer transition-colors duration-150"
          style={{ color: T.textSecondary }}
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
  onRetry,
  onRegenerate,
  onFollowUpSubmit,
  streamingRef,
}: MessageListProps) {
  const hasStreamingText = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !!messages[messages.length - 1]?.content;

  // Find the last assistant message index
  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].content) {
      lastAssistantIdx = i;
      break;
    }
  }

  const lastMsg = messages[messages.length - 1];
  const showPills = !isStreaming && !streamError && lastMsg?.role === 'assistant' && !!lastMsg.content && !!onFollowUpSubmit;

  return (
    <>
      {messages.map((msg, i) => {
        if (msg.role === 'assistant' && !msg.content) return null;
        return (
          <MessageItem
            key={msg.id}
            msg={msg}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
            containerRef={isStreaming && i === messages.length - 1 && msg.role === 'assistant' ? streamingRef : null}
            isLastAssistant={i === lastAssistantIdx}
            onRegenerate={onRegenerate}
            toolStatuses={isStreaming && i === messages.length - 1 && msg.role === 'assistant' ? toolStatuses : undefined}
          />
        );
      })}

      {/* Follow-up suggestion pills */}
      {showPills && (
        <FollowUpPills content={lastMsg.content} onSubmit={onFollowUpSubmit!} />
      )}

      {/* Typing dots — only before any status or delta */}
      {showStatusIndicator && toolStatuses.size === 0 && !hasStreamingText && (
        <TypingIndicator />
      )}

      {/* Error card */}
      {streamError && !isStreaming && (
        <ErrorCard error={streamError} onRetry={onRetry} />
      )}
    </>
  );
});

export default MessageList;

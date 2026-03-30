import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { streamChatMessage, type StreamCallbacks } from "@/services/chatJobService";
import { AssistantConversation } from "@/components/AssistantConversation";
import { useChatSessionsContext } from "@/contexts/ChatSessionsContext";
import { useDiscover, formatVideoForAIPrompt } from "@/contexts/DiscoverContext";
import { motion, AnimatePresence } from "framer-motion";
import { Video as VideoIcon, X, Sparkles, Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TikTokThumbnail from "@/components/TikTokThumbnail";
import { parseGenreJson } from "@/utils/genreParser";
import TikTokEmbed from "@/components/TikTokEmbed";
import InstagramEmbed from "@/components/InstagramEmbed";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useActivityTracker } from "@/hooks/useActivityTracker";

function repairAndParseJson(json: string): unknown {
  let cleaned = json
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  cleaned = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, "");

  // If truncated, try to close braces/brackets
  let braces = 0;
  let brackets = 0;
  for (const ch of cleaned) {
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }
  while (brackets > 0) {
    cleaned += "]";
    brackets--;
  }
  while (braces > 0) {
    cleaned += "}";
    braces--;
  }

  return JSON.parse(cleaned);
}

function extractJsonFromMixedResponse(content: string): unknown {
  const raw = content.trim();

  // 1) Pure JSON (object or array)
  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }

  // 2) Markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      return repairAndParseJson(codeBlockMatch[1]);
    }
  }

  // 3) Prefer extracting an array first (common for lists)
  const arrayStart = raw.indexOf("[");
  const arrayEnd = raw.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    const maybeArray = raw.substring(arrayStart, arrayEnd + 1);
    try {
      return JSON.parse(maybeArray);
    } catch {
      return repairAndParseJson(maybeArray);
    }
  }

  // 4) Fallback: extract an object
  const objStart = raw.indexOf("{");
  const objEnd = raw.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    const maybeObj = raw.substring(objStart, objEnd + 1);
    try {
      return JSON.parse(maybeObj);
    } catch {
      return repairAndParseJson(maybeObj);
    }
  }

  throw new Error("Could not extract JSON from response");
}

// Helper to format number
function formatNumber(num: number | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${Math.floor(num / 1000)}K`;
  return num.toString();
}

export function DiscoverAssistant() {
  const {
    currentSessionId,
    messages,
    userId,
    createSession,
    addMessage,
  } = useChatSessionsContext();

  const { videoForAI, clearVideoForAI, planForAI, clearPlanForAI, activeVideoContext, clearActiveVideoContext } = useDiscover();
  const pendingVideoRef = useRef(videoForAI);
  const pendingPlanRef = useRef(planForAI);
  
  const [activePlanContext, setActivePlanContext] = useState<typeof planForAI>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  // When a plan is sent to AI, set it as active
  useEffect(() => {
    if (planForAI) {
      setActivePlanContext(planForAI);
    }
  }, [planForAI]);

  // Keep track of pending contexts
  useEffect(() => {
    pendingVideoRef.current = videoForAI;
  }, [videoForAI]);

  useEffect(() => {
    pendingPlanRef.current = planForAI;
  }, [planForAI]);

  // Create a session if none exists when the component mounts
  useEffect(() => {
    if (userId && !currentSessionId) {
      createSession();
    }
  }, [userId, currentSessionId, createSession]);
  
  // Handler to clear both pending and active context
  const handleClearVideoContext = useCallback(() => {
    clearActiveVideoContext();
  }, [clearActiveVideoContext]);

  const handleClearPlanContext = useCallback(() => {
    clearPlanForAI();
    setActivePlanContext(null);
  }, [clearPlanForAI]);

  const { checkRateLimit, validateInput } = useRateLimit();
  const { trackActivity } = useActivityTracker();
  const chatStartedRef = useRef(false);

  const handleSendMessage = useCallback(
    async (
      message: string,
      _history: { role: string; content: string }[],
      streamingCallbacks?: { onDelta?: (text: string) => void; onStatus?: (tool: string, status: string) => void },
      signal?: AbortSignal,
    ): Promise<string> => {
      const validated = validateInput(message);
      if (!validated) return '';
      if (!checkRateLimit()) return '';

      // Ensure we have a session
      let sessionId = currentSessionId;
      if (!sessionId && userId) {
        sessionId = await createSession();
      }
      
      if (!sessionId) {
        return "Please log in to chat.";
      }

      // Check if there's video or plan context to include
      let messageWithContext = validated;
      const videoContext = pendingVideoRef.current;
      const planContext = pendingPlanRef.current;
      
      if (videoContext?.video) {
        const contextStr = formatVideoForAIPrompt(videoContext.video);
        messageWithContext = `${contextStr}\n\nUser question about this video: ${validated}`;
        clearVideoForAI();
      } else if (planContext) {
        const planJson = JSON.stringify({
          analysisResult: planContext.analysisResult,
          genres: planContext.genres,
          subGenres: planContext.subGenres,
          planVideos: planContext.planVideos.map((v, i) => ({
            day: i + 1,
            id: v.id,
            content_style: v.content_style,
            genre: v.genre,
            hook: (v as any).hook,
            caption: v.caption,
            views: v.video_views,
            likes: v.video_likes,
          })),
        });
        messageWithContext = `<content_plan_context>\n${planJson}\n</content_plan_context>\n\nUser question about this content plan: ${validated}`;
        clearPlanForAI();
      }

      // Track activity
      trackActivity('message_sent', { sessionId });
      if (!chatStartedRef.current) {
        chatStartedRef.current = true;
        trackActivity('ai_chat_started', { sessionId });
      }

      // Save user message to database
      try { await addMessage(sessionId, 'user', message); } catch (e) { console.warn('[DiscoverAssistant] Failed to save user message:', e); }

      try {
        const callbacks: StreamCallbacks = {
          onDelta: streamingCallbacks?.onDelta,
          onStatus: streamingCallbacks?.onStatus,
          onError: (errorMsg) => {
            console.error('[DiscoverAssistant] SSE error:', errorMsg);
          },
        };

        const fullText = await streamChatMessage(
          { message: messageWithContext, session_id: sessionId },
          callbacks,
          signal,
        );

        if (!fullText || fullText.trim() === '') {
          const errorMsg = 'I received your message but got no response. Please try again.';
          try { await addMessage(sessionId, 'assistant', errorMsg); } catch (e) { console.warn('[DiscoverAssistant] Failed to save error message:', e); }
          return errorMsg;
        }

        // Save to DB
        try {
          await addMessage(sessionId, 'assistant', fullText);
        } catch (saveErr) {
          console.warn('[DiscoverAssistant] Failed to save assistant message:', saveErr);
        }
        return fullText;
      } catch (err) {
        if (signal?.aborted) return '';
        console.error('[DiscoverAssistant] streaming error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        try { await addMessage(sessionId, 'assistant', errorMsg); } catch (e) { console.warn('[DiscoverAssistant] Failed to save error message:', e); }
        return errorMsg;
      }
    },
    [userId, currentSessionId, createSession, addMessage, clearVideoForAI, clearPlanForAI, checkRateLimit, validateInput, trackActivity]
  );

  // Convert stored messages to the format AssistantConversation expects
  const initialMessages = messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    created_at: m.created_at,
  }));

  const parseContentStyle = (style: string | undefined): string => {
    if (!style) return 'Video';
    try {
      const parsed = JSON.parse(style);
      if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]).trim();
      return String(parsed);
    } catch {
      return style.split(',')[0].replace(/[\[\]"]/g, '').trim() || 'Video';
    }
  };

  const parseGenreForDisplay = (genre: string | undefined): string => {
    if (!genre) return 'Video';
    const parsed = parseGenreJson(genre);
    return parsed.length > 0 ? parsed[0] : 'Video';
  };

  const parseHookText = (hook: string | undefined): string => {
    if (!hook) return '';
    try {
      const parsed = JSON.parse(hook);
      if (typeof parsed === 'object' && parsed?.string) return parsed.string;
      if (typeof parsed === 'string') return parsed;
    } catch { /* not JSON */ }
    return hook;
  };

  // The video to display in the banner: use activeVideoContext which persists after sending
  const displayVideo = activeVideoContext?.video;
  // Check if we're still in "pending" state (not yet sent) or "active" state (already included in conversation)
  const isPending = !!videoForAI;

  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      {/* Video Context Banner - shows when a video is attached (persists after sending) */}
      <AnimatePresence>
        {displayVideo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-primary/30"
          >
            <div className="flex gap-2 p-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              {/* Clickable Thumbnail */}
              <div
                className="w-14 flex-shrink-0 rounded-md overflow-hidden bg-muted cursor-pointer relative group"
                style={{ aspectRatio: '9/16' }}
                onClick={() => setShowVideoPreview(true)}
              >
                {displayVideo.thumbnail_url ? (
                  <img
                    src={displayVideo.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : displayVideo.embedded_ulr ? (
                  <TikTokThumbnail
                    videoId={displayVideo.id}
                    tiktokUrl={displayVideo.embedded_ulr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <VideoIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs font-medium text-primary">
                    {isPending ? 'Asking about this video' : 'Discussing this video'}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {parseContentStyle(displayVideo.content_style)} • {parseGenreForDisplay(displayVideo.genre)}
                </p>
                {(displayVideo as any).artist_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {(displayVideo as any).artist_name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatNumber(displayVideo.video_views)} views • Score: {Math.round((displayVideo.outliar_score || 0) * 100) / 100}
                </p>
                {parseHookText((displayVideo as any).hook) && (
                  <p className="text-xs text-muted-foreground/70 italic truncate">
                    "{parseHookText((displayVideo as any).hook)}"
                  </p>
                )}
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearVideoContext}
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive self-start"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Context Banner */}
      <AnimatePresence>
        {activePlanContext && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-primary/30"
          >
            <div className="p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {!!planForAI ? 'Asking about this plan' : 'Discussing this plan'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearPlanContext}
                  className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              {/* Genre badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {activePlanContext.genres.map(g => (
                  <Badge key={g} variant="genre" className="text-[10px] px-1.5 py-0">{g}</Badge>
                ))}
                {activePlanContext.subGenres.map(sg => (
                  <Badge key={sg} variant="contentStyle" className="text-[10px] px-1.5 py-0">{sg}</Badge>
                ))}
              </div>
              {/* Mini day thumbnails */}
              <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {activePlanContext.planVideos.slice(0, 7).map((v, i) => (
                  <div key={v.id} className="flex-shrink-0 w-10 rounded overflow-hidden bg-muted relative" style={{ aspectRatio: '9/16' }}>
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                    )}
                    <div className="absolute inset-0 flex items-end justify-center pb-0.5">
                      <span className="text-[9px] font-bold text-white bg-black/50 rounded px-1">D{i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview Dialog */}
      <Dialog open={showVideoPreview} onOpenChange={setShowVideoPreview}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none">
          <div className="w-full max-h-[80vh] overflow-auto">
            {displayVideo?.embedded_ulr && !(displayVideo as any).is_reel && (
              <TikTokEmbed
                tiktokUrl={displayVideo.embedded_ulr}
                videoId={displayVideo.id}
                thumbnailUrl={displayVideo.thumbnail_url}
                className="w-full"
              />
            )}
            {displayVideo?.embedded_ulr && (displayVideo as any).is_reel && (
              <InstagramEmbed
                reelUrl={displayVideo.embedded_ulr}
                videoId={displayVideo.id}
                className="w-full"
              />
            )}
            {!displayVideo?.embedded_ulr && displayVideo?.thumbnail_url && (
              <img src={displayVideo.thumbnail_url} alt="" className="w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <AssistantConversation 
          key={currentSessionId || 'new'}
          onMessage={handleSendMessage} 
          className="h-full"
          initialMessages={initialMessages}
          hideHeader
        />
      </div>
    </div>
  );
}

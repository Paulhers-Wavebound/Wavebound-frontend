import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Star,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  AudioWaveform,
  BarChart3,
  Music,
  TrendingUp,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useChatSessionsContext } from "@/contexts/ChatSessionsContext";
import {
  streamChatMessage,
  type StreamCallbacks,
} from "@/services/chatJobService";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  subDays,
  isAfter,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { useLocation } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import ChatInput from "@/components/chat/ChatInput";
import MessageList from "@/components/chat/MessageList";

// ── Dark theme tokens ──
const T = {
  bg: "#0A0A0A",
  surface: "#141414",
  elevated: "#1E1E1E",
  border: "rgba(255,255,255,0.06)",
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  accent: "#e8430a",
  accentHover: "#ff5722",
} as const;

// ── Types ──
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

// ── Group sessions by date ──
function groupSessions(sessions: ChatSession[]) {
  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];
  const sevenDaysAgo = subDays(new Date(), 7);
  const sorted = [...sessions].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  sorted.forEach((s) => {
    const d = new Date(s.updated_at);
    if (isToday(d)) groups[0].items.push(s);
    else if (isYesterday(d)) groups[1].items.push(s);
    else if (isAfter(d, sevenDaysAgo)) groups[2].items.push(s);
    else groups[3].items.push(s);
  });
  return groups.filter((g) => g.items.length > 0);
}

// ── Suggestion cards ──
const SUGGESTIONS = [
  {
    icon: BarChart3,
    title: "Stream performance",
    description: "Check how your streams are doing this week",
    prompt: "How are my streams doing this week?",
  },
  {
    icon: Music,
    title: "Viral sounds",
    description: "Find trending sounds in your genre",
    prompt: "Find viral sounds in my genre",
  },
  {
    icon: TrendingUp,
    title: "Content insights",
    description: "See what content is performing best",
    prompt: "What content is working best?",
  },
  {
    icon: Target,
    title: "Next move",
    description: "Get a recommendation for your next post",
    prompt: "What should I post next?",
  },
];

// ── Sidebar content ──
const SidebarContent = React.memo(function SidebarContent({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onToggleFavorite,
  onRenameSession,
  isCurrentSessionEmpty,
}: {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  isCurrentSessionEmpty: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const groups = useMemo(() => groupSessions(sessions), [sessions]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#0E0E0E", color: T.text }}
    >
      <div
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <span className="font-semibold text-sm" style={{ color: T.text }}>
          Conversations
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          disabled={isCurrentSessionEmpty}
          className="h-8 gap-1.5 text-xs hover:bg-white/5"
          style={{ color: T.textSecondary }}
        >
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>
      <div
        className="flex-1 overflow-y-auto p-2 space-y-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {groups.map((group) => (
          <div key={group.label}>
            <p
              className="text-[11px] uppercase tracking-wider font-medium px-2 mb-1.5"
              style={{ color: T.textSecondary }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((session) => (
                <div
                  key={session.id}
                  onClick={() =>
                    editingId !== session.id && onSelectSession(session.id)
                  }
                  className={cn(
                    "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors",
                    currentSessionId === session.id
                      ? "bg-white/5"
                      : "hover:bg-white/4",
                  )}
                  style={
                    currentSessionId === session.id
                      ? {
                          backgroundColor: "rgba(255,255,255,0.05)",
                          borderLeft: `3px solid ${T.accent}`,
                        }
                      : undefined
                  }
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(session.id);
                    }}
                    className="shrink-0 p-0.5"
                    style={{
                      color: session.is_favorite
                        ? "#FBBF24"
                        : "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Star
                      className={cn(
                        "w-3.5 h-3.5",
                        session.is_favorite && "fill-current",
                      )}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editValue.trim()) {
                              onRenameSession(session.id, editValue.trim());
                              setEditingId(null);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 text-xs px-1.5 bg-transparent border-white/10"
                          style={{ color: T.text }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editValue.trim())
                              onRenameSession(session.id, editValue.trim());
                            setEditingId(null);
                          }}
                          className="p-1"
                        >
                          <Check
                            className="w-3 h-3"
                            style={{ color: T.accent }}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-1"
                        >
                          <X
                            className="w-3 h-3"
                            style={{ color: T.textSecondary }}
                          />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p
                          className="text-sm truncate"
                          style={{
                            color:
                              currentSessionId === session.id
                                ? T.text
                                : T.textSecondary,
                          }}
                        >
                          {session.title}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          {formatDistanceToNow(new Date(session.updated_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </>
                    )}
                  </div>
                  {editingId !== session.id && (
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(session.id);
                          setEditValue(session.title);
                        }}
                        className="p-1 rounded hover:bg-white/10"
                      >
                        <Pencil
                          className="w-3 h-3"
                          style={{ color: T.textSecondary }}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20"
                      >
                        <Trash2
                          className="w-3 h-3"
                          style={{ color: T.textSecondary }}
                        />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "rgba(255,255,255,0.15)" }}
            />
            <p className="text-sm" style={{ color: T.textSecondary }}>
              No chats yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Main page ──
export default function ContentAssistant() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [chatPrefill, setChatPrefill] = useState<string | null>(null);
  const prefillConsumed = useRef(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [showStatusIndicator, setShowStatusIndicator] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [toolStatuses, setToolStatuses] = useState<
    Map<
      string,
      {
        tool: string;
        status: "searching" | "processing" | "done";
        timestamp: number;
      }
    >
  >(new Map());

  const abortRef = useRef<AbortController | null>(null);
  const lastSessionRef = useRef<string | null>(null);
  const hasReceivedDelta = useRef(false);
  const bufferRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const streamingMsgRef = useRef<HTMLDivElement>(null);

  const skipDbSyncUntil = useRef(0);
  const lastSendTime = useRef(0);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle prefill from navigation state (e.g. Expansion Radar "View Strategy")
  useEffect(() => {
    const prefill = (location.state as { prefill?: string } | null)?.prefill;
    if (prefill && !prefillConsumed.current) {
      prefillConsumed.current = true;
      setChatPrefill(prefill);
      // Clear navigation state so refresh doesn't re-fill
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 100;
      userScrolledUp.current =
        el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  const scrollToLatestUserMessage = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const userMsgs = el.querySelectorAll('[data-role="user"]');
    const last = userMsgs[userMsgs.length - 1] as HTMLElement | undefined;
    if (last) {
      el.scrollTo({ top: last.offsetTop - 80, behavior: "smooth" });
    }
  }, []);

  const {
    sessions,
    currentSessionId,
    messages: dbMessages,
    userId,
    createSession,
    deleteSession,
    selectSession,
    addMessage,
    toggleFavorite,
    updateSessionTitle,
    isLoading: isHistoryLoading,
  } = useChatSessionsContext();

  const { checkRateLimit, validateInput } = useRateLimit();

  useEffect(() => {
    if (userId && sessions.length === 0 && !currentSessionId)
      createSession("New Chat");
  }, [userId, sessions.length, currentSessionId, createSession]);

  useEffect(() => {
    if (currentSessionId !== lastSessionRef.current) {
      lastSessionRef.current = currentSessionId;
      setMessages([]);
    }
    // Don't overwrite local messages while streaming or within 3s of sending
    if (isStreaming) return;
    if (Date.now() - lastSendTime.current < 3000) return;
    if (Date.now() < skipDbSyncUntil.current) return;
    if (!dbMessages || dbMessages.length === 0) return;
    setMessages(
      dbMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content:
          m.role === "assistant"
            ? m.content
                .replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, "")
                .trim() || m.content
            : m.content,
        timestamp: new Date(m.created_at),
      })),
    );
  }, [currentSessionId, dbMessages, isStreaming]);

  const handleNewChat = useCallback(async () => {
    if (messages.length === 0) return;
    await createSession("New Chat");
  }, [createSession, messages.length]);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text || isStreaming) return;
      if (!currentSessionId) {
        toast.error("Session not ready");
        return;
      }
      const validated = validateInput(text);
      if (!validated) return;
      if (!checkRateLimit()) return;

      lastSendTime.current = Date.now();
      hasReceivedDelta.current = false;
      abortRef.current = new AbortController();
      setToolStatuses(new Map());
      setStreamError(null);

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: validated,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      userScrolledUp.current = false;
      setTimeout(() => scrollToLatestUserMessage(), 100);
      setIsStreaming(true);
      setShowStatusIndicator(true);
      setShowFollowUps(false);

      await addMessage(currentSessionId, "user", validated);

      try {
        const callbacks: StreamCallbacks = {
          onDelta: (chunk) => {
            if (!hasReceivedDelta.current) {
              hasReceivedDelta.current = true;
              setShowStatusIndicator(false);
              setMessages((prev) => [
                ...prev,
                {
                  id: `a-${Date.now()}`,
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                },
              ]);
            }
            bufferRef.current += chunk;
            if (rafRef.current === null) {
              rafRef.current = requestAnimationFrame(() => {
                const text = bufferRef.current;
                bufferRef.current = "";
                rafRef.current = null;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + text,
                  };
                  return updated;
                });
                const el = scrollContainerRef.current;
                const msgEl = streamingMsgRef.current;
                if (el && msgEl && !userScrolledUp.current) {
                  const msgBottom = msgEl.getBoundingClientRect().bottom;
                  const containerBottom = el.getBoundingClientRect().bottom;
                  if (msgBottom > containerBottom + 40) {
                    el.scrollBy({
                      top: msgBottom - containerBottom + 40,
                      behavior: "instant",
                    });
                  }
                }
              });
            }
          },
          onStatus: (tool, status) => {
            setToolStatuses((prev) => {
              const next = new Map(prev);
              next.set(tool, {
                tool,
                status: status as "searching" | "processing" | "done",
                timestamp: Date.now(),
              });
              return next;
            });
          },
          onDone: () => {
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            const remaining = bufferRef.current;
            bufferRef.current = "";
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const raw = last.content + remaining;
              const clean =
                raw
                  .replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, "")
                  .trim() || raw;
              updated[updated.length - 1] = { ...last, content: clean };
              return updated;
            });
            setIsStreaming(false);
            setShowStatusIndicator(false);
            setShowFollowUps(true);
            setToolStatuses(new Map());
          },
          onError: (errorMsg) => {
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            bufferRef.current = "";
            setStreamError(errorMsg);
            setIsStreaming(false);
            setShowStatusIndicator(false);
          },
        };

        const fullText = await streamChatMessage(
          { message: validated, session_id: currentSessionId },
          callbacks,
          abortRef.current.signal,
        );

        if (abortRef.current?.signal.aborted) return;

        abortRef.current = null;
        skipDbSyncUntil.current = Date.now() + 2000;
        await addMessage(currentSessionId, "assistant", fullText || "");
      } catch (err) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const remaining = bufferRef.current;
        bufferRef.current = "";
        if (remaining) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + remaining,
            };
            return updated;
          });
        }
        if (abortRef.current?.signal.aborted) return;
        const errMsg =
          err instanceof Error ? err.message : "Something went wrong.";
        setStreamError(errMsg);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant" && !last.content) {
            updated[updated.length - 1] = { ...last, content: errMsg };
          } else {
            updated.push({
              id: `e-${Date.now()}`,
              role: "assistant",
              content: errMsg,
              timestamp: new Date(),
            });
          }
          return updated;
        });
        setIsStreaming(false);
        setShowStatusIndicator(false);
        abortRef.current = null;
      }
    },
    [isStreaming, currentSessionId, validateInput, checkRateLimit, addMessage],
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const remaining = bufferRef.current;
    bufferRef.current = "";
    if (remaining) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...last,
          content: last.content + remaining,
        };
        return updated;
      });
    }
    setIsStreaming(false);
    setShowStatusIndicator(false);
    setStreamError(null);
  }, []);

  const handleSelectSession = useCallback(
    (id: string) => {
      selectSession(id);
      setMobileSheetOpen(false);
    },
    [selectSession],
  );

  const confirmDelete = useCallback(async () => {
    if (deleteConfirmId) {
      await deleteSession(deleteConfirmId);
      toast.success("Chat deleted");
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteSession]);

  const handleClearFollowUps = useCallback(() => setShowFollowUps(false), []);

  const sidebarProps = {
    sessions: sessions as ChatSession[],
    currentSessionId,
    onSelectSession: handleSelectSession,
    onNewChat: handleNewChat,
    onDeleteSession: (id: string) => setDeleteConfirmId(id),
    onToggleFavorite: toggleFavorite,
    onRenameSession: updateSessionTitle,
    isCurrentSessionEmpty: messages.length === 0,
  };

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div
      className="h-dvh flex font-['Inter',system-ui,sans-serif]"
      style={{
        backgroundColor: T.bg,
        color: T.text,
        overscrollBehavior: "contain",
      }}
    >
      <SEOHead
        title="Chat - Wavebound"
        description="AI-powered content strategy assistant for musicians."
      />

      {!isMobile && (
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 overflow-hidden h-full relative"
            >
              <SidebarContent {...sidebarProps} />
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <div
          className="flex items-center gap-2 px-4 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          {isMobile ? (
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/5"
                >
                  <PanelLeft
                    className="w-4 h-4"
                    style={{ color: T.textSecondary }}
                  />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="p-0 w-[300px] border-0 backdrop-blur-xl"
                style={{ backgroundColor: "#0E0E0E" }}
              >
                <SheetTitle className="sr-only">Conversations</SheetTitle>
                <SidebarContent {...sidebarProps} />
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((p) => !p)}
              className="h-8 w-8 hover:bg-white/5"
            >
              {sidebarOpen ? (
                <PanelLeftClose
                  className="w-4 h-4"
                  style={{ color: T.textSecondary }}
                />
              ) : (
                <PanelLeft
                  className="w-4 h-4"
                  style={{ color: T.textSecondary }}
                />
              )}
            </Button>
          )}
          <span
            className="text-sm font-medium truncate"
            style={{ color: T.text }}
          >
            {sessions.find((s) => s.id === currentSessionId)?.title ||
              "New Chat"}
          </span>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0 chat-scrollbar"
        >
          <div className="max-w-3xl mx-auto w-full px-4 py-6 pb-4">
            {!hasMessages && !isHistoryLoading && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-3xl animate-ambient-glow pointer-events-none" />
                <AudioWaveform
                  className="w-10 h-10"
                  style={{ color: T.accent }}
                />
                <p className="text-sm" style={{ color: T.textSecondary }}>
                  Your AI music strategist
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(s.prompt)}
                      className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 border hover:border-purple-500/30 cursor-pointer"
                      style={{
                        backgroundColor: "#141414",
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#1E1E1E";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#141414";
                      }}
                    >
                      <s.icon
                        className="w-5 h-5 mt-0.5 shrink-0"
                        style={{ color: T.accent }}
                      />
                      <div className="min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{ color: T.text }}
                        >
                          {s.title}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: T.textSecondary }}
                        >
                          {s.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              showStatusIndicator={showStatusIndicator}
              toolStatuses={toolStatuses}
              streamError={streamError}
              streamingRef={streamingMsgRef}
              onFollowUpSubmit={handleSubmit}
              onRetry={() => {
                const lastUserMsg = [...messages]
                  .reverse()
                  .find((m) => m.role === "user");
                if (lastUserMsg) {
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant" && !last.content)
                      return prev.slice(0, -1);
                    return prev;
                  });
                  setStreamError(null);
                  handleSubmit(lastUserMsg.content);
                }
              }}
            />
            {/* Spacer so scrollTo can position any message at the top */}
            <div style={{ minHeight: "calc(100dvh - 300px)" }} />
          </div>
        </div>

        <ChatInput
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isStreaming}
          prefill={chatPrefill}
        />
      </div>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent
          style={{
            backgroundColor: T.surface,
            borderColor: T.border,
            color: T.text,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.text }}>
              Delete this chat?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.textSecondary }}>
              This will permanently delete this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="hover:bg-white/5"
              style={{ color: T.textSecondary, borderColor: T.border }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

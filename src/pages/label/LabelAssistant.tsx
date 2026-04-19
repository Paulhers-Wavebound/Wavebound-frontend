import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Plus,
  Trash2,
  Star,
  Pencil,
  Check,
  PanelLeftClose,
  PanelLeft,
  Brain,
  BarChart3,
  Music,
  TrendingUp,
  Target,
  Users,
  MessageSquare,
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
import { useChatSessions } from "@/hooks/useChatSessions";
import {
  streamChatMessage,
  type StreamCallbacks,
} from "@/services/chatJobService";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useStickToBottom } from "use-stick-to-bottom";
import {
  isToday,
  isYesterday,
  subDays,
  isAfter,
  formatDistanceToNow,
} from "date-fns";
import { useLocation } from "react-router-dom";
import ChatInput, {
  type PendingImage,
  validateImageFile,
  fileToBase64,
} from "@/components/chat/ChatInput";
import MessageList from "@/components/chat/MessageList";

// ── Theme tokens — one tier brighter than portal base ──
const T = {
  bg: "var(--surface, #1e1e1c)",
  surface: "var(--surface-hover, #2a2a27)",
  elevated: "#323230",
  border: "rgba(255,255,255,0.06)",
  text: "var(--ink)",
  textSecondary: "var(--ink-secondary)",
  textTertiary: "var(--ink-tertiary)",
  accent: "var(--accent)",
} as const;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

function groupSessions(sessions: ChatSession[]) {
  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  for (const s of sessions) {
    const d = new Date(s.updated_at || s.created_at);
    if (isToday(d)) groups[0].items.push(s);
    else if (isYesterday(d)) groups[1].items.push(s);
    else if (isAfter(d, sevenDaysAgo)) groups[2].items.push(s);
    else groups[3].items.push(s);
  }
  return groups.filter((g) => g.items.length > 0);
}

function relativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

const SUGGESTIONS = [
  { icon: BarChart3, text: "Give me a roster health check" },
  { icon: TrendingUp, text: "Which artists are trending up this week?" },
  { icon: Target, text: "What viral formats should we be using?" },
  { icon: Users, text: "Who needs attention on the roster?" },
  { icon: Music, text: "What sounds are blowing up right now?" },
  { icon: Brain, text: "Compare our top 3 artists' engagement" },
];

export default function LabelAssistant() {
  const { labelId } = useUserProfile();
  const {
    sessions,
    currentSessionId,
    messages: dbMessages,
    createSession,
    selectSession,
    deleteSession,
    addMessage,
    updateSessionTitle,
    toggleFavorite,
  } = useChatSessions("label", labelId);

  const location = useLocation();
  const isMobile = useIsMobile();
  const { checkRateLimit } = useRateLimit();

  const navState = location.state as {
    prefill?: string;
    assistantPrefill?: string;
    newSession?: boolean;
  } | null;
  const prefillText = navState?.prefill || null;
  const assistantPrefillText = navState?.assistantPrefill || null;
  const forceNewSession = navState?.newSession ?? false;
  const prefillFired = useRef(false);

  // If arriving with an assistant prefill, show it immediately as a message.
  // Initialize in state so it renders on the very first paint — no async race.
  const [prefillMsg] = useState<Message | null>(() => {
    if (!assistantPrefillText) return null;
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantPrefillText,
      timestamp: new Date(),
    };
  });
  const [messages, setMessages] = useState<Message[]>(
    prefillMsg ? [prefillMsg] : [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("wavebound_chat_sb_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      return parseInt(localStorage.getItem("wavebound_chat_sb_w") || "200");
    } catch {
      return 200;
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
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
  const [showStatusIndicator, setShowStatusIndicator] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [messageSourcesMap, setMessageSourcesMap] = useState<
    Map<string, string[]>
  >(new Map());
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeRole, setActiveRole] = useState<
    "ar" | "marketing" | "executive"
  >(() => {
    try {
      const saved = localStorage.getItem("wavebound_label_chat_role");
      if (saved === "ar" || saved === "marketing" || saved === "executive")
        return saved;
    } catch {}
    return "executive";
  });

  const abortRef = useRef<AbortController | null>(null);
  const streamingMsgRef = useRef<string>("");
  const skipDbSyncUntil = useRef<number>(prefillMsg ? Date.now() + 15000 : 0);
  const currentToolsRef = useRef<string[]>([]);
  const dragStartRef = useRef<{ x: number; w: number } | null>(null);
  const dragCounterRef = useRef(0);

  // ── Sidebar collapse toggle ──
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("wavebound_chat_sb_collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  // ── Role switcher ──
  const handleRoleChange = useCallback(
    (newRole: "ar" | "marketing" | "executive") => {
      setActiveRole(newRole);
      try {
        localStorage.setItem("wavebound_label_chat_role", newRole);
      } catch {}
    },
    [],
  );

  // ── Sidebar drag resize ──
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartRef.current = { x: e.clientX, w: sidebarWidth };
      const onMove = (ev: MouseEvent) => {
        if (!dragStartRef.current) return;
        const newW = Math.max(
          160,
          Math.min(
            360,
            dragStartRef.current.w + (ev.clientX - dragStartRef.current.x),
          ),
        );
        setSidebarWidth(newW);
      };
      const onUp = (ev: MouseEvent) => {
        if (dragStartRef.current) {
          const finalW = Math.max(
            160,
            Math.min(
              360,
              dragStartRef.current.w + (ev.clientX - dragStartRef.current.x),
            ),
          );
          try {
            localStorage.setItem("wavebound_chat_sb_w", String(finalW));
          } catch {}
        }
        dragStartRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [sidebarWidth],
  );

  // use-stick-to-bottom for auto-scroll
  const { scrollRef, contentRef } = useStickToBottom({
    resize: "smooth",
    initial: "instant",
  });

  // ── Source tag persistence via localStorage ──
  const SOURCES_KEY = "wavebound_label_sources";

  const loadSourcesFromStorage = useCallback((sessionId: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem(SOURCES_KEY) || "{}");
      const data = stored[sessionId];
      if (data && typeof data === "object") {
        setMessageSourcesMap(new Map(Object.entries(data)));
      } else {
        setMessageSourcesMap(new Map());
      }
    } catch {
      setMessageSourcesMap(new Map());
    }
  }, []);

  const saveSourcesToStorage = useCallback(
    (sessionId: string, sources: Map<string, string[]>) => {
      if (sources.size === 0) return;
      try {
        const stored = JSON.parse(localStorage.getItem(SOURCES_KEY) || "{}");
        stored[sessionId] = Object.fromEntries(sources);
        // Prune to last 50 sessions to prevent unbounded localStorage growth
        const keys = Object.keys(stored);
        if (keys.length > 50) {
          const toRemove = keys.slice(0, keys.length - 50);
          for (const k of toRemove) delete stored[k];
        }
        localStorage.setItem(SOURCES_KEY, JSON.stringify(stored));
      } catch {
        /* ignore quota errors */
      }
    },
    [],
  );

  // Sync DB messages → local state + load persisted sources
  useEffect(() => {
    if (Date.now() < skipDbSyncUntil.current) return;
    if (!dbMessages?.length) {
      setMessages([]);
      return;
    }
    setMessages(
      dbMessages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      })),
    );
    // Load persisted source tags for this session
    if (currentSessionId) loadSourcesFromStorage(currentSessionId);
  }, [dbMessages, currentSessionId, loadSourcesFromStorage]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      if (!checkRateLimit()) {
        toast.error("Slow down — max 30 messages per minute.");
        return;
      }

      let sid = currentSessionId;
      if (!sid) {
        sid = await createSession();
        if (!sid) return;
      }

      skipDbSyncUntil.current = Date.now() + 3000;

      // Auto-title is handled inside useChatSessions.addMessage — no duplicate here

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
        image: pendingImage ? pendingImage.preview : undefined,
      };
      setMessages((prev) => [...prev, userMsg]);
      addMessage(sid!, "user", trimmed);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      setIsStreaming(true);
      setShowStatusIndicator(true);
      setToolStatuses(new Map());
      setStreamError(null);
      streamingMsgRef.current = "";
      currentToolsRef.current = [];

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const callbacks: StreamCallbacks = {
          onStatus: (tool, status) => {
            // Track tools used for source citations
            if (tool && !currentToolsRef.current.includes(tool)) {
              currentToolsRef.current.push(tool);
            }
            setToolStatuses((prev) => {
              const next = new Map(prev);
              if (status === "done") {
                const existing = next.get(tool);
                if (existing) next.set(tool, { ...existing, status: "done" });
              } else {
                next.set(tool, {
                  tool,
                  status: status as "searching" | "processing" | "done",
                  timestamp: Date.now(),
                });
              }
              return next;
            });
          },
          onDelta: (chunk) => {
            streamingMsgRef.current += chunk;
            setShowStatusIndicator(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: streamingMsgRef.current }
                  : m,
              ),
            );
          },
          onError: (err) => {
            setStreamError(err);
            toast.error(err);
          },
          onDone: () => {
            // Capture source tags before clearing tool statuses
            if (currentToolsRef.current.length > 0) {
              setMessageSourcesMap((prev) => {
                const next = new Map(prev);
                next.set(assistantId, [...currentToolsRef.current]);
                // Persist to localStorage
                if (sid) saveSourcesToStorage(sid, next);
                return next;
              });
            }
            setToolStatuses(new Map());
            setShowStatusIndicator(false);
          },
        };

        await streamChatMessage(
          {
            message: trimmed,
            session_id: sid!,
            role: activeRole,
            ...(pendingImage
              ? {
                  image: {
                    data: pendingImage.data,
                    media_type: pendingImage.media_type,
                  },
                }
              : {}),
          },
          callbacks,
          controller.signal,
          "label-chat",
        );

        if (streamingMsgRef.current) {
          addMessage(sid!, "assistant", streamingMsgRef.current);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        const msg = err.message?.includes("429")
          ? "Rate limit reached. Wait a moment."
          : err.message?.includes("401")
            ? "Session expired. Please refresh."
            : "Something went wrong. Try again.";
        toast.error(msg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        setPendingImage(null);
        abortRef.current = null;
      }
    },
    [
      isStreaming,
      currentSessionId,
      createSession,
      addMessage,
      checkRateLimit,
      activeRole,
      pendingImage,
    ],
  );

  const handleNewChat = useCallback(async () => {
    if (isStreaming) {
      abortRef.current?.abort();
      setIsStreaming(false);
    }
    setMessages([]);
    setMessageSourcesMap(new Map());
    await createSession();
  }, [isStreaming, createSession]);

  // ── Abort stream on unmount — prevents leaked API calls + memory ──
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Auto-send prefilled message from navigation state ──
  useEffect(() => {
    if (prefillText && !prefillFired.current && !isStreaming) {
      prefillFired.current = true;

      if (forceNewSession) {
        // Start a clean session before sending
        setMessages([]);
        setMessageSourcesMap(new Map());
        createSession().then(() => {
          setTimeout(() => handleSend(prefillText), 300);
        });
      } else {
        const timer = setTimeout(() => handleSend(prefillText), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [prefillText, forceNewSession, isStreaming, handleSend, createSession]);

  // ── Persist assistant-prefill to a new session (message already in state via useState init) ──
  useEffect(() => {
    if (!prefillMsg || prefillFired.current) return;
    prefillFired.current = true;

    // Delay session creation so the hook's loadSessions completes first
    // and doesn't overwrite currentSessionId afterward.
    const timer = setTimeout(async () => {
      skipDbSyncUntil.current = Date.now() + 10000;
      setMessageSourcesMap(new Map());
      const sid = await createSession();
      if (!sid) return;

      // Re-assert the message after createSession set messages to []
      setMessages(() => [prefillMsg]);
      addMessage(sid, "assistant", prefillMsg.content);
    }, 1200);

    return () => clearTimeout(timer);
  }, [prefillMsg, createSession, addMessage]);

  // ── Keyboard shortcut: Cmd/Ctrl+Shift+O → new conversation ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === "o" || e.key === "O")
      ) {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNewChat]);

  const handleSelectSession = useCallback(
    (id: string) => {
      if (id === currentSessionId) return;
      loadSourcesFromStorage(id);
      selectSession(id);
      if (isMobile) setMobileSheetOpen(false);
    },
    [currentSessionId, selectSession, isMobile],
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      setDeleteTarget(null);
    },
    [deleteSession],
  );

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId),
    [sessions, currentSessionId],
  );

  const sortedSessions = useMemo(() => {
    const favs = sessions.filter((s) => s.is_favorite);
    const rest = sessions.filter((s) => !s.is_favorite);
    return [...favs, ...rest];
  }, [sessions]);

  const grouped = useMemo(
    () => groupSessions(sortedSessions),
    [sortedSessions],
  );

  // ── Sidebar content (shared between desktop & mobile sheet) ──
  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: T.surface }}>
      <div className="p-3 border-b" style={{ borderColor: T.border }}>
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 text-sm"
          variant="ghost"
          style={{ color: T.text }}
        >
          <MessageSquare className="w-4 h-4" />
          New conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {grouped.map((group) => (
          <div key={group.label}>
            <p
              className="text-[11px] font-medium uppercase tracking-wider px-2 py-1"
              style={{ color: T.textTertiary }}
            >
              {group.label}
            </p>
            {group.items.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors",
                  s.id === currentSessionId
                    ? "bg-white/[0.07]"
                    : "hover:bg-white/[0.04]",
                )}
              >
                {s.is_favorite && (
                  <Star className="w-3 h-3 shrink-0 fill-yellow-400 text-yellow-400" />
                )}
                {editingId === s.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-6 text-xs bg-transparent border-none px-0"
                      style={{ color: T.text }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateSessionTitle(s.id, editTitle);
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Check
                      className="w-3 h-3 shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSessionTitle(s.id, editTitle);
                        setEditingId(null);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <span
                      className="block truncate text-[13px]"
                      style={{
                        color:
                          s.id === currentSessionId ? T.text : T.textSecondary,
                      }}
                    >
                      {s.title || "New conversation"}
                    </span>
                    <span
                      className="block text-[11px] mt-0.5"
                      style={{ color: T.textTertiary }}
                    >
                      {relativeTime(s.updated_at || s.created_at)}
                    </span>
                  </div>
                )}
                {editingId !== s.id && (
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(s.id);
                      }}
                      className="p-0.5 rounded hover:bg-white/10"
                    >
                      <Star
                        className={cn(
                          "w-3 h-3",
                          s.is_favorite
                            ? "fill-yellow-400 text-yellow-400"
                            : "",
                        )}
                        style={{
                          color: s.is_favorite ? undefined : T.textTertiary,
                        }}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTitle(s.title || "");
                        setEditingId(s.id);
                      }}
                      className="p-0.5 rounded hover:bg-white/10"
                    >
                      <Pencil
                        className="w-3 h-3"
                        style={{ color: T.textTertiary }}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(s.id);
                      }}
                      className="p-0.5 rounded hover:bg-white/10 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Welcome / empty state ──
  const emptyState = (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(232,67,10,0.12)" }}
          >
            <Brain className="w-7 h-7" style={{ color: T.accent }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: T.text }}>
            Label Intelligence
          </h2>
          <p className="text-sm" style={{ color: T.textSecondary }}>
            Ask anything about your roster, trends, sounds, or strategy.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              onClick={() => handleSend(s.text)}
              className="flex items-center gap-3 text-left rounded-xl px-4 py-3 text-sm transition-all duration-150 hover:border-white/15"
              style={{
                background: T.elevated,
                color: T.textSecondary,
                border: `1px solid ${T.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.87)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.textSecondary;
              }}
            >
              <s.icon
                className="w-4 h-4 shrink-0"
                style={{ color: T.accent }}
              />
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn("flex", isMobile ? "h-[calc(100dvh-48px)]" : "h-full")}
        style={{ background: T.bg }}
      >
        {/* Desktop sidebar — collapsed icon strip or expanded panel */}
        {!isMobile && sidebarCollapsed && (
          <div
            className="shrink-0 flex flex-col items-center py-3 gap-1.5"
            style={{
              width: 48,
              background: T.surface,
              borderRight: `1px solid ${T.border}`,
            }}
          >
            <button
              onClick={toggleSidebarCollapsed}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft
                className="w-4 h-4"
                style={{ color: T.textSecondary }}
              />
            </button>
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4" style={{ color: T.textSecondary }} />
            </button>
          </div>
        )}
        {!isMobile && !sidebarCollapsed && (
          <div
            className="shrink-0 border-r flex flex-col relative"
            style={{
              width: sidebarWidth,
              borderColor: T.border,
              background: T.surface,
            }}
          >
            {sidebarContent}
            {/* Drag handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-white/10 active:bg-white/15 transition-colors z-10"
              onMouseDown={handleDragStart}
            />
          </div>
        )}

        {/* Main chat area */}
        <div
          className="flex-1 flex flex-col min-w-0 relative"
          onDragEnter={(e) => {
            e.preventDefault();
            dragCounterRef.current++;
            setIsDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDragLeave={() => {
            dragCounterRef.current--;
            if (dragCounterRef.current <= 0) {
              dragCounterRef.current = 0;
              setIsDragOver(false);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            dragCounterRef.current = 0;
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) {
              toast.error(
                "Only images can be dropped here (PNG, JPEG, WebP, GIF).",
              );
              return;
            }
            const error = validateImageFile(file);
            if (error) {
              toast.error(error);
              return;
            }
            const img = await fileToBase64(file);
            setPendingImage(img);
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 h-12 shrink-0 border-b"
            style={{ borderColor: T.border, background: T.surface }}
          >
            {isMobile ? (
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <PanelLeft
                      className="w-5 h-5"
                      style={{ color: T.textSecondary }}
                    />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <SheetTitle className="sr-only">Chat History</SheetTitle>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={toggleSidebarCollapsed}
              >
                {sidebarCollapsed ? (
                  <PanelLeft
                    className="w-5 h-5"
                    style={{ color: T.textSecondary }}
                  />
                ) : (
                  <PanelLeftClose
                    className="w-5 h-5"
                    style={{ color: T.textSecondary }}
                  />
                )}
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1
                className="text-sm font-medium truncate"
                style={{ color: T.text }}
              >
                {currentSession?.title || "Label Intelligence"}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleNewChat}
            >
              <Plus className="w-5 h-5" style={{ color: T.textSecondary }} />
            </Button>
          </div>

          {/* Messages or empty state */}
          {messages.length === 0 && !isStreaming ? (
            emptyState
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div ref={contentRef} className="max-w-3xl mx-auto px-4 py-6">
                <MessageList
                  messages={messages}
                  isStreaming={isStreaming}
                  showStatusIndicator={showStatusIndicator}
                  toolStatuses={toolStatuses}
                  streamError={streamError}
                  messageSourcesMap={messageSourcesMap}
                  onFollowUpSubmit={handleSend}
                />
              </div>
            </div>
          )}

          {/* Input */}
          <ChatInput
            onSubmit={handleSend}
            onCancel={() => {
              abortRef.current?.abort();
              setIsStreaming(false);
            }}
            isLoading={isStreaming}
            placeholder="Ask about your roster, artists, trends, or strategy..."
            pendingImage={pendingImage}
            onImageAttach={setPendingImage}
            onImageRemove={() => setPendingImage(null)}
            activeRole={activeRole}
            onRoleChange={handleRoleChange}
          />

          {/* Drag-and-drop overlay */}
          {isDragOver && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg border-2 border-dashed pointer-events-none"
              style={{ borderColor: T.accent }}
            >
              <p className="text-sm font-medium" style={{ color: T.accent }}>
                Drop image here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its
              messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteSession(deleteTarget)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnrichedIdea } from "./useIdeaExtraction";
import { generateChatTitle } from "@/utils/chatTitleGenerator";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface StoredIdea {
  id: string;
  session_id: string;
  idea_id: string;
  video_embed_id: string | null;
  title: string;
  why_it_works: string | null;
  content_type: string | null;
  video_data: any;
  created_at: string;
}

// ── Module-level caches — survive component unmounts for instant re-mount ──
const _msgCache = new Map<string, Map<string, ChatMessage[]>>();
const _sessCache = new Map<string, ChatSession[]>();

function getMsgCache(chatType: string): Map<string, ChatMessage[]> {
  if (!_msgCache.has(chatType)) _msgCache.set(chatType, new Map());
  return _msgCache.get(chatType)!;
}

export function useChatSessions(chatType: string = "artist") {
  const messageCache = getMsgCache(chatType);

  const [sessions, setSessions] = useState<ChatSession[]>(
    () => _sessCache.get(chatType) ?? [],
  );
  const STORAGE_KEY =
    chatType === "artist"
      ? "wavebound_chat_current_session_id"
      : "wavebound_label_chat_current_session_id";
  const [currentSessionId, setCurrentSessionIdRaw] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
  );

  const setCurrentSessionId = useCallback((id: string | null) => {
    setCurrentSessionIdRaw(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Hydrate messages from module cache on mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const sid = localStorage.getItem(STORAGE_KEY);
      return sid ? (messageCache.get(sid) ?? []) : [];
    } catch {
      return [];
    }
  });
  const lastAddMessageTime = useRef(0);
  const [sessionIdeas, setSessionIdeas] = useState<EnrichedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDraftSession, setIsDraftSession] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setIsAuthLoading(false);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load sessions when user changes
  useEffect(() => {
    if (userId) {
      loadSessions();
    } else {
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      setSessionIdeas([]);
    }
  }, [userId]);

  // Load messages and ideas when session changes
  useEffect(() => {
    if (currentSessionId) {
      // Instant cache hit — set messages immediately
      const cached = messageCache.get(currentSessionId);
      if (cached) {
        setMessages(cached);
        setIsLoading(false);
        // Background refresh (don't block UI)
        loadMessagesBackground(currentSessionId);
      } else {
        loadMessages(currentSessionId);
      }
      loadSessionIdeas(currentSessionId);
    } else {
      setMessages([]);
      setSessionIdeas([]);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("chat_type", chatType)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      const mapped = data.map((s) => ({
        ...s,
        is_favorite: (s as any).is_favorite ?? false,
      }));
      setSessions(mapped);
      _sessCache.set(chatType, mapped);
      if (currentSessionId) {
        const exists = data.some((s) => s.id === currentSessionId);
        if (!exists) {
          if (data.length > 0) {
            setCurrentSessionId(data[0].id);
          } else {
            setCurrentSessionId(null);
          }
        }
      } else if (data.length > 0) {
        setCurrentSessionId(data[0].id);
      }
    }
  };

  const loadMessages = async (sessionId: string) => {
    setIsLoading(true);
    const msgs = await fetchMessages(sessionId);
    if (msgs) {
      setMessages(msgs);
      messageCache.set(sessionId, msgs);
    }
    setIsLoading(false);
  };

  // Background refresh — doesn't show loading state, silently updates
  const loadMessagesBackground = async (sessionId: string) => {
    if (Date.now() - lastAddMessageTime.current < 5000) return;
    const msgs = await fetchMessages(sessionId);
    if (msgs) {
      messageCache.set(sessionId, msgs);
      // Only update if still on the same session
      setCurrentSessionIdRaw((current) => {
        if (current === sessionId) {
          setMessages(msgs);
        }
        return current;
      });
    }
  };

  // Shared fetch logic
  const fetchMessages = async (
    sessionId: string,
  ): Promise<ChatMessage[] | null> => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "[useChatSessions.loadMessages] Failed to load chat_messages:",
        error,
      );
      return null;
    }

    const baseMessages = (data as ChatMessage[]) || [];
    const hasAssistant = baseMessages.some((m) => m.role === "assistant");

    if (!hasAssistant) {
      const { data: n8nRows, error: n8nError } = await supabase
        .from("n8n_chat_histories")
        .select("id, message")
        .eq("session_id", sessionId)
        .order("id", { ascending: true });

      if (n8nError) {
        console.warn(
          "[useChatSessions.loadMessages] Failed to load n8n_chat_histories fallback:",
          n8nError,
        );
        return baseMessages;
      }

      const baseTime = baseMessages[0]?.created_at
        ? new Date(baseMessages[0].created_at).getTime()
        : Date.now();

      const fallbackAssistantMessages: ChatMessage[] = (n8nRows || [])
        .map((row: any, idx: number) => {
          const content = row?.message?.content;
          if (typeof content !== "string" || !content.trim()) return null;
          return {
            id: `n8n_${row.id}`,
            session_id: sessionId,
            role: "assistant" as const,
            content,
            created_at: new Date(baseTime + (idx + 1) * 5).toISOString(),
          };
        })
        .filter(Boolean) as ChatMessage[];

      return [...baseMessages, ...fallbackAssistantMessages];
    }

    return baseMessages;
  };

  const loadSessionIdeas = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("session_ideas")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error || !data) return;

    const ideas: EnrichedIdea[] = data.map((item: StoredIdea) => ({
      id: item.idea_id,
      video_embed_id: item.video_embed_id || undefined,
      title: item.title,
      why_it_works: item.why_it_works || "",
      contentType: item.content_type as EnrichedIdea["contentType"],
      videoData: item.video_data || undefined,
      isLoading: false,
    }));

    const needsEnrichment = ideas.filter((i) => {
      const vd = i.videoData as any;
      return (
        !vd?.thumbnail_url &&
        !vd?.video_url &&
        !vd?.video_embedded_url &&
        !vd?.post_url
      );
    });

    if (needsEnrichment.length > 0) {
      const numericIds = needsEnrichment
        .map((i) =>
          parseInt(
            String(i.video_embed_id || i.id).replace(/^(video_|reel_|pc_)/, ""),
            10,
          ),
        )
        .filter((n) => !isNaN(n));

      const tiktokIds = numericIds.filter((id) =>
        needsEnrichment.find(
          (i) =>
            (i.contentType === "tiktok" || !i.contentType) &&
            parseInt(
              String(i.video_embed_id || i.id).replace(/\D/g, ""),
              10,
            ) === id,
        ),
      );
      const reelIds = numericIds.filter((id) =>
        needsEnrichment.find(
          (i) =>
            i.contentType === "reel" &&
            parseInt(
              String(i.video_embed_id || i.id).replace(/\D/g, ""),
              10,
            ) === id,
        ),
      );
      const pcIds = numericIds.filter((id) =>
        needsEnrichment.find(
          (i) =>
            i.contentType === "photo_carousel" &&
            parseInt(
              String(i.video_embed_id || i.id).replace(/\D/g, ""),
              10,
            ) === id,
        ),
      );

      const [
        tiktokVideos,
        tiktokAssets,
        reels,
        reelAssets,
        reelMedia,
        pcs,
        pcAssets,
      ] = await Promise.all([
        tiktokIds.length
          ? supabase
              .from("0.1. Table 2 - Video - TikTok")
              .select(
                "id, video_embedded_url, video_url, caption, video_views, video_likes, duration, viral_score, performance_multiplier",
              )
              .in("id", tiktokIds)
          : { data: [] },
        tiktokIds.length
          ? supabase
              .from("0.1. Table 4 - Assets - TikTok")
              .select("video_id, thumbnail_url")
              .in("video_id", tiktokIds)
          : { data: [] },
        reelIds.length
          ? supabase
              .from("0.1. Table 2.2 - Video - Reels")
              .select(
                "id, video_embedded_url, video_url, caption, video_views, video_likes, duration, viral_score, performance_multiplier",
              )
              .in("id", reelIds)
          : { data: [] },
        reelIds.length
          ? supabase
              .from("0.1. Table 4.2 - Assets - Reels")
              .select("video_id, thumbnail_url")
              .in("video_id", reelIds)
          : { data: [] },
        reelIds.length
          ? supabase
              .from("media_assets_instagram_reels")
              .select("video_id, url")
              .in("video_id", reelIds)
          : { data: [] },
        pcIds.length
          ? supabase
              .from("0.1. Table 2.1 - PC - TikTok")
              .select(
                "id, post_url, caption, photo_views, photo_likes, viral_score, performance_multiplier",
              )
              .in("id", pcIds)
          : { data: [] },
        pcIds.length
          ? supabase
              .from("0.1. Table 4.1 - Assets - PC - TikTok")
              .select("video_id, thumbnail_url")
              .in("video_id", pcIds)
          : { data: [] },
      ]);

      const tiktokMap = new Map<number, any>();
      ((tiktokVideos.data as any[]) || []).forEach((v) =>
        tiktokMap.set(v.id, v),
      );
      const tiktokThumb = new Map<number, string>();
      ((tiktokAssets.data as any[]) || []).forEach(
        (a) =>
          a.video_id &&
          a.thumbnail_url &&
          tiktokThumb.set(a.video_id, a.thumbnail_url),
      );

      const reelMap = new Map<number, any>();
      ((reels.data as any[]) || []).forEach((v) => reelMap.set(v.id, v));
      const reelThumb = new Map<number, string>();
      ((reelAssets.data as any[]) || []).forEach(
        (a) =>
          a.video_id &&
          a.thumbnail_url &&
          reelThumb.set(a.video_id, a.thumbnail_url),
      );
      const reelFile = new Map<number, string>();
      ((reelMedia.data as any[]) || []).forEach(
        (a) => a.video_id && a.url && reelFile.set(a.video_id, a.url),
      );

      const pcMap = new Map<number, any>();
      ((pcs.data as any[]) || []).forEach((v) => pcMap.set(v.id, v));
      const pcThumb = new Map<number, string>();
      ((pcAssets.data as any[]) || []).forEach(
        (a) =>
          a.video_id &&
          a.thumbnail_url &&
          pcThumb.set(a.video_id, a.thumbnail_url),
      );

      for (const idea of ideas) {
        const idNum = parseInt(
          String(idea.video_embed_id || idea.id).replace(/\D/g, ""),
          10,
        );
        if (isNaN(idNum)) continue;

        if (idea.contentType === "reel") {
          const r = reelMap.get(idNum);
          if (r) {
            idea.videoData = {
              ...(idea.videoData as any),
              video_embedded_url: r.video_embedded_url || undefined,
              video_url: r.video_url || undefined,
              video_file_url: r.video_url || reelFile.get(idNum) || undefined,
              caption: r.caption || undefined,
              video_views: r.video_views || undefined,
              video_likes: r.video_likes || undefined,
              duration: r.duration || undefined,
              thumbnail_url: reelThumb.get(idNum) || undefined,
              viral_score: r.viral_score || undefined,
              performance_multiplier: r.performance_multiplier || undefined,
            };
          }
        } else if (idea.contentType === "photo_carousel") {
          const pc = pcMap.get(idNum);
          if (pc) {
            idea.videoData = {
              ...(idea.videoData as any),
              post_url: pc.post_url || undefined,
              caption: pc.caption || undefined,
              photo_views: pc.photo_views || undefined,
              photo_likes: pc.photo_likes || undefined,
              thumbnail_url: pcThumb.get(idNum) || undefined,
              viral_score: pc.viral_score || undefined,
              performance_multiplier: pc.performance_multiplier || undefined,
            };
          }
        } else {
          const v = tiktokMap.get(idNum);
          if (v) {
            idea.contentType = idea.contentType || "tiktok";
            idea.videoData = {
              ...(idea.videoData as any),
              video_embedded_url: v.video_embedded_url || undefined,
              video_url: v.video_url || undefined,
              caption: v.caption || undefined,
              video_views: v.video_views || undefined,
              video_likes: v.video_likes || undefined,
              duration: v.duration || undefined,
              thumbnail_url: tiktokThumb.get(idNum) || undefined,
              viral_score: v.viral_score || undefined,
              performance_multiplier: v.performance_multiplier || undefined,
            };
          }
        }
      }
    }

    setSessionIdeas(ideas);
  };

  const createSession = useCallback(
    async (title?: string): Promise<string | null> => {
      if (!userId) return null;

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const optimistic: ChatSession = {
        id: newId,
        user_id: userId,
        title: title || "New Chat",
        created_at: now,
        updated_at: now,
        is_favorite: false,
      };

      // Instant UI update
      setSessions((prev) => [optimistic, ...prev]);
      setCurrentSessionId(newId);
      setMessages([]);
      setSessionIdeas([]);
      setIsDraftSession(false);
      messageCache.set(newId, []);

      // Await DB persist — must exist before addMessage inserts chat_messages rows
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          id: newId,
          user_id: userId,
          title: title || "New Chat",
          chat_type: chatType,
        } as any)
        .select()
        .single();

      if (error) {
        console.error(
          "[useChatSessions] Failed to persist session, rolling back:",
          error,
        );
        setSessions((prev) => prev.filter((s) => s.id !== newId));
        messageCache.delete(newId);
        return null;
      }
      if (data) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === newId
              ? { ...data, is_favorite: (data as any).is_favorite ?? false }
              : s,
          ),
        );
      }

      return newId;
    },
    [userId],
  );

  const persistDraftSession = useCallback(
    async (sessionId: string, title?: string): Promise<boolean> => {
      if (!userId || !isDraftSession) return true;

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          id: sessionId,
          user_id: userId,
          title: title || "New Chat",
          chat_type: chatType,
        } as any)
        .select()
        .single();

      if (!error && data) {
        setSessions((prev) => [
          { ...data, is_favorite: (data as any).is_favorite ?? false },
          ...prev,
        ]);
        setIsDraftSession(false);
        return true;
      }
      console.error(
        "[useChatSessions] Failed to persist draft session:",
        error,
      );
      return false;
    },
    [userId, isDraftSession],
  );

  const updateSessionTitle = useCallback(
    async (sessionId: string, title: string) => {
      // Optimistic local update first
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
      );
      // Background persist
      supabase.from("chat_sessions").update({ title }).eq("id", sessionId);
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (sessionId: string) => {
      // Optimistic update
      setSessions((prev) => {
        const session = prev.find((s) => s.id === sessionId);
        if (!session) return prev;
        const newValue = !session.is_favorite;
        return prev.map((s) =>
          s.id === sessionId ? { ...s, is_favorite: newValue } : s,
        );
      });
      // Background persist
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        supabase
          .from("chat_sessions")
          .update({ is_favorite: !session.is_favorite } as any)
          .eq("id", sessionId);
      }
    },
    [sessions],
  );

  const isFavorite = useCallback(
    (sessionId: string) => {
      return sessions.find((s) => s.id === sessionId)?.is_favorite ?? false;
    },
    [sessions],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      // Optimistic removal
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      messageCache.delete(sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
        setSessionIdeas([]);
      }
      // Background persist
      supabase.from("chat_sessions").delete().eq("id", sessionId);
    },
    [currentSessionId],
  );

  const addMessage = useCallback(
    async (
      sessionId: string,
      role: "user" | "assistant",
      content: string,
    ): Promise<ChatMessage | null> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({ session_id: sessionId, role, content })
        .select()
        .single();

      if (!error && data) {
        const message = data as ChatMessage;
        lastAddMessageTime.current = Date.now();

        // Only update cache — don't call setMessages to avoid triggering
        // re-renders in components that manage their own local state
        messageCache.set(sessionId, [
          ...(messageCache.get(sessionId) || []),
          message,
        ]);

        // Instant title generation from local state — no DB round-trip
        const newTimestamp = new Date().toISOString();
        if (role === "user") {
          setSessions((prev) => {
            const session = prev.find((s) => s.id === sessionId);
            const needsTitle = !session?.title || session.title === "New Chat";
            const title = needsTitle
              ? generateChatTitle(content)
              : session.title;
            const updated = prev.map((s) =>
              s.id === sessionId
                ? { ...s, title, updated_at: newTimestamp }
                : s,
            );
            // Background DB persist
            const updatePayload = needsTitle
              ? { title, updated_at: newTimestamp }
              : { updated_at: newTimestamp };
            supabase
              .from("chat_sessions")
              .update(updatePayload)
              .eq("id", sessionId);
            return updated.sort(
              (a, b) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime(),
            );
          });
        }

        return message;
      }
      console.error(
        "[useChatSessions.addMessage] Failed to save message:",
        error,
      );
      return null;
    },
    [],
  );

  const addIdea = useCallback(
    async (sessionId: string, idea: EnrichedIdea): Promise<boolean> => {
      if (!userId) return false;

      const { error } = await supabase.from("session_ideas").insert({
        session_id: sessionId,
        idea_id: idea.id,
        video_embed_id: idea.video_embed_id || null,
        title: idea.title,
        why_it_works: idea.why_it_works || null,
        content_type: idea.contentType || null,
        video_data: idea.videoData || null,
      });

      if (error) {
        console.error("[useChatSessions.addIdea] Failed to insert idea", {
          sessionId,
          ideaId: idea.id,
          error,
        });
        return false;
      }

      setSessionIdeas((prev) => [...prev, idea]);
      return true;
    },
    [userId],
  );

  const removeIdea = useCallback(
    async (sessionId: string, ideaId: string): Promise<boolean> => {
      const { error } = await supabase
        .from("session_ideas")
        .delete()
        .eq("session_id", sessionId)
        .eq("idea_id", ideaId);

      if (!error) {
        setSessionIdeas((prev) => prev.filter((i) => i.id !== ideaId));
        return true;
      }
      return false;
    },
    [],
  );

  const clearSessionIdeas = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const { error } = await supabase
        .from("session_ideas")
        .delete()
        .eq("session_id", sessionId);

      if (!error) {
        setSessionIdeas([]);
        return true;
      }
      return false;
    },
    [],
  );

  const selectSession = useCallback((sessionId: string) => {
    // Instant cache hit for messages
    const cached = messageCache.get(sessionId);
    if (cached) {
      setMessages(cached);
    }
    setCurrentSessionId(sessionId);
    setIsDraftSession(false);
  }, []);

  const startNewChat = useCallback(async () => {
    await createSession();
  }, [createSession]);

  return {
    sessions,
    currentSessionId,
    messages,
    sessionIdeas,
    isLoading,
    userId,
    isAuthLoading,
    isDraftSession,
    createSession,
    updateSessionTitle,
    deleteSession,
    addMessage,
    addIdea,
    removeIdea,
    clearSessionIdeas,
    selectSession,
    startNewChat,
    loadSessions,
    setSessionIdeas,
    toggleFavorite,
    isFavorite,
  };
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, Loader2, Music, TrendingUp, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { useChatSessionsContext } from '@/contexts/ChatSessionsContext';
import { ChatMessage } from '@/hooks/useChatSessions';
import { ChatHistorySidebar } from '@/components/ChatHistorySidebar';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useAISidebar } from '@/contexts/AISidebarContext';

interface LocalMessage extends ChatMessage {
  feedback?: 'positive' | 'negative';
}

const STARTER_PROMPTS = [
  { icon: TrendingUp, text: "What's going viral in hip-hop right now?" },
  { icon: Music, text: "Give me 5 content ideas for my new single" },
  { icon: Lightbulb, text: "How can I make my studio sessions more engaging?" },
];

export function DiscoverChat() {
  const {
    sessions,
    currentSessionId,
    messages: dbMessages,
    createSession,
    deleteSession,
    updateSessionTitle,
    addMessage,
    selectSession,
    toggleFavorite,
  } = useChatSessionsContext();

  const { trackActivity } = useActivityTracker();
  const { focusTrigger } = useAISidebar();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const chatStartedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync database messages to local state
  useEffect(() => {
    setLocalMessages(dbMessages.map(m => ({ ...m })));
  }, [dbMessages]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Auto-focus textarea when sidebar opens
  useEffect(() => {
    if (focusTrigger > 0) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [focusTrigger]);

  // Create a new session if none exists
  useEffect(() => {
    if (userId && !currentSessionId && sessions.length === 0) {
      createSession(); // Create session immediately
    }
  }, [userId, currentSessionId, sessions.length, createSession]);

  const { checkRateLimit, validateInput } = useRateLimit();

  const handleSubmit = useCallback(async (messageText?: string) => {
    const raw = messageText || input.trim();
    if (!raw || isLoading) return;

    const text = validateInput(raw);
    if (!text) return;
    if (!checkRateLimit()) return;

    let sessionToUse = currentSessionId;
    
    // If no session, create one
    if (!sessionToUse) {
      const newSessionId = await createSession();
      if (!newSessionId) {
        toast.error('Failed to create chat session');
        return;
      }
      sessionToUse = newSessionId;
    }

    // Optimistically add user message to UI
    const tempUserMessage: LocalMessage = {
      id: crypto.randomUUID(),
      session_id: sessionToUse,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, tempUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Track activity
      trackActivity('message_sent', { sessionId: sessionToUse });
      if (!chatStartedRef.current) {
        chatStartedRef.current = true;
        trackActivity('ai_chat_started', { sessionId: sessionToUse });
      }

      // Save user message to database
      await addMessage(sessionToUse, 'user', text);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 5 minutes')), 300_000)
      );
      const invokePromise = supabase.functions.invoke('chat-proxy', {
        body: {
          message: text,
          sessionId: sessionToUse,
        },
      });
      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

      if (error) throw error;

      // Parse response
      let assistantContent = typeof data === 'string' ? data : '';
      if (typeof data === 'object' && data !== null) {
        assistantContent = data.output || data.text || data.message || JSON.stringify(data);
      }

      // Save assistant message to database
      await addMessage(sessionToUse, 'assistant', assistantContent);

    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      // Remove optimistic message on error
      setLocalMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userId, currentSessionId, addMessage, createSession, checkRateLimit, validateInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = useCallback(async () => {
    if (dbMessages.length === 0) return;
    await createSession();
  }, [createSession, dbMessages.length]);

  const handleThumbsUp = async (messageId: string) => {
    // Mark message as liked
    setLocalMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback: 'positive' as const } : m
    ));
    
    // Submit feedback silently
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const message = localMessages.find(m => m.id === messageId);
        await supabase.from('assistant_feedback').insert({
          user_id: user.id,
          session_id: currentSessionId || 'unknown',
          feedback_type: 'positive',
          feedback_message: null,
          message_content: message?.content?.substring(0, 500) || null,
        });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
    
    toast.success('Thanks for the feedback!');
  };

  const handleThumbsDown = (messageId: string) => {
    setFeedbackMessageId(messageId);
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackDialogClose = (open: boolean) => {
    setFeedbackDialogOpen(open);
    if (!open && feedbackMessageId) {
      // Mark as negative feedback when dialog closes
      setLocalMessages(prev => prev.map(m => 
        m.id === feedbackMessageId ? { ...m, feedback: 'negative' as const } : m
      ));
      setFeedbackMessageId(null);
    }
  };

  const isEmpty = localMessages.length === 0;
  const feedbackMessage = localMessages.find(m => m.id === feedbackMessageId);

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            // Empty state - centered welcome
            <div className="h-full flex items-center justify-center p-4 md:p-6">
              <div className="max-w-xl text-center space-y-6 md:space-y-8">
                <div className="space-y-2 md:space-y-3">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h1 className="text-lg md:text-2xl font-semibold text-foreground">
                    What content should you make?
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                    Ask me about viral trends, content ideas for your genre, or what's working for other artists right now.
                  </p>
                </div>

                {/* Starter prompts */}
                <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(prompt.text)}
                      className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border border-border bg-card hover:bg-muted/50 text-xs md:text-sm text-left transition-all hover:border-primary/30"
                    >
                      <prompt.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                      <span>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages list
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {localMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown components={{
                            h1: ({ children }) => <h1 className="font-semibold text-white text-xl mt-6 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="font-semibold text-white text-lg mt-6 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="font-semibold text-white text-base mt-6 mb-2">{children}</h3>,
                            p: ({ children }) => <p className="text-[#E5E5E5] leading-relaxed mb-3">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-[#A3A3A3]">{children}</em>,
                            ul: ({ children }) => <ul className="pl-4 mb-3 list-disc marker:text-purple-500">{children}</ul>,
                            ol: ({ children }) => <ol className="pl-4 mb-3 list-decimal marker:text-purple-400">{children}</ol>,
                            li: ({ children }) => <li className="text-[#E5E5E5] mb-1.5 leading-relaxed">{children}</li>,
                            a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">{children}</a>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-purple-500/50 pl-4 text-[#A3A3A3] italic my-3">{children}</blockquote>,
                            hr: () => <hr className="border-white/10 my-4" />,
                            pre: ({ children }) => (
                              <pre className="bg-[#141414] border border-white/10 rounded-lg p-4 overflow-x-auto my-2">{children}</pre>
                            ),
                            code: ({ children, className }) => {
                              const isBlock = className?.includes('language-');
                              return isBlock
                                ? <code className="text-[#E5E5E5] text-sm font-mono">{children}</code>
                                : <code className="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
                            }
                          }}>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    
                    {/* Feedback buttons for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="flex gap-1 ml-1">
                        <button
                          onClick={() => handleThumbsUp(message.id)}
                          disabled={!!message.feedback}
                          className={cn(
                            "p-1.5 rounded-md transition-colors",
                            message.feedback === 'positive'
                              ? "text-green-500 bg-green-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                          title="Good response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleThumbsDown(message.id)}
                          disabled={!!message.feedback}
                          className={cn(
                            "p-1.5 rounded-md transition-colors",
                            message.feedback === 'negative'
                              ? "text-orange-500 bg-orange-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                          title="Could be better"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-2.5 md:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about content ideas, trends, or strategies..."
                className="min-h-[52px] max-h-32 pr-12 resize-none rounded-xl border-border/50 focus:border-primary/50"
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              AI-powered by Wavebound's viral content database
            </p>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {userId && (
        <div className="w-64 hidden lg:block">
          <ChatHistorySidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={selectSession}
            onNewChat={handleNewChat}
            onDeleteSession={deleteSession}
            onRenameSession={updateSessionTitle}
            onToggleFavorite={toggleFavorite}
            isCollapsed={!showHistory}
            isCurrentSessionEmpty={dbMessages.length === 0}
            onToggleCollapse={() => setShowHistory(!showHistory)}
          />
        </div>
      )}

      {/* Feedback dialog for thumbs down */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={handleFeedbackDialogClose}
        feedbackType="negative"
        sessionId={currentSessionId || 'unknown'}
        messageContent={feedbackMessage?.content}
      />
    </div>
  );
}

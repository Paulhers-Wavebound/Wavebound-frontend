import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Plus,
  History,
  Trash2,
  MessageSquare,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

import { cn } from '@/lib/utils';
import { parseHiddenData } from '@/utils/hiddenDataParser';
import { useAISidebar } from '@/contexts/AISidebarContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface AssistantChatPanelProps {
  onMessage?: (message: string, history: { role: string; content: string }[], sessionId?: string | null) => Promise<string>;
  onAIResponse?: (rawResponse: string, sessionId?: string | null) => Promise<{ cleanMessage: string; hasNewIdeas: boolean }>;
  onSessionSelect?: (sessionId: string) => void;
  sessions?: ChatSession[];
  currentSessionId?: string | null;
  messages?: any[];
  userId?: string | null;
  createSession?: (title: string) => Promise<string>;
  deleteSession?: (id: string) => Promise<void>;
  addMessage?: (sessionId: string, role: 'user' | 'assistant', content: string) => Promise<any>;
  selectSession?: (sessionId: string) => void;
  startNewChat?: () => void;
  suggestedPrompts?: string[];
  onSuggestedPromptUsed?: () => void;
  className?: string;
}

const loadingMessages = [
  "Analyzing viral patterns...",
  "Scanning top performers...",
  "Finding winning strategies...",
  "Building your insights...",
];

// Render markdown content with proper formatting
function renderMarkdownContent(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 ml-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground list-disc ml-4">{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  lines.forEach((line, i) => {
    // Skip empty lines
    if (!line.trim()) {
      flushList();
      elements.push(<div key={`br-${i}`} className="h-2" />);
      return;
    }

    // Headers
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">
          {line.slice(3)}
        </h3>
      );
      return;
    }

    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">
          {line.slice(2)}
        </h2>
      );
      return;
    }

    // Bold headers (e.g., **Header:**)
    if (line.match(/^\*\*[^*]+\*\*:?$/)) {
      flushList();
      const content = line.replace(/\*\*/g, '').replace(/:$/, '');
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">
          {content}
        </h4>
      );
      return;
    }

  // List items
    if (line.match(/^[\-\*•]\s/) || line.match(/^\d+\.\s/)) {
      inList = true;
      const content = line.replace(/^[\-\*•]\s/, '').replace(/^\d+\.\s/, '');
      listItems.push(content);
      return;
    }

    // Regular paragraph with inline formatting
    flushList();
    elements.push(
      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
        {parseInlineMarkdown(line)}
      </p>
    );
  });

  flushList();
  return elements;
}

// Parse inline markdown (bold, italic, code)
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.slice(0, italicMatch.index));
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // Code
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index));
      }
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // No more matches, add remaining text
    parts.push(remaining);
    break;
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

export function AssistantChatPanel({
  onMessage,
  onAIResponse,
  onSessionSelect,
  sessions = [],
  currentSessionId,
  messages: storedMessages = [],
  userId,
  createSession,
  deleteSession,
  addMessage,
  selectSession,
  startNewChat,
  suggestedPrompts = [],
  onSuggestedPromptUsed,
  className,
}: AssistantChatPanelProps) {
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { focusTrigger } = useAISidebar();

  // Sync stored messages
  useEffect(() => {
    if (storedMessages.length > 0) {
      setLocalMessages(storedMessages.map((m: any) => ({
        id: m.id || `msg-${Date.now()}-${Math.random()}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at ? new Date(m.created_at) : new Date(),
      })));
    } else if (!currentSessionId) {
      setLocalMessages([]);
    }
  }, [storedMessages, currentSessionId]);

  // Loading message animation
  useEffect(() => {
    if (!isLoading) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-scroll
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

  const handleSubmit = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setLocalMessages(prev => [...prev, userMessage]);

    try {
      let activeSessionId = currentSessionId;

      // Create session if needed
      if (!activeSessionId && userId && createSession) {
        const title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
        activeSessionId = await createSession(title);
      }

      // Save user message
      if (activeSessionId && addMessage) {
        await addMessage(activeSessionId, 'user', text);
      }

      // Get AI response
      const history = localMessages.map(m => ({ role: m.role, content: m.content }));
      const rawResponse = onMessage 
        ? await onMessage(text, [...history, { role: 'user', content: text }], activeSessionId)
        : 'No response handler configured.';

      // Process response for ideas
      let displayContent = rawResponse;
      if (onAIResponse) {
        const result = await onAIResponse(rawResponse, activeSessionId);
        displayContent = result.cleanMessage;
      } else {
        // Clean hidden data if no handler
        const parsed = parseHiddenData(rawResponse);
        displayContent = parsed.cleanMessage;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: displayContent,
        timestamp: new Date(),
      };

      setLocalMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      if (activeSessionId && addMessage) {
        await addMessage(activeSessionId, 'assistant', rawResponse);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, localMessages, currentSessionId, userId, createSession, addMessage, onMessage, onAIResponse]);

  const handleNewChat = () => {
    setLocalMessages([]);
    startNewChat?.();
  };

  const handleSuggestedPromptClick = async (prompt: string) => {
    onSuggestedPromptUsed?.();
    await handleSubmit(prompt);
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border bg-muted/30 overflow-hidden flex-shrink-0"
          >
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Chat History</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="h-[calc(100%-60px)] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="p-2 space-y-1">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-colors",
                      session.id === currentSessionId
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => {
                      selectSession?.(session.id);
                      onSessionSelect?.(session.id);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{session.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession?.(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {!showHistory && (
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)} className="mr-1">
                <History className="w-4 h-4" />
              </Button>
            )}
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Content Assistant</h2>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleNewChat}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="py-4 space-y-4">
            {localMessages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">Start a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Ask about trends, get video ideas, or request a content strategy.
                </p>
              </div>
            )}

            {localMessages.map(message => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.35)]"
                      : "bg-muted/20 border border-border/10 shadow-[0_2px_10px_-4px_hsl(var(--foreground)/0.04)]"
                  )}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderMarkdownContent(message.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/10 shadow-[0_2px_10px_-4px_hsl(var(--foreground)/0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">{loadingMessage}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Prompts */}
        {suggestedPrompts.length > 0 && !isLoading && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Suggested follow-ups</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedPromptClick(prompt)}
                  className="text-xs px-3.5 py-2 rounded-xl border border-border/10 bg-card/60 backdrop-blur-sm shadow-[0_2px_8px_-3px_hsl(var(--foreground)/0.04)] hover:shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.1)] hover:translate-y-[-0.5px] text-foreground transition-all duration-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm shadow-[0_4px_20px_-6px_hsl(var(--foreground)/0.06),0_1px_3px_-1px_hsl(var(--foreground)/0.03)] transition-all duration-300 focus-within:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15),0_2px_8px_-3px_hsl(var(--foreground)/0.04)]">
            <div className="flex items-end gap-2 p-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Ask about content ideas..."
                  className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-9 w-9 rounded-full shadow-sm shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

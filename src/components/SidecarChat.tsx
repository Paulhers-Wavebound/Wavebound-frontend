import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Plus, MessageSquare, Trash2, PanelRightOpen, PanelRightClose, Paperclip, X, Film, Music, Share2, Camera, Video, User } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { ChatSession, ChatMessage as StoredChatMessage } from '@/hooks/useChatSessions';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import waveboundLogo from '@/assets/wavebound-logo.png';
import { EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { ChatMessage as ChatMessageComponent } from './ChatMessageRenderer';

// Get context icon based on message content
function getContextIcon(content: string): React.ReactNode {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('video') || lowerContent.includes('film') || lowerContent.includes('tiktok') || lowerContent.includes('reel')) {
    return <Video className="w-4 h-4 text-muted-foreground" />;
  }
  if (lowerContent.includes('audio') || lowerContent.includes('music') || lowerContent.includes('track') || lowerContent.includes('song')) {
    return <Music className="w-4 h-4 text-muted-foreground" />;
  }
  if (lowerContent.includes('photo') || lowerContent.includes('picture') || lowerContent.includes('slide')) {
    return <Camera className="w-4 h-4 text-muted-foreground" />;
  }
  
  return <Camera className="w-4 h-4 text-muted-foreground" />;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SidecarChatProps {
  onMessage?: (message: string, history: { role: string; content: string }[], sessionId?: string | null) => Promise<string>;
  onAIResponse?: (rawResponse: string, sessionId?: string | null) => Promise<{ cleanMessage: string; hasNewIdeas?: boolean }>;
  onSessionSelect?: (sessionId: string) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: StoredChatMessage[];
  userId: string | null;
  createSession: () => Promise<string | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  addMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => Promise<StoredChatMessage | null>;
  selectSession: (sessionId: string) => void;
  startNewChat: () => Promise<void>;
  suggestedPrompts?: string[];
  onSuggestedPromptUsed?: () => void;
  className?: string;
}

export function SidecarChat({
  onMessage,
  onAIResponse,
  onSessionSelect,
  sessions,
  currentSessionId,
  messages: storedMessages,
  userId,
  createSession,
  deleteSession,
  addMessage,
  selectSession,
  startNewChat,
  suggestedPrompts = [],
  onSuggestedPromptUsed,
  className,
}: SidecarChatProps) {

  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Thinking...');
  const [showSidebar, setShowSidebar] = useState(true);
  const [compactSidebar, setCompactSidebar] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Allowed file types for video/audio
  const allowedTypes = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'
  ];

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        console.warn(`File type ${file.type} not allowed`);
        return false;
      }
      // 100MB limit
      if (file.size > 100 * 1024 * 1024) {
        console.warn(`File ${file.name} is too large (max 100MB)`);
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (e.currentTarget === dropZoneRef.current && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Sync local messages with stored messages for the active session
  useEffect(() => {
    if (storedMessages.length > 0) {
      setLocalMessages(storedMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      })));
    } else {
      setLocalMessages([]);
    }
  }, [storedMessages, currentSessionId]);

  // Cycle through loading statuses
  useEffect(() => {
    if (!isLoading) return;

    const statuses = [
      'Thinking...',
      'Searching database...',
      'Finding matching videos...',
      'Analyzing content...',
      'Almost there...'
    ];
    let index = 0;
    setLoadingStatus(statuses[0]);

    const interval = setInterval(() => {
      index = (index + 1) % statuses.length;
      setLoadingStatus(statuses[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let sessionId = currentSessionId;
    
    // Create session if none exists
    if (!sessionId && userId) {
      sessionId = await createSession();
      if (!sessionId) return;
    }

    const userContent = input.trim();
    
    // Add user message locally first for immediate feedback
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    setLocalMessages(prev => [...prev, tempUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to database
      if (sessionId && userId) {
        await addMessage(sessionId, 'user', userContent);
      }

      // Build conversation history for context
      const history = localMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Get AI response - pass sessionId so webhook uses correct ID for continuity
      const rawResponse = onMessage 
        ? await onMessage(userContent, history, sessionId)
        : 'This is a placeholder response. Connect to your AI backend to get real responses.';

      // Process for hidden data and get clean message
      const result = onAIResponse 
        ? await onAIResponse(rawResponse, sessionId)
        : { cleanMessage: rawResponse, hasNewIdeas: false };

      // Add AI message locally
      const tempAiMessage: Message = {
        id: `temp-ai-${Date.now()}`,
        role: 'assistant',
        content: result.cleanMessage,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, tempAiMessage]);

      // Save AI message to database
      if (sessionId && userId) {
        await addMessage(sessionId, 'assistant', result.cleanMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewChat = async () => {
    await startNewChat();
    setLocalMessages([]);
  };

  // Handle clicking a suggested prompt
  const handleSuggestedPromptClick = async (prompt: string) => {
    if (isLoading) return;
    
    // Clear the suggested prompts when one is used
    onSuggestedPromptUsed?.();
    
    // Set the input and submit
    setInput(prompt);
    
    // Submit the prompt
    let sessionId = currentSessionId;
    
    if (!sessionId && userId) {
      sessionId = await createSession();
      if (!sessionId) return;
    }

    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setLocalMessages(prev => [...prev, tempUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (sessionId && userId) {
        await addMessage(sessionId, 'user', prompt);
      }

      const history = localMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const rawResponse = onMessage 
        ? await onMessage(prompt, history, sessionId)
        : 'This is a placeholder response.';

      const result = onAIResponse 
        ? await onAIResponse(rawResponse, sessionId)
        : { cleanMessage: rawResponse, hasNewIdeas: false };

      const tempAiMessage: Message = {
        id: `temp-ai-${Date.now()}`,
        role: 'assistant',
        content: result.cleanMessage,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, tempAiMessage]);

      if (sessionId && userId) {
        await addMessage(sessionId, 'assistant', result.cleanMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await deleteSession(sessionId);
  };

  const handleSelectSession = (sessionId: string) => {
    // Clear current messages while we load the selected session
    setLocalMessages([]);
    selectSession(sessionId);
    onSessionSelect?.(sessionId);
  };

  return (
    <div 
      ref={dropZoneRef}
      className={cn("flex h-full bg-background relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Paperclip className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">Drop your video or audio here</p>
            <p className="text-sm text-muted-foreground mt-1">MP4, WebM, MP3, WAV supported</p>
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <img src={waveboundLogo} alt="Wavebound" className="w-6 h-6 rounded" />
          <h2 className="font-semibold text-foreground">Content Assistant</h2>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleNewChat}
              className="h-8 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            {!userId && (
              <span className="text-xs text-muted-foreground">Sign in to save</span>
            )}
            {userId && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title={showSidebar ? "Hide chat history" : "Show chat history"}
              >
                {showSidebar ? (
                  <PanelRightClose className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <PanelRightOpen className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {localMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 overflow-hidden">
                <img src={waveboundLogo} alt="Wavebound" className="w-8 h-8" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Ask about content ideas that match your music style
              </p>
              
              {/* Differentiator */}
              <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border max-w-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase">Live</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Connected to viral database</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">ChatGPT doesn't know this.</span> Our AI has real-time access to <span className="font-semibold text-foreground">15,000+ viral videos</span> matched to your music.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-full text-[10px] text-muted-foreground border border-border">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </div>
                  <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-full text-[10px] text-muted-foreground border border-border">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Reels
                  </div>
                </div>
              </div>
            </div>
          )}

          {localMessages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}

          {isLoading && (
            <ChatMessageComponent
              role="assistant"
              content=""
              isLoading={true}
              loadingStatus={loadingStatus}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {suggestedPrompts.length > 0 && !isLoading && (
          <div className="px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
              Suggested follow-ups
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPromptClick(prompt)}
                  className="px-3 py-1.5 text-xs bg-background border border-border rounded-full hover:bg-muted hover:border-primary/30 transition-colors text-foreground text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 text-xs"
                >
                  {file.type.startsWith('video/') ? (
                    <Film className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Music className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="max-w-[120px] truncate text-foreground">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-0.5 hover:bg-muted rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border shrink-0">
          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            {/* Upload button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
              title="Attach video or audio"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Thinking... type your next question" : "Ask about content ideas..."}
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Drop video or audio files here, or click <Paperclip className="w-2.5 h-2.5 inline" /> to upload
          </p>
        </form>
      </div>

      {/* Chat History Sidebar - Sticky with independent scroll */}
      {userId && showSidebar && (
        <div className={cn(
          "h-full flex flex-col bg-muted/30 border-l border-border shrink-0 sticky top-0 transition-all duration-200",
          compactSidebar ? "w-14" : "w-64"
        )}>
          {/* Sidebar Header */}
          <div className={cn(
            "p-3 border-b border-border flex items-center shrink-0",
            compactSidebar ? "justify-center" : "justify-between"
          )}>
            {!compactSidebar && (
              <span className="font-medium text-sm text-foreground">Chat History</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCompactSidebar(!compactSidebar)}
              title={compactSidebar ? "Expand sidebar" : "Compact sidebar"}
            >
              {compactSidebar ? (
                <PanelRightOpen className="w-4 h-4" />
              ) : (
                <PanelRightClose className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* New Chat Button - Prominent */}
          <div className={cn("p-2 border-b border-border", compactSidebar && "flex justify-center")}>
            <Button
              variant="default"
              size={compactSidebar ? "icon" : "sm"}
              onClick={handleNewChat}
              className={cn("gap-1.5", !compactSidebar && "w-full")}
            >
              <Plus className="w-4 h-4" />
              {!compactSidebar && "New Chat"}
            </Button>
          </div>

          {/* Session List - Independent scroll */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {sessions.length === 0 ? (
              <div className={cn(
                "text-center py-8 text-muted-foreground text-xs",
                compactSidebar && "px-0"
              )}>
                {compactSidebar ? "—" : "No sessions yet"}
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg cursor-pointer transition-colors",
                    compactSidebar ? "p-2 justify-center" : "p-2.5",
                    currentSessionId === session.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                  title={compactSidebar ? session.title : undefined}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  {!compactSidebar && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{session.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
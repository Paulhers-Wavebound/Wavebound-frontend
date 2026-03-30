import { useState, useCallback, useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { AssistantVideoGrid } from './AssistantVideoGrid';
import { AssistantChatPanel } from './AssistantChatPanel';
import { useIdeaExtraction, EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatSessionsContext } from '@/contexts/ChatSessionsContext';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface SidecarLayoutProps {
  onSendMessage?: (message: string, sessionId?: string | null) => Promise<string>;
  onSessionChange?: (sessionId: string | null) => void;
  className?: string;
}

export function SidecarLayout({ onSendMessage, onSessionChange, className }: SidecarLayoutProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'chat' | 'ideas'>('chat');
  
  // Local ideas state for immediate display
  const [localIdeas, setLocalIdeas] = useState<EnrichedIdea[]>([]);
  
  const {
    sessions,
    currentSessionId,
    messages,
    sessionIdeas,
    userId,
    createSession,
    deleteSession,
    addMessage,
    addIdea,
    removeIdea: removeSessionIdea,
    clearSessionIdeas,
    selectSession,
    startNewChat,
  } = useChatSessionsContext();

  const { isProcessing, processMessage } = useIdeaExtraction();

  // Sync local ideas with session ideas when session changes
  useEffect(() => {
    if (currentSessionId && userId) {
      setLocalIdeas([]);
    }
  }, [currentSessionId, userId]);

  useEffect(() => {
    if (sessionIdeas.length > 0 && userId && currentSessionId) {
      setLocalIdeas([]);
    }
  }, [sessionIdeas, userId, currentSessionId]);

  // Merge local ideas with session ideas
  const displayIdeas = userId && currentSessionId 
    ? [...sessionIdeas, ...localIdeas]
    : localIdeas;
  
  const hasIdeas = displayIdeas.length > 0 || isProcessing;

  // Suggested prompts from AI responses
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // Called when user selects a session from history
  const handleSessionSelect = useCallback((sessionId: string) => {
    setLocalIdeas([]);
    setSuggestedPrompts([]);
    onSessionChange?.(sessionId);
  }, [onSessionChange]);

  const handleAIResponse = useCallback(
    async (rawResponse: string, sessionId?: string | null) => {
      const result = await processMessage(rawResponse);
      
      if (result.suggestedPrompts && result.suggestedPrompts.length > 0) {
        setSuggestedPrompts(result.suggestedPrompts);
      } else {
        setSuggestedPrompts([]);
      }
      
      const targetSessionId = sessionId || currentSessionId;
      
      if (result.hasNewIdeas && result.ideas.length > 0) {
        setLocalIdeas(prev => [...prev, ...result.ideas]);
        
        if (targetSessionId && userId) {
          for (const idea of result.ideas) {
            await addIdea(targetSessionId, idea);
          }
        }
      }
      
      return { cleanMessage: result.cleanMessage, hasNewIdeas: result.hasNewIdeas };
    },
    [processMessage, currentSessionId, userId, addIdea]
  );

  const handleRemoveIdea = useCallback(async (ideaId: string) => {
    setLocalIdeas(prev => prev.filter(i => i.id !== ideaId));
    
    if (currentSessionId && userId) {
      await removeSessionIdea(currentSessionId, ideaId);
    }
  }, [currentSessionId, userId, removeSessionIdea]);

  const handleClearIdeas = useCallback(async () => {
    setLocalIdeas([]);
    
    if (currentSessionId && userId) {
      await clearSessionIdeas(currentSessionId);
    }
  }, [currentSessionId, userId, clearSessionIdeas]);

  // Wrapper to adapt onSendMessage
  const handleMessage = useCallback(async (
    message: string, 
    _history: { role: string; content: string }[], 
    sessionId?: string | null
  ): Promise<string> => {
    if (!onSendMessage) {
      return 'No message handler configured.';
    }
    return onSendMessage(message, sessionId);
  }, [onSendMessage]);

  // Desktop: Resizable side-by-side layout
  if (!isMobile) {
    return (
      <ResizablePanelGroup 
        direction="horizontal" 
        className={cn("h-full", className)}
      >
        {/* Left Panel - Video Grid (shows when there are ideas) */}
        {hasIdeas && (
          <>
            <ResizablePanel 
              defaultSize={55} 
              minSize={30}
              maxSize={70}
            >
              <AssistantVideoGrid
                ideas={displayIdeas}
                isProcessing={isProcessing}
                onClear={handleClearIdeas}
                onRemoveIdea={handleRemoveIdea}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Right Panel - Chat */}
        <ResizablePanel 
          defaultSize={hasIdeas ? 45 : 100} 
          minSize={30}
        >
          <div className="h-full border-l border-border">
            <AssistantChatPanel
              onMessage={handleMessage}
              onAIResponse={handleAIResponse}
              onSessionSelect={handleSessionSelect}
              sessions={sessions}
              currentSessionId={currentSessionId}
              messages={messages}
              userId={userId}
              createSession={createSession}
              deleteSession={deleteSession}
              addMessage={addMessage}
              selectSession={selectSession}
              startNewChat={startNewChat}
              suggestedPrompts={suggestedPrompts}
              onSuggestedPromptUsed={() => setSuggestedPrompts([])}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // Mobile: Tabbed layout
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Tab Bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            activeTab === 'chat'
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('ideas')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
            activeTab === 'ideas'
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Ideas
          {displayIdeas.length > 0 && (
            <span className="absolute top-2 right-4 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {displayIdeas.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <AssistantChatPanel
            onMessage={handleMessage}
            onAIResponse={handleAIResponse}
            onSessionSelect={handleSessionSelect}
            sessions={sessions}
            currentSessionId={currentSessionId}
            messages={messages}
            userId={userId}
            createSession={createSession}
            deleteSession={deleteSession}
            addMessage={addMessage}
            selectSession={selectSession}
            startNewChat={startNewChat}
            suggestedPrompts={suggestedPrompts}
            onSuggestedPromptUsed={() => setSuggestedPrompts([])}
          />
        ) : (
          <AssistantVideoGrid
            ideas={displayIdeas}
            isProcessing={isProcessing}
            onClear={handleClearIdeas}
            onRemoveIdea={handleRemoveIdea}
          />
        )}
      </div>
    </div>
  );
}

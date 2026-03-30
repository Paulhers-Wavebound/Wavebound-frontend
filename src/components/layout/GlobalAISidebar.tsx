import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, MessageSquare, Maximize2, Minimize2, GripVertical, PanelRight, Layers, Plus, History, ChevronDown, Star, Trash2, Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAISidebar } from '@/contexts/AISidebarContext';
import { useDiscover } from '@/contexts/DiscoverContext';
import { motion } from 'framer-motion';
import waveboundLogo from '@/assets/wavebound-logo.png';
import { cn } from '@/lib/utils';
import { DiscoverAssistant } from '@/components/discover/DiscoverAssistant';
import { useChatSessionsContext } from '@/contexts/ChatSessionsContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

// Wavebound logo component
const WaveboundIcon = ({ className }: { className?: string }) => (
  <img src={waveboundLogo} alt="Wavebound" className={cn("object-contain", className)} />
);

const MIN_WIDTH = 360;
const MAX_WIDTH = 900;

export function GlobalAISidebar() {
  const { isOpen, mode, width, isFocusMode, closeSidebar, toggleSidebar, setMode, setWidth, setFocusMode } = useAISidebar();
  const { isAIPanelOpen, setAIPanelOpen } = useDiscover();
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    selectSession, 
    deleteSession,
    toggleFavorite,
    updateSessionTitle,
    userId,
    isAuthLoading,
  } = useChatSessionsContext();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const location = useLocation();
  const isOnDiscover = location.pathname === '/discover';
  const isOnChat = location.pathname === '/chat';
  const isOnAnalyzeAudio = location.pathname.startsWith('/analyze-audio');
  const isOnAnalyzeVideo = location.pathname.startsWith('/analyze-video');
  const isOnAdmin = location.pathname.startsWith('/admin');
  const isOnLabel = location.pathname.startsWith('/label');
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Sort sessions: favorites first, then by updated_at
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Get current session title
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentTitle = currentSession?.title || 'New Chat';

  // Sync with both AISidebar context and Discover context
  useEffect(() => {
    if (isAIPanelOpen && !isOpen) {
      toggleSidebar();
    }
  }, [isAIPanelOpen, isOpen, toggleSidebar]);

  const handleClose = () => {
    closeSidebar();
    setAIPanelOpen(false);
    setFocusMode(false);
  };

  const handleToggle = () => {
    toggleSidebar();
    setAIPanelOpen(!isOpen);
  };

  const toggleFocusMode = () => {
    setFocusMode(!isFocusMode);
  };

  // Escape key exits focus mode
  useEffect(() => {
    if (!isFocusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, setFocusMode]);

  const toggleMode = () => {
    setMode(mode === 'float' ? 'dock' : 'float');
  };

  // Resize handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX - 12; // account for right margin
      setWidth(Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setWidth]);

  // Chat controls (new chat + history dropdown)
  const renderChatControls = () => (
    <div className="flex items-center gap-1">
      {/* New Chat Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => createSession()}
              className="h-8 w-8"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* History Dropdown */}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <History className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-72 max-h-[70vh] overflow-hidden box-border">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Recent Chats
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="max-h-[60vh]">
            {sortedSessions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                No chats yet
              </div>
            ) : (
              sortedSessions.slice(0, 15).map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  onClick={() => renamingId !== session.id && selectSession(session.id)}
                  className={cn(
                    "flex items-center gap-2 py-2 cursor-pointer group overflow-hidden min-w-0",
                    currentSessionId === session.id && "bg-primary/10"
                  )}
                  onSelect={(e) => { if (renamingId === session.id) e.preventDefault(); }}
                >
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {renamingId === session.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && renameValue.trim()) {
                              updateSessionTitle(session.id, renameValue.trim());
                              setRenamingId(null);
                            } else if (e.key === 'Escape') {
                              setRenamingId(null);
                            }
                          }}
                          className="h-6 text-sm px-1.5 py-0"
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (renameValue.trim()) {
                              updateSessionTitle(session.id, renameValue.trim());
                            }
                            setRenamingId(null);
                          }}
                          className="p-1 rounded hover:bg-primary/20 text-primary"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
                          {session.is_favorite && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          <span className="truncate text-sm block max-w-full">{session.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                  {renamingId !== session.id && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(session.id);
                          setRenameValue(session.title);
                        }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(session.id);
                        }}
                        className={cn(
                          "p-1 rounded hover:bg-muted transition-colors",
                          session.is_favorite ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                        )}
                      >
                        <Star className={cn("w-3 h-3", session.is_favorite && "fill-current")} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Header buttons shared between float and dock modes
  const renderHeaderButtons = () => (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMode} 
              className="h-8 w-8"
            >
              {mode === 'float' ? (
                <PanelRight className="w-4 h-4" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{mode === 'float' ? 'Dock panel to push content' : 'Float panel over content'}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFocusMode} 
              className="h-8 w-8"
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFocusMode ? 'Exit focus mode' : 'Focus mode'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );

  // Single persistent chat content - rendered once and moved between containers
  const chatContentElement = useMemo(() => {
    if (userId) {
      return <DiscoverAssistant />;
    }

    if (isAuthLoading) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto">
              <WaveboundIcon className="w-12 h-12 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <WaveboundIcon className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sign in to chat</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Log in to access the AI assistant and get personalized content recommendations.
            </p>
          </div>
          <Button onClick={() => window.location.href = '/auth'} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }, [userId, isAuthLoading]);

  return (
    <>
      {/* Floating toggle button - hidden when sidebar is open or on pages with their own Ask AI button, hidden on mobile */}
      {!isOpen && !isOnDiscover && !isOnChat && !isOnAnalyzeAudio && !isOnAnalyzeVideo && !isOnAdmin && !isOnLabel && (
        <button
          onClick={handleToggle}
          className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 items-center justify-center bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Mobile: Fixed overlay that sits above bottom nav */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-0 z-40 bg-background flex flex-col" style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/10 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <WaveboundIcon className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-foreground text-sm truncate">{currentTitle}</span>
              {userId && renderChatControls()}
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            {chatContentElement}
          </div>
        </div>
      )}

      {/* Focus mode backdrop */}
      {isOpen && isFocusMode && (
        <div
          className="hidden md:block fixed inset-0 z-30 bg-black/30 transition-opacity duration-300"
          onClick={() => setFocusMode(false)}
        />
      )}

      {/* Sidebar panel - always mounted, visibility controlled via CSS for keep-alive */}
      <motion.div
        ref={sidebarRef}
        animate={{ 
          x: isOpen ? 0 : '100%', 
          opacity: isOpen ? 1 : 0 
        }}
        initial={false}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ 
          width: isFocusMode 
            ? (window.innerWidth < 1200 ? '100vw' : '70vw') 
            : `${width}px`,
          transition: 'width 0.3s ease',
          visibility: isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        className={cn(
          "fixed top-[calc(4rem+12px)] right-3 bottom-3 z-40 flex overflow-hidden rounded-[20px]",
          "hidden md:flex",
          "bg-[hsl(0_0%_100%)] dark:bg-[hsl(240_20%_12%)] border-none outline-none backdrop-filter-none",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06),0_24px_48px_rgba(0,0,0,0.08)]",
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.3),0_24px_48px_rgba(0,0,0,0.4)]"
        )}
      >
        {/* Pill-shaped divider + Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-5 -ml-2.5 cursor-col-resize flex items-center justify-center group z-50"
          )}
        >
          {/* Thick rounded pill separator */}
          <div className={cn(
            "w-[5px] h-12 rounded-full bg-black/[0.06] dark:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isResizing && "opacity-100 bg-primary/50"
          )} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 shrink-0 gap-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <WaveboundIcon className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-foreground text-sm truncate">{currentTitle}</span>
              {userId && renderChatControls()}
            </div>
            <div className="flex items-center shrink-0">
              {renderHeaderButtons()}
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            {chatContentElement}
          </div>
        </div>
      </motion.div>
    </>
  );
}

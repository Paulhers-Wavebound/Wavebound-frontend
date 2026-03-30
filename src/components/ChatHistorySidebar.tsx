import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, ChevronRight, Star, Pencil, Check, X } from 'lucide-react';
import { Button } from './ui/button';

import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  onToggleFavorite?: (sessionId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isCurrentSessionEmpty?: boolean;
}

export function ChatHistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  isCollapsed = false,
  onToggleCollapse,
  isCurrentSessionEmpty = false,
}: ChatHistorySidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort sessions: favorites first, then by updated_at
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const confirmEditing = (sessionId: string) => {
    if (editValue.trim() && onRenameSession) {
      onRenameSession(sessionId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      confirmEditing(sessionId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-border bg-muted/30 flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          disabled={isCurrentSessionEmpty}
          className="h-8 w-8"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <div className="flex-1 flex flex-col items-center gap-1 mt-2">
          {sortedSessions.slice(0, 10).map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative",
                currentSessionId === session.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
              >
                {session.is_favorite ? (
                  <Star className="w-4 h-4 fill-current" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border-l border-border bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-medium text-sm text-foreground">History</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            disabled={isCurrentSessionEmpty}
            className="h-7 w-7"
          >
            <Plus className="w-4 h-4" />
          </Button>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-7 w-7"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <Button
          onClick={onNewChat}
          variant="default"
          disabled={isCurrentSessionEmpty}
          className="w-full justify-start gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-2 space-y-1">
            <AnimatePresence mode="sync">
            {sortedSessions.map((session) => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg transition-colors group relative",
                  currentSessionId === session.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted border border-transparent",
                  editingId !== session.id && "cursor-pointer"
                )}
                onClick={() => editingId !== session.id && onSelectSession(session.id)}
              >
                <div className="flex items-start gap-2 min-w-0 overflow-hidden">
                  {/* Favorite star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(session.id);
                    }}
                    className={cn(
                      "mt-0.5 flex-shrink-0 p-0.5 rounded transition-colors",
                      session.is_favorite
                        ? "text-yellow-500"
                        : "text-muted-foreground/40 hover:text-yellow-500"
                    )}
                    aria-label={session.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={cn("w-3.5 h-3.5", session.is_favorite && "fill-current")} />
                  </button>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, session.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 text-sm px-1.5 py-0"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmEditing(session.id);
                          }}
                          className="p-1 rounded hover:bg-primary/20 text-primary"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEditing();
                          }}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p
                          className={cn(
                            "text-sm truncate cursor-text hover:underline decoration-muted-foreground/40",
                            currentSessionId === session.id
                              ? "text-foreground font-medium"
                              : "text-foreground"
                          )}
                          onClick={(e) => onRenameSession && startEditing(session, e)}
                        >
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  {editingId !== session.id && (
                    <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onRenameSession && (
                        <button
                          onClick={(e) => startEditing(session, e)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Rename chat"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteSession && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

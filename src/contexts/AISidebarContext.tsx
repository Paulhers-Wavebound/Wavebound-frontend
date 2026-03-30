import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type SidebarMode = 'float' | 'dock';

export interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
  isContentPlan?: boolean;
}

interface AISidebarContextValue {
  isOpen: boolean;
  mode: SidebarMode;
  width: number;
  isFocusMode: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setMode: (mode: SidebarMode) => void;
  setWidth: (width: number) => void;
  setFocusMode: (focus: boolean) => void;
  contextMessages: ContextMessage[];
  setContextMessages: (messages: ContextMessage[]) => void;
  clearContextMessages: () => void;
  isWaitingForResponse: boolean;
  setWaitingForResponse: (waiting: boolean) => void;
  focusTrigger: number;
  triggerFocus: () => void;
}

const AISidebarContext = createContext<AISidebarContextValue | undefined>(undefined);

interface AISidebarProviderProps {
  children: ReactNode;
}

const DEFAULT_WIDTH = 420;

export function AISidebarProvider({ children }: AISidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setModeState] = useState<SidebarMode>(() => {
    try {
      const saved = localStorage.getItem('ai_sidebar_mode');
      return (saved === 'dock' || saved === 'float') ? saved : 'float';
    } catch {
      return 'float';
    }
  });
  const [width, setWidthState] = useState(() => {
    try {
      const saved = localStorage.getItem('wavebound_chat_panel_width');
      return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });
  const [isFocusMode, setFocusModeState] = useState(() => {
    try {
      return localStorage.getItem('wavebound_chat_focus_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [contextMessages, setContextMessages] = useState<ContextMessage[]>([]);
  const [isWaitingForResponse, setWaitingForResponse] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const triggerFocus = useCallback(() => setFocusTrigger(prev => prev + 1), []);
  const openSidebar = useCallback(() => { setIsOpen(true); setFocusTrigger(prev => prev + 1); }, []);
  const closeSidebar = useCallback(() => setIsOpen(false), []);
  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);
  const clearContextMessages = useCallback(() => setContextMessages([]), []);
  
  const setMode = useCallback((newMode: SidebarMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('ai_sidebar_mode', newMode);
    } catch {
      // ignore
    }
  }, []);

  const setWidth = useCallback((newWidth: number) => {
    setWidthState(newWidth);
    try {
      localStorage.setItem('wavebound_chat_panel_width', newWidth.toString());
    } catch {
      // ignore
    }
  }, []);

  const setFocusMode = useCallback((focus: boolean) => {
    setFocusModeState(focus);
    try {
      localStorage.setItem('wavebound_chat_focus_mode', String(focus));
    } catch {
      // ignore
    }
  }, []);

  return (
    <AISidebarContext.Provider
      value={{
        isOpen,
        mode,
        width,
        isFocusMode,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        setMode,
        setWidth,
        setFocusMode,
        contextMessages,
        setContextMessages,
        clearContextMessages,
        isWaitingForResponse,
        setWaitingForResponse,
        focusTrigger,
        triggerFocus,
      }}
    >
      {children}
    </AISidebarContext.Provider>
  );
}

export function useAISidebar() {
  const context = useContext(AISidebarContext);
  if (!context) {
    throw new Error('useAISidebar must be used within an AISidebarProvider');
  }
  return context;
}

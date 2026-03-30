import React, { createContext, useContext, ReactNode } from 'react';
import { useChatSessions as useChatSessionsHook } from '@/hooks/useChatSessions';

type ChatSessionsContextValue = ReturnType<typeof useChatSessionsHook>;

const ChatSessionsContext = createContext<ChatSessionsContextValue | undefined>(undefined);

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const chatSessions = useChatSessionsHook();
  return (
    <ChatSessionsContext.Provider value={chatSessions}>
      {children}
    </ChatSessionsContext.Provider>
  );
}

export function useChatSessionsContext() {
  const context = useContext(ChatSessionsContext);
  if (!context) {
    throw new Error('useChatSessionsContext must be used within a ChatSessionsProvider');
  }
  return context;
}

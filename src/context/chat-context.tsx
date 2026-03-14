
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Chat } from '@functions/types';
import { useAuth } from './auth-context';

// --- MODIFICATION START ---
// The only info needed to render a chat widget is its ID.
// The widget itself will fetch all necessary data.
export interface ActiveChatInfo {
  chatId: string;
}

interface ChatContextType {
  activeChat: ActiveChatInfo | null;
  // Simplified function signatures
  startChat: (lotId: string, orderId?: string) => void; 
  openChatFromList: (chatId: string) => void;
  closeChat: () => void;
  isStarting: boolean;
}
// --- MODIFICATION END ---

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeChat, setActiveChat] = useState<ActiveChatInfo | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // --- MODIFICATION START ---
  // Unified function to start any chat, either from a lot or an order page.
  const startChat = async (lotId: string, orderId?: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "Помилка", description: "Ви повинні увійти, щоб почати чат." });
        return;
    }

    // Prevents re-opening the same chat
    if (activeChat?.chatId === (orderId || `${lotId}_${user.uid}`)) return;
    
    setIsStarting(true);
    try {
      // Determine which cloud function to call
      const functionName = orderId ? 'startOrGetChatForOrder' : 'startOrGetChat';
      const params = orderId ? { orderId } : { lotId };

      const startOrGetChatFunction = httpsCallable(functions, functionName);
      const result = await startOrGetChatFunction(params);
      const { chatId } = result.data as { chatId: string };
      
      setActiveChat({ chatId });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Помилка чату", description: error.message || "Не вдалося почати чат." });
      setActiveChat(null);
    } finally {
      setIsStarting(false);
    }
  };
  
  // Simplified function: just sets the active chat ID.
  const openChatFromList = (chatId: string) => {
    if (activeChat?.chatId === chatId) return; // Don't re-open same chat
    setActiveChat({ chatId });
  }
  // --- MODIFICATION END ---

  const closeChat = () => {
    setActiveChat(null);
  };

  return (
    <ChatContext.Provider value={{ activeChat, startChat, openChatFromList, closeChat, isStarting }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

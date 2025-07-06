
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Chat } from '@/functions/src/types';
import { useAuth } from './auth-context';

// This interface defines what information our active chat widget needs to display.
export interface ActiveChatInfo {
  chatId: string;
  lotId: string;
  lotName: string;
  lotImage: string;
  // Details about the *other* person in the chat
  otherParticipant: {
      uid: string;
      username: string;
  };
}

interface ChatContextType {
  activeChat: ActiveChatInfo | null;
  startChatFromLot: (lot: { lotId: string; lotName: string; lotImage: string; sellerUid: string; sellerName: string; }) => void;
  openChatFromList: (chat: Chat) => void;
  closeChat: () => void;
  isStarting: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeChat, setActiveChat] = useState<ActiveChatInfo | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user to determine the "other" participant

  // Used when a user clicks "Message" on a lot page.
  const startChatFromLot = async (lot: { lotId: string; lotName: string; lotImage: string; sellerUid: string; sellerName: string; }) => {
    // Don't restart if this chat is already open.
    if (activeChat?.chatId === `${lot.lotId}_${user?.uid}`) return;
    
    setIsStarting(true);
    try {
      const startOrGetChatFunction = httpsCallable(functions, 'startOrGetChat');
      const result = await startOrGetChatFunction({ lotId: lot.lotId });
      const { chatId } = result.data as { chatId: string };
      
      setActiveChat({
        chatId,
        lotId: lot.lotId,
        lotName: lot.lotName,
        lotImage: lot.lotImage,
        otherParticipant: {
          uid: lot.sellerUid,
          username: lot.sellerName,
        }
      });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Помилка чату", description: error.message || "Не вдалося почати чат." });
      setActiveChat(null);
    } finally {
      setIsStarting(false);
    }
  };
  
  // Used when a user clicks on a conversation from their message list.
  const openChatFromList = (chat: Chat) => {
    if (!user) return; // Should not happen if the user is viewing their message list

    // Determine who the "other" person is in the chat.
    const otherUid = chat.participantUids.find(uid => uid !== user.uid);
    if (!otherUid) {
        toast({variant: "destructive", title: "Помилка чату", description: "Не вдалося визначити співрозмовника."})
        return;
    };

    setActiveChat({
      chatId: chat.id,
      lotId: chat.lotId,
      lotName: chat.lotName,
      lotImage: chat.lotImage,
      otherParticipant: {
          uid: otherUid,
          username: chat.participantInfo[otherUid]?.username || 'Співрозмовник'
      }
    });
  }

  const closeChat = () => {
    setActiveChat(null);
  };

  return (
    <ChatContext.Provider value={{ activeChat, startChatFromLot, openChatFromList, closeChat, isStarting }}>
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

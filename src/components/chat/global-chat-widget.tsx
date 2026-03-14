
'use client';

import React from 'react';
import { useChat } from '@/context/chat-context';
import { ChatWidget } from './chat-widget';

/**
 * This component acts as the global entry point for rendering the active chat.
 * It listens to the ChatContext and renders the ChatWidget when a chat becomes active.
 */
export function GlobalChatWidget() {
  const { activeChat, closeChat } = useChat();

  if (!activeChat) {
    return null;
  }

  // --- MODIFICATION ---
  // The new ChatWidget is self-contained. We only need to provide it with the chatId
  // and a way to close it. It will handle fetching all its own data.
  return (
    <ChatWidget
      chatId={activeChat.chatId}
      onClose={closeChat}
    />
  );
}

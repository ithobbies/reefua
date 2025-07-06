
'use client';

import React from 'react';
import { useChat } from '@/context/chat-context';
import { ChatWidget } from './chat-widget';

export function GlobalChatWidget() {
  const { activeChat, closeChat } = useChat();

  if (!activeChat) {
    return null;
  }

  return (
    <ChatWidget
      chatId={activeChat.chatId}
      lotName={activeChat.lotName}
      lotImage={activeChat.lotImage}
      sellerName={activeChat.otherParticipant.username}
      onClose={closeChat}
    />
  );
}

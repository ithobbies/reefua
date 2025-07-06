
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Chat } from '@/functions/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function DashboardMessagesPage() {
  const { user } = useAuth();
  const { openChatFromList } = useChat();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Мої Повідомлення - Панель Продавця';
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantUids', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => doc.data() as Chat);
      setChats(fetchedChats);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenChat = (chat: Chat) => {
    const otherUid = chat.participantUids.find(uid => uid !== user?.uid);
    if (!otherUid || !chat.participantInfo[otherUid]) return;
    
    openChatFromList(chat);
  };

  if (loading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-semibold text-primary">Мої Повідомлення</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список діалогів</CardTitle>
          <CardDescription>Всі ваші розмови з покупцями та продавцями.</CardDescription>
        </CardHeader>
        <CardContent>
          {chats.length > 0 ? (
            <div className="space-y-4">
              {chats.map(chat => {
                const otherUid = chat.participantUids.find(uid => uid !== user?.uid)!;
                const otherUserInfo = chat.participantInfo[otherUid];
                const lastMessageText = chat.lastMessage?.text ? 
                    (chat.lastMessage.senderUid === user?.uid ? "Ви: " : "") + chat.lastMessage.text :
                    "Діалог почато";

                return (
                  <div 
                    key={chat.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => handleOpenChat(chat)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUserInfo?.photoURL || undefined} alt={otherUserInfo?.username} />
                      <AvatarFallback>{otherUserInfo?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold truncate">{otherUserInfo?.username}</p>
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                          {chat.updatedAt && new Date(chat.updatedAt).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{chat.lotName}</p>
                      <p className="text-sm text-muted-foreground truncate">{lastMessageText}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">У вас ще немає діалогів</h3>
              <p className="mt-2 text-sm text-muted-foreground">Почніть розмову зі сторінки лота, щоб вона з'явилась тут.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

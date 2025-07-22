
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { ChatMessage } from '@/functions/src/types';
import { Send, Loader2, X, MessageCircle, ArrowLeft } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ChatWidgetProps {
  chatId: string;
  lotName: string;
  lotImage: string;
  sellerName: string;
  onClose: () => void;
}

export function ChatWidget({ chatId, lotName, lotImage, sellerName, onClose }: ChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaWrapperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!chatId) return;
    setIsLoading(true);
    const messagesQuery = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(fetchedMessages);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      setIsLoading(false);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося завантажити повідомлення.' });
    });

    return () => unsubscribe();
  }, [chatId, toast]);

  useEffect(() => {
    if (scrollAreaWrapperRef.current) {
      const viewport = scrollAreaWrapperRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || isSending) return;

    setIsSending(true);
    try {
      const sendMessageFunction = httpsCallable(functions, 'sendMessage');
      await sendMessageFunction({ chatId, text: newMessage });
      setNewMessage('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Помилка', description: error.message || 'Не вдалося надіслати повідомлення.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="fixed z-50 flex flex-col shadow-2xl 
                   inset-0 bottom-16 rounded-none
                   md:inset-auto md:right-4 md:bottom-4 md:w-96 md:h-[500px] md:rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-secondary">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-base font-semibold">Чат з {sellerName}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 min-h-0 flex flex-col">
        {/* Sticky Lot Info Header */}
        <div className="flex items-center gap-3 p-3 border-b bg-background/95 z-10">
            <Image src={lotImage || '/placeholder.png'} alt={lotName} width={40} height={40} className="rounded-md object-cover"/>
            <p className="text-sm font-medium text-foreground truncate">{lotName}</p>
        </div>
        
        <ScrollArea className="flex-grow p-4" ref={scrollAreaWrapperRef}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderUid === user?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 px-3 rounded-lg max-w-[80%] ${msg.senderUid === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Повідомлень ще немає. Напишіть першим!</p>}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-2 border-t">
        <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
          <Input
            placeholder="Напишіть повідомлення..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending || isLoading}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isSending || isLoading || newMessage.trim() === ''}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

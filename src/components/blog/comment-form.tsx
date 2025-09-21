
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CommentFormProps {
  postId: string;
}

export default function CommentForm({ postId }: CommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) {
      return;
    }
    setIsLoading(true);

    try {
      const commentsCollectionRef = collection(db, 'blogPosts', postId, 'comments');
      await addDoc(commentsCollectionRef, {
        text: comment,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL || '/default-avatar.png',
        createdAt: serverTimestamp(),
      });
      setComment('');
      toast({
        title: 'Успіх!',
        description: 'Ваш коментар було додано.',
      });
    } catch (error) {
      console.error('Error adding comment: ', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати коментар. Спробуйте ще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-4 border rounded-lg bg-muted">
        <p className="text-muted-foreground">Будь ласка, <a href="/login" className="underline text-primary">увійдіть</a>, щоб залишити коментар.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-4">
      <Avatar>
        <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
        <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : 'U'}</AvatarFallback>
      </Avatar>
      <div className="w-full">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Напишіть свій коментар..."
          className="mb-2"
        />
        <Button type="submit" disabled={isLoading || !comment.trim()}>
          {isLoading ? 'Відправка...' : 'Відправити'}
        </Button>
      </div>
    </form>
  );
}

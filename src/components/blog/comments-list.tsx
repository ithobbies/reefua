
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: Timestamp;
}

interface CommentsListProps {
  postId: string;
}

export default function CommentsList({ postId }: CommentsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const commentsQuery = query(
      collection(db, 'blogPosts', postId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, 
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Comment));
        setComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching comments: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postId]);

  const handleDelete = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'blogPosts', postId, 'comments', commentId));
      toast({ description: "Коментар видалено." });
    } catch (error) {
      toast({ description: "Не вдалося видалити коментар.", variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Завантаження коментарів...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.length > 0 ? (
        comments.map(comment => (
          <div key={comment.id} className="flex items-start space-x-4">
            <Avatar>
              <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
              <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString('uk-UA') : ''}
                  </span>
                </div>
                {user && user.uid === comment.authorId && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(comment.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <p className="text-sm mt-1">{comment.text}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-4">Ще немає коментарів. Будьте першим!</p>
      )}
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface LeaveReviewDialogProps {
  lotId: string;
  lotName: string;
  onReviewSubmitted: () => void;
  children: React.ReactNode;
}

export function LeaveReviewDialog({ lotId, lotName, onReviewSubmitted, children }: LeaveReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleReviewSubmit = async () => {
    if (rating === 0) {
      toast({ variant: 'destructive', title: 'Помилка', description: 'Будь ласка, виберіть рейтинг.' });
      return;
    }
    if (comment.trim() === '') {
      toast({ variant: 'destructive', title: 'Помилка', description: 'Будь ласка, залиште коментар.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const leaveReviewFunction = httpsCallable(functions, 'leaveReview');
      await leaveReviewFunction({ lotId, rating, comment });
      
      toast({ title: 'Дякуємо!', description: 'Ваш відгук було успішно надіслано.' });
      onReviewSubmitted();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error leaving review:", error);
      const errorMessage = error.message || "Сталася невідома помилка.";
      toast({ variant: "destructive", title: "Помилка відгуку", description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Залишити відгук для "{lotName}"</DialogTitle>
          <DialogDescription>
            Оцініть вашу покупку та залиште коментар для продавця. Ваш відгук допоможе іншим покупцям.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rating">Рейтинг</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="comment">Коментар</Label>
            <Textarea
              id="comment"
              placeholder="Розкажіть про ваші враження від угоди..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Скасувати</Button>
          </DialogClose>
          <Button onClick={handleReviewSubmit} disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Надіслати відгук
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Відгуки - Панель Продавця',
  description: 'Переглядайте відгуки покупців про ваші товари та сервіс.',
};

const mockReviews = [
  { id: 1, user: 'AquaFan', avatar: 'https://placehold.co/40x40.png', rating: 5, comment: 'Чудовий корал, все як в описі! Швидка доставка.', date: '2024-07-15', lotName: 'Acropora "Strawberry Shortcake"' },
  { id: 2, user: 'CoralLover', avatar: 'https://placehold.co/40x40.png', rating: 4, comment: 'Фраг трохи менший, ніж очікував, але здоровий. Дякую.', date: '2024-07-12', lotName: 'Зоантус "Rasta"' },
  { id: 3, user: 'ReefKeeper', avatar: 'https://placehold.co/40x40.png', rating: 5, comment: 'Продавець супер! Рекомендую!', date: '2024-07-10', lotName: 'Goniopora "Red"' },
];

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted stroke-muted-foreground'}`} />
    ))}
  </div>
);


export default function DashboardReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headline font-semibold text-primary">Відгуки Покупців</h1>
      <Card>
        <CardHeader>
          <CardTitle>Останні відгуки</CardTitle>
          <CardDescription>Що говорять покупці про ваші лоти.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mockReviews.map(review => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.avatar} alt={review.user} data-ai-hint="avatar person" />
                  <AvatarFallback>{review.user.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{review.user}</h4>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="my-1">
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Лот: <span className="font-medium text-primary">{review.lotName}</span></p>
                  <p className="text-sm">{review.comment}</p>
                </div>
              </div>
            </Card>
          ))}
          {mockReviews.length === 0 && (
            <p className="text-muted-foreground text-center py-4">У вас ще немає відгуків.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

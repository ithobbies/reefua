import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Налаштування - Панель Продавця',
  description: 'Керуйте налаштуваннями вашого профілю продавця та магазину.',
};

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headline font-semibold text-primary">Налаштування Продавця</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Інформація про магазин</CardTitle>
          <CardDescription>Назва вашого магазину, опис та контактна інформація.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shopName">Назва магазину</Label>
            <Input id="shopName" defaultValue="Мій Рифовий Куточок" />
          </div>
          <div>
            <Label htmlFor="shopDescription">Опис магазину</Label>
            <Textarea id="shopDescription" defaultValue="Продаж якісних фрагів коралів та морських мешканців." />
          </div>
          <div>
            <Label htmlFor="contactEmail">Контактний Email</Label>
            <Input id="contactEmail" type="email" defaultValue="seller@example.com" />
          </div>
           <div>
            <Label htmlFor="contactPhone">Контактний телефон</Label>
            <Input id="contactPhone" type="tel" defaultValue="+380501234567" />
          </div>
          <Button>Зберегти інформацію</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Налаштування сповіщень</CardTitle>
          <CardDescription>Оберіть, які сповіщення ви бажаєте отримувати.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="newBidNotification" className="flex flex-col gap-1">
              <span>Нова ставка на ваш лот</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Отримувати сповіщення, коли хтось робить ставку.
              </span>
            </Label>
            <Switch id="newBidNotification" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="lotSoldNotification" className="flex flex-col gap-1">
              <span>Лот продано</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Сповіщення, коли ваш лот успішно продано.
              </span>
            </Label>
            <Switch id="lotSoldNotification" defaultChecked />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="newMessageNotification" className="flex flex-col gap-1">
              <span>Нове повідомлення від покупця</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Сповіщення про нові запитання або повідомлення.
              </span>
            </Label>
            <Switch id="newMessageNotification" />
          </div>
          <Button>Зберегти налаштування сповіщень</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Платіжні налаштування</CardTitle>
          <CardDescription>Налаштуйте способи отримання платежів (у розробці).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Цей розділ знаходиться у розробці. Незабаром ви зможете підключити LiqPay, Fondy та інші платіжні системи.</p>
        </CardContent>
      </Card>
    </div>
  );
}


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Gavel, ShoppingCart } from 'lucide-react';

const rulesSections = [
  {
    icon: <Gavel className="h-6 w-6 text-primary" />,
    title: 'Правила для Продавців',
    rules: [
      '**Чесність та точність:** Опис лота має бути максимально точним і правдивим. Всі фотографії повинні відображати реальний стан товару.',
      '**Якість товару:** Усі живі організми мають бути здоровими на момент продажу. Продавець несе відповідальність за належне пакування.',
      '**Терміни відправки:** Продавець зобов\'язаний відправити лот переможцю протягом 3 робочих днів після отримання оплати.',
      '**Комунікація:** Будьте на зв\'язку з покупцем та відповідайте на його питання щодо лота та доставки.',
    ],
  },
  {
    icon: <ShoppingCart className="h-6 w-6 text-primary" />,
    title: 'Правила для Покупців',
    rules: [
      '**Відповідальність за ставку:** Кожна зроблена вами ставка є зобов\'язанням викупити лот у разі вашої перемоги.',
      '**Терміни оплати:** Покупець зобов\'язаний оплатити виграний лот протягом 2 робочих днів після завершення аукціону.',
      '**Отримання товару:** Уважно оглядайте товар при отриманні. У разі виникнення проблем негайно зв\'яжіться з продавцем та адміністрацією сайту.',
      '**Заборона "снайпінгу":** Системою передбачено автоматичне продовження аукціону на 5 хвилин, якщо ставка зроблена в останню хвилину.',
    ],
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: 'Загальні правила спільноти',
    rules: [
      '**Взаємоповага:** Заборонені образи, нецензурна лексика та будь-які прояви агресії у бік інших учасників спільноти.',
      '**Чесна конкуренція:** Заборонено штучно завищувати ціни на власні лоти за допомогою інших акаунтів.',
      '**Вирішення суперечок:** Усі спірні ситуації вирішуються через приватні повідомлення. Якщо згоди не досягнуто, звертайтесь до адміністрації сайту.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Правила та Умови Користування</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Дотримання цих правил є запорукою здорової та чесної атмосфери на нашому аукціоні.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rulesSections.map((section, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
              {section.icon}
              <div>
                <CardTitle className="text-xl font-headline">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {section.rules.map((rule, ruleIndex) => (
                  <li key={ruleIndex} className="text-sm text-foreground/80 flex items-start">
                    <span className="mr-2 mt-1 text-primary">◆</span>
                    <p dangerouslySetInnerHTML={{ __html: rule.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground/90">$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12 text-sm text-muted-foreground">
            <p>Незнання правил не звільняє від відповідальності. Адміністрація залишає за собою право блокувати акаунти порушників.</p>
            <p>Дякуємо за вашу участь та бажаємо вдалих торгів!</p>
        </div>
    </div>
  );
}

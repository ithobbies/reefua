
import { mockLots, type Lot, type Bid } from '@/lib/mock-data';
import PhotoSlider from '@/components/lots/photo-slider';
import ParameterItem from '@/components/lots/parameter-item';
import CountdownBadge from '@/components/ui/countdown-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Zap, Droplets, ShieldAlert, Info, UserCircle, CalendarDays, Tag, AlignLeft, Trophy } from 'lucide-react'; // Added AlignLeft for description and Trophy for winner
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface LotDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: LotDetailPageProps): Promise<Metadata> {
  const lot = mockLots.find(l => l.id === params.id);
  if (!lot) {
    return {
      title: 'Лот не знайдено - ReefUA',
    }
  }
  return {
    title: `${lot.name} - ReefUA`,
    description: lot.description || `Деталі аукціону для ${lot.name}. Поточна ставка: ${lot.currentBid} грн.`, // Use actual description
  };
}


export default function LotDetailPage({ params }: LotDetailPageProps) {
  const lot = mockLots.find(l => l.id === params.id);

  if (!lot) {
    notFound();
  }

  const { name, images, parameters, currentBid, buyNowPrice, endTime, seller, bidHistory, description } = lot; // Added description
  const dataAiHintsForSlider = lot.images.map((_, idx) => lot.dataAiHint ? `${lot.dataAiHint} ${idx+1}` : `coral detail ${idx+1}`);

  const isAuctionActive = new Date(endTime) > new Date();
  let winnerNickname: string | null = null;

  if (!isAuctionActive && bidHistory.length > 0) {
    // Assuming bidHistory is sorted with the highest/latest bid first
    winnerNickname = bidHistory[0].user;
  }


  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8"> {/* Added space-y-8 */}
          <PhotoSlider images={images} altText={name} dataAiHints={dataAiHintsForSlider}/>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{name}</CardTitle>
              <CardDescription>Продавець: <span className="text-primary font-medium">{seller}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold mb-2 font-headline">Параметри утримання:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ParameterItem label="Солоність" value={parameters.salinity} icon={<Droplets className="h-5 w-5" />} />
                <ParameterItem label="PAR" value={parameters.par} icon={<Zap className="h-5 w-5" />} />
                <ParameterItem label="Течія" value={parameters.flow} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 20.5C19.2 19.2 20 17.2 20 15.2C20 11.2 16.4 8 12 8C7.6 8 4 11.2 4 15.2C4 17.2 4.84 19.2 6.5 20.5"/><path d="M12 4V8"/><path d="M12 15V20"/><path d="M16 5L14 7"/><path d="M8 5L10 7"/><path d="M19 10L17 11"/><path d="M5 10L7 11"/></svg>} />
              </div>
              <Badge variant="destructive" className="mt-6 p-3 text-sm w-full justify-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                Без гарантії живого товару при доставці поштою.
              </Badge>
            </CardContent>
          </Card>

          {description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center">
                  <AlignLeft className="mr-2 h-5 w-5 text-primary" />
                  Опис від продавця
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{description}</p>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Ставки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Поточна/Фінальна ставка:</p>
                <p className="text-4xl font-bold text-primary semibold">{currentBid} грн</p>
              </div>
              
              <CountdownBadge endTime={endTime} />

              {isAuctionActive ? (
                <>
                  {buyNowPrice && (
                    <div>
                      <p className="text-sm text-muted-foreground">Або купити зараз за:</p>
                      <p className="text-2xl font-semibold text-accent">{buyNowPrice} грн</p>
                    </div>
                  )}
                  <form className="space-y-3">
                    <Input type="number" placeholder={`Ваша ставка (мін. ${currentBid + 10})`} aria-label="Сума ставки" className="text-base" />
                    <Button type="submit" className="w-full text-lg py-3">Зробити ставку</Button>
                    {buyNowPrice && (
                      <Button type="button" variant="outline" className="w-full text-lg py-3 border-accent text-accent hover:bg-accent/10">
                        <Tag className="mr-2 h-5 w-5" /> Купити зараз
                      </Button>
                    )}
                  </form>
                  <div className="text-xs text-muted-foreground">
                    <Info className="inline h-3 w-3 mr-1" />
                    Ви можете встановити максимальну ставку (проксі-бід), система автоматично підніматиме її за вас.
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  {winnerNickname ? (
                    <>
                      <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                      <p className="text-lg font-semibold">Переможець:</p>
                      <p className="text-xl text-primary font-bold">{winnerNickname}</p>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground">Аукціон завершено. Переможця не визначено (не було ставок).</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-headline">Історія ставок</CardTitle>
            </CardHeader>
            <CardContent>
              {bidHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><UserCircle className="inline h-4 w-4 mr-1"/>Учасник</TableHead>
                      <TableHead><Tag className="inline h-4 w-4 mr-1"/>Ставка</TableHead>
                      <TableHead><CalendarDays className="inline h-4 w-4 mr-1"/>Час</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bidHistory.map((bid, index) => (
                      <TableRow key={index}>
                        <TableCell>{bid.user}</TableCell>
                        <TableCell className="font-semibold">{bid.amount} грн</TableCell>
                        <TableCell>{new Date(bid.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Ще ніхто не зробив ставку. Будьте першим!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return mockLots.map((lot) => ({
    id: lot.id,
  }));
}

    

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import CountdownBadge from "@/components/ui/countdown-badge";
import Link from "next/link";

interface ListingPreview {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string;
  endDate?: Date;
  bids?: number;
  stock?: number;
}

interface ActiveListingsWidgetProps {
    auctions: ListingPreview[];
    fixedPriceItems: ListingPreview[];
}

function AuctionItem({ item }: { item: ListingPreview }) {
    return (
        <Link href={`/lot/${item.id}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Image src={item.imageUrl || '/placeholder.png'} alt={item.name} width={64} height={64} className="rounded-md object-cover h-16 w-16 border" />
            <div className="grid gap-1 flex-1">
                <p className="text-sm font-medium leading-tight">{item.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Поточна ставка: <span className="font-bold text-primary">{item.price}</span> ({item.bids} ставок)</span>
                    {item.endDate && <CountdownBadge endTime={item.endDate} />}
                </div>
            </div>
        </Link>
    )
}

function FixedPriceItem({ item }: { item: ListingPreview }) {
    return (
        <Link href={`/lot/${item.id}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Image src={item.imageUrl || '/placeholder.png'} alt={item.name} width={64} height={64} className="rounded-md object-cover h-16 w-16 border" />
            <div className="grid gap-1 flex-1">
                <p className="text-sm font-medium leading-tight">{item.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-bold text-primary">{item.price}</span>
                    <Badge variant="outline">На складі: {item.stock} шт.</Badge>
                </div>
            </div>
        </Link>
    )
}

export function ActiveListingsWidget({ auctions, fixedPriceItems }: ActiveListingsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Товари у продажу</CardTitle>
        <CardDescription>
          Огляд ваших активних аукціонів та товарів з фіксованою ціною.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="auctions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auctions">Аукціони ({auctions.length})</TabsTrigger>
            <TabsTrigger value="fixedPrice">Фікс. ціна ({fixedPriceItems.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="auctions" className="mt-4">
            {auctions.length > 0 ? (
                <div className="space-y-2">
                    {auctions.map(item => <AuctionItem key={item.id} item={item} />)}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">У вас немає активних аукціонів.</p>
            )}
          </TabsContent>
          <TabsContent value="fixedPrice" className="mt-4">
             {fixedPriceItems.length > 0 ? (
                <div className="space-y-2">
                    {fixedPriceItems.map(item => <FixedPriceItem key={item.id} item={item} />)}
                </div>
             ) : (
                <p className="text-sm text-muted-foreground text-center py-4">У вас немає товарів з фіксованою ціною.</p>
             )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

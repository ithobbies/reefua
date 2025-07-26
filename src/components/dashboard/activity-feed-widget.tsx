"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'bid' | 'sale';
  item: string;
  value: string;
  user: string;
  timestamp: Date;
}

interface ActivityFeedWidgetProps {
    activities: ActivityItem[];
}

const activityTypeMap = {
    bid: { title: "Нова ставка", color: "default" as const },
    sale: { title: "Продаж", color: "destructive" as const },
}

export function ActivityFeedWidget({ activities }: ActivityFeedWidgetProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Остання активність</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                            {/* In a real app, you would have user avatar URLs */}
                            <AvatarFallback>{activity.user ? activity.user.charAt(0) : 'R'}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none">
                                <Badge variant={activityTypeMap[activity.type].color}>{activityTypeMap[activity.type].title}</Badge>
                                <span className="ml-2 font-normal">{activity.item}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {activity.value} від {activity.user}
                                <span className="text-xs ml-2">
                                    ({formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: uk })})
                                </span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Останньої активності не знайдено.</p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface SalesChartWidgetProps {
  data: { date: string; revenue: number }[];
}

const chartConfig = {
  revenue: {
    label: "Дохід",
    color: "hsl(var(--chart-1))",
  },
}

export function SalesChartWidget({ data }: SalesChartWidgetProps) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Аналітика продажів</CardTitle>
        <CardDescription>Дохід за останні 7 днів</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
                accessibilityLayer
                data={data}
                margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("uk-UA", { weekday: 'short' })}
                />
                <YAxis
                    tickFormatter={(value) => `${value / 1000}k`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        labelFormatter={(value) => new Date(value).toLocaleDateString("uk-UA")}
                        formatter={(value) => `${Number(value).toLocaleString('uk-UA')} ₴`} 
                    />}
                />
                <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={4}
                />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

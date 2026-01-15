"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const chartConfig = {
  amount: { label: "Gasto", color: "hsl(var(--chart-1))" },
  flight: { label: "Voos", color: "hsl(var(--chart-1))" },
  hotel: { label: "Hotéis", color: "hsl(var(--chart-2))" },
  car: { label: "Carros", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export default function OverviewCharts({ data }: { data: any }) {
  // Cores dinâmicas para o PieChart baseadas no config
  const pieData = data.categoryStats.map((item: any) => ({
    ...item,
    fill: chartConfig[item.category as keyof typeof chartConfig]?.color || "gray"
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
          <CardDescription>Distribuição de custos aprovados</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={pieData} dataKey="amount" nameKey="label" innerRadius={60} strokeWidth={5} />
              <ChartLegend content={<ChartLegendContent nameKey="label" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Mensal</CardTitle>
          <CardDescription>Evolução dos gastos corporativos</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={data.monthlyHistory}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickFormatter={(value) => `R$${value}`} hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-amount)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
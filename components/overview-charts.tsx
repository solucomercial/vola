"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

export default function OverviewCharts({ data }: { data: any }) {
  const categoryData = [
    { name: "Voos", value: data.spendByCategory.flight, fill: "var(--color-chart-1)" },
    { name: "Hoteis", value: data.spendByCategory.hotel, fill: "var(--color-chart-2)" },
    { name: "Carros", value: data.spendByCategory.car, fill: "var(--color-chart-3)" },
  ].filter((d) => d.value > 0)

  const chartConfig = {
    spend: { label: "Gasto", color: "var(--color-chart-1)" },
    flight: { label: "Voos", color: "var(--color-chart-1)" },
    hotel: { label: "Hoteis", color: "var(--color-chart-2)" },
    car: { label: "Carros", color: "var(--color-chart-3)" },
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Gastos Mensais</CardTitle>
          <CardDescription>Despesas de viagem nos últimos 5 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlySpend}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `R$${v}`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="spend" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
          <CardDescription>Distribuição das despesas aprovadas</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
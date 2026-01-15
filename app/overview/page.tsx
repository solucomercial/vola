"use client"

import { useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { RequestTypeIcon } from "@/components/request-type-icon"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { format, parseISO } from "date-fns"
import { TrendingUp, TrendingDown, DollarSign, MapPin, Plane, Building2, Car, FileText } from "lucide-react"

export default function OverviewPage() {
  const { requests } = useApp()

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRequests = requests.length
    const approvedRequests = requests.filter((r) => r.status === "approved")
    const rejectedRequests = requests.filter((r) => r.status === "rejected")
    const pendingRequests = requests.filter((r) => r.status === "pending")

    const totalApprovedCost = approvedRequests.reduce((sum, r) => sum + r.selectedOption.price, 0)
    const averageCostPerTrip = approvedRequests.length > 0 ? totalApprovedCost / approvedRequests.length : 0

    // Most common destination
    const destinationCounts = requests.reduce(
      (acc, r) => {
        const dest = r.destination.split("(")[0].trim() // Remove airport codes
        acc[dest] = (acc[dest] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const mostCommonDestination = Object.entries(destinationCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

    // Spend by category
    const spendByCategory = {
      flight: approvedRequests.filter((r) => r.type === "flight").reduce((sum, r) => sum + r.selectedOption.price, 0),
      hotel: approvedRequests.filter((r) => r.type === "hotel").reduce((sum, r) => sum + r.selectedOption.price, 0),
      car: approvedRequests.filter((r) => r.type === "car").reduce((sum, r) => sum + r.selectedOption.price, 0),
    }

    // Monthly spend (mock data for visualization)
    const monthlySpend = [
      { month: "Set", spend: 4200 },
      { month: "Out", spend: 5800 },
      { month: "Nov", spend: 3900 },
      { month: "Dez", spend: 6200 },
      { month: "Jan", spend: totalApprovedCost || 4500 },
    ]

    return {
      totalRequests,
      approvedCount: approvedRequests.length,
      rejectedCount: rejectedRequests.length,
      pendingCount: pendingRequests.length,
      totalApprovedCost,
      averageCostPerTrip,
      mostCommonDestination,
      spendByCategory,
      monthlySpend,
      approvedRequests,
    }
  }, [requests])

  const categoryData = [
    { name: "Voos", value: metrics.spendByCategory.flight, fill: "var(--color-chart-1)" },
    { name: "Hoteis", value: metrics.spendByCategory.hotel, fill: "var(--color-chart-2)" },
    { name: "Locação de Carros", value: metrics.spendByCategory.car, fill: "var(--color-chart-3)" },
  ].filter((d) => d.value > 0)

  const chartConfig = {
    spend: {
      label: "Spend",
      color: "var(--color-chart-1)",
    },
    flight: {
      label: "Voos",
      color: "var(--color-chart-1)",
    },
    hotel: {
      label: "Hoteis",
      color: "var(--color-chart-2)",
    },
    car: {
      label: "Locação de Carros",
      color: "var(--color-chart-3)",
    },
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview & relatórios</h1>
          <p className="text-muted-foreground">Análises abrangentes para viagens corporativas</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Total de Solicitações</CardDescription>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metrics.totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Aprovado</CardDescription>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{metrics.approvedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalRequests > 0
                  ? `${((metrics.approvedCount / metrics.totalRequests) * 100).toFixed(0)}% approval rate`
                  : "No requests"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Rejeitado</CardDescription>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{metrics.rejectedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Requer revisão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Pendente</CardDescription>
              <FileText className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{metrics.pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Total de Custos Aprovados</CardDescription>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                R$ {metrics.totalApprovedCost.toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Para {metrics.approvedCount} solicitações aprovadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Custo médio por viagem</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                R$ {metrics.averageCostPerTrip.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Por solicitação aprovada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Top Destino</CardDescription>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground truncate">{metrics.mostCommonDestination}</div>
              <p className="text-xs text-muted-foreground mt-1">Local mais solicitado</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Spend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos Mensais</CardTitle>
              <CardDescription>Despesas de viagem nos últimos 5 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthlySpend}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tickMargin={8} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(value) => `R$${value / 1000}k`}
                      tickMargin={8}
                    />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, " Gasto"]}
                    />
                    <Bar dataKey="spend" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
              <CardDescription>Distribuição das despesas de viagem aprovadas</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Total"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhuma despesa aprovada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Voos</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {metrics.spendByCategory.flight.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                  <Building2 className="h-6 w-6 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hoteis</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {metrics.spendByCategory.hotel.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                  <Car className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Locação de Carro</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {metrics.spendByCategory.car.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approvals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Aprovações Recentes</CardTitle>
            <CardDescription>Últimas solicitações de viagem aprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.approvedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhuma solicitação aprovada ainda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.approvedRequests.slice(0, 10).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RequestTypeIcon type={request.type} className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{request.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{request.userName}</TableCell>
                        <TableCell>{request.destination}</TableCell>
                        <TableCell>R$ {request.selectedOption.price.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(request.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

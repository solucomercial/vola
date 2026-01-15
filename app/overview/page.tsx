import { db } from "@/db"
import { travelRequests } from "@/db/schema"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { RequestTypeIcon } from "@/components/request-type-icon"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { TrendingUp, TrendingDown, DollarSign, MapPin, Plane, Building2, Car, FileText, Clock, Wallet } from "lucide-react"
import dynamic from "next/dynamic"

// Importação dinâmica do componente de gráficos (Client Component)
const OverviewCharts = dynamic(() => import("@/components/overview-charts"), { ssr: false })

export default async function OverviewPage() {
  const allRequests = await db.select().from(travelRequests)

  // Cálculos de Métricas no Servidor
  const totalRequests = allRequests.length
  const approvedRequests = allRequests.filter((r) => r.status === "approved")
  const rejectedRequests = allRequests.filter((r) => r.status === "rejected")
  const pendingRequests = allRequests.filter((r) => r.status === "pending")

  const totalApprovedCost = approvedRequests.reduce((sum, r) => sum + (Number((r.selectedOption as any).price) || 0), 0)
  const averageCostPerTrip = approvedRequests.length > 0 ? totalApprovedCost / approvedRequests.length : 0

  // Destinos mais comuns
  const destinationCounts = allRequests.reduce((acc, r) => {
    const dest = r.destination.split("(")[0].trim()
    acc[dest] = (acc[dest] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const mostCommonDestination = Object.entries(destinationCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

  // Gastos por Categoria
  const spendByCategory = {
    flight: approvedRequests.filter((r) => r.type === "flight").reduce((sum, r) => sum + (Number((r.selectedOption as any).price) || 0), 0),
    hotel: approvedRequests.filter((r) => r.type === "hotel").reduce((sum, r) => sum + (Number((r.selectedOption as any).price) || 0), 0),
    car: approvedRequests.filter((r) => r.type === "car").reduce((sum, r) => sum + (Number((r.selectedOption as any).price) || 0), 0),
  }

  // Dados para os gráficos
  const chartData = {
    spendByCategory,
    monthlySpend: [
      { month: "Set", spend: 4200 },
      { month: "Out", spend: 5800 },
      { month: "Nov", spend: 3900 },
      { month: "Dez", spend: 6200 },
      { month: "Jan", spend: totalApprovedCost || 4500 },
    ]
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview & relatórios</h1>
          <p className="text-muted-foreground">Análises abrangentes para viagens corporativas</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Total de Solicitações</CardDescription>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Aprovado</CardDescription>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Pedidos concluídos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Rejeitado</CardDescription>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{rejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Requer atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Pendente</CardDescription>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando análise</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Total de Custos Aprovados</CardDescription>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {totalApprovedCost.toLocaleString("pt-BR")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Custo médio / viagem</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {averageCostPerTrip.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Top Destino</CardDescription>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{mostCommonDestination}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Injetados Aqui */}
        <OverviewCharts data={chartData} />

        <Card>
          <CardHeader>
            <CardTitle>Aprovações Recentes</CardTitle>
            <CardDescription>Últimas solicitações de viagem aprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedRequests.length === 0 ? (
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
                    {approvedRequests.slice(0, 10).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RequestTypeIcon type={request.type} className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{request.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{request.userName}</TableCell>
                        <TableCell>{request.destination}</TableCell>
                        <TableCell>R$ {(request.selectedOption as any).price.toLocaleString("pt-BR")}</TableCell>
                        <TableCell><StatusBadge status={request.status} /></TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.createdAt), "MMM d, yyyy")}
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
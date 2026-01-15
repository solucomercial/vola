import { db } from "@/db"
import { travelRequests } from "@/db/schema"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, TrendingDown, Clock, Wallet, MapPin } from "lucide-react"
import OverviewCharts from "@/components/overview-charts" // Importação direta corrigida

export default async function OverviewPage() {
  const allRequests = await db.select().from(travelRequests)

  const approvedRequests = allRequests.filter((r) => r.status === "approved")
  
  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending").length,
    approved: approvedRequests.length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
    totalCost: approvedRequests.reduce((acc, curr: any) => acc + (Number(curr.selectedOption.price) || 0), 0)
  }

  // Preparação de dados mais limpa para o componente Client
  const chartData = {
    categoryStats: [
      { category: "flight", label: "Voos", amount: approvedRequests.filter(r => r.type === "flight").reduce((acc, curr: any) => acc + (Number(curr.selectedOption.price) || 0), 0) },
      { category: "hotel", label: "Hotéis", amount: approvedRequests.filter(r => r.type === "hotel").reduce((acc, curr: any) => acc + (Number(curr.selectedOption.price) || 0), 0) },
      { category: "car", label: "Carros", amount: approvedRequests.filter(r => r.type === "car").reduce((acc, curr: any) => acc + (Number(curr.selectedOption.price) || 0), 0) },
    ],
    // Mock de histórico (pode ser expandido conforme o banco cresce)
    monthlyHistory: [
      { month: "Janeiro", total: stats.totalCost }
    ]
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral</h1>
          <p className="text-muted-foreground">Métricas consolidadas do banco de dados</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Custo Aprovado</CardDescription>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                R$ {stats.totalCost.toLocaleString("pt-BR")}
              </div>
            </CardContent>
          </Card>
        </div>

        <OverviewCharts data={chartData} />
      </div>
    </DashboardLayout>
  )
}
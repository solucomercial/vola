"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { formatDistanceToNow } from "date-fns"
import { FileText, TrendingUp, TrendingDown, Clock, Wallet, MapPin, Users, Filter, X, ArrowUpDown } from "lucide-react"

interface TravelRequest {
  id: string
  userId: string
  userName: string
  type: "flight" | "hotel" | "car"
  destination: string
  origin?: string | null
  departureDate: Date | string
  returnDate: Date | string
  status: "pending" | "approved" | "rejected"
  reason: string
  selectedOption: any
  createdAt: Date | string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

const COLORS = {
  flight: "#3B82F6",
  hotel: "#10B981",
  car: "#F59E0B",
}

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
}

export function OverviewContent({ requests, users }: { requests: TravelRequest[]; users: User[] }) {
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [filterType, setFilterType] = useState<"all" | "flight" | "hotel" | "car">("all")
  const [filterUser, setFilterUser] = useState<string>("all")
  const [searchDestination, setSearchDestination] = useState("")
  const [tableFilterStatus, setTableFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [tableFilterType, setTableFilterType] = useState<"all" | "flight" | "hotel" | "car">("all")
  const [tableSearchUser, setTableSearchUser] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "cost">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Filtrar dados
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const statusMatch = filterStatus === "all" || r.status === filterStatus
      const typeMatch = filterType === "all" || r.type === filterType
      const userMatch = filterUser === "all" || r.userId === filterUser
      const destinationMatch =
        searchDestination === "" ||
        r.destination.toLowerCase().includes(searchDestination.toLowerCase())

      return statusMatch && typeMatch && userMatch && destinationMatch
    })
  }, [requests, filterStatus, filterType, filterUser, searchDestination])

  // Calcular estatísticas
  const stats = useMemo(() => {
    const approved = filteredRequests.filter((r) => r.status === "approved")
    const pending = filteredRequests.filter((r) => r.status === "pending")
    const rejected = filteredRequests.filter((r) => r.status === "rejected")

    const totalCost = approved.reduce((acc, curr) => acc + (Number(curr.selectedOption?.price) || 0), 0)
    const avgCost = approved.length > 0 ? totalCost / approved.length : 0

    const allCost = filteredRequests.reduce((acc, curr) => acc + (Number(curr.selectedOption?.price) || 0), 0)

    return {
      total: filteredRequests.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      totalCost,
      avgCost,
      allCost,
    }
  }, [filteredRequests])

  // Dados para gráficos
  const categoryData = useMemo(() => {
    const approved = filteredRequests.filter((r) => r.status === "approved")
    return [
      {
        name: "Voos",
        value: approved
          .filter((r) => r.type === "flight")
          .reduce((acc, curr) => acc + (Number(curr.selectedOption?.price) || 0), 0),
      },
      {
        name: "Hotéis",
        value: approved
          .filter((r) => r.type === "hotel")
          .reduce((acc, curr) => acc + (Number(curr.selectedOption?.price) || 0), 0),
      },
      {
        name: "Carros",
        value: approved
          .filter((r) => r.type === "car")
          .reduce((acc, curr) => acc + (Number(curr.selectedOption?.price) || 0), 0),
      },
    ].filter((item) => item.value > 0)
  }, [filteredRequests])

  const statusData = useMemo(() => {
    return [
      { name: "Pendente", value: stats.pending },
      { name: "Aprovado", value: stats.approved },
      { name: "Rejeitado", value: stats.rejected },
    ].filter((item) => item.value > 0)
  }, [stats])

  const monthlyData = useMemo(() => {
    const approved = filteredRequests.filter((r) => r.status === "approved")
    const months: { [key: string]: number } = {}

    approved.forEach((r) => {
      const date = new Date(r.createdAt)
      const monthKey = date.toLocaleString("pt-BR", { month: "short", year: "numeric" })
      months[monthKey] = (months[monthKey] || 0) + (Number(r.selectedOption?.price) || 0)
    })

    return Object.entries(months)
      .map(([month, total]) => ({ month, total }))
      .slice(0, 12)
  }, [filteredRequests])

  // Filtros da tabela
  const tableFilteredRequests = useMemo(() => {
    let data = filteredRequests

    if (tableFilterStatus !== "all") {
      data = data.filter((r) => r.status === tableFilterStatus)
    }

    if (tableFilterType !== "all") {
      data = data.filter((r) => r.type === tableFilterType)
    }

    if (tableSearchUser) {
      data = data.filter((r) =>
        r.userName.toLowerCase().includes(tableSearchUser.toLowerCase())
      )
    }

    // Ordenação
    data.sort((a, b) => {
      let comparison = 0
      if (sortBy === "date") {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "cost") {
        comparison =
          (Number(b.selectedOption?.price) || 0) - (Number(a.selectedOption?.price) || 0)
      }
      return sortOrder === "desc" ? comparison : -comparison
    })

    return data
  }, [filteredRequests, tableFilterStatus, tableFilterType, tableSearchUser, sortBy, sortOrder])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground">Análise completa de solicitações de viagem</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="flight">Voos</SelectItem>
                  <SelectItem value="hotel">Hotéis</SelectItem>
                  <SelectItem value="car">Carros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destino</Label>
              <Input
                placeholder="Pesquisar destino..."
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
              />
            </div>
          </div>

          {(filterStatus !== "all" ||
            filterType !== "all" ||
            filterUser !== "all" ||
            searchDestination) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterStatus("all")
                setFilterType("all")
                setFilterUser("all")
                setSearchDestination("")
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total</CardDescription>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Solicitações filtradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Pendente</CardDescription>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Aprovado</CardDescription>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Viagens confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Rejeitado</CardDescription>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Não aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Custos */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Custo Total (Aprovadas)</CardDescription>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {stats.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{stats.approved} viagens aprovadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Custo Médio (Aprovadas)</CardDescription>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.avgCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Por solicitação</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Pizza - Categorias */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>Gastos aprovados por tipo de serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: R$${(value / 1000).toFixed(1)}k`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      `R$ ${(value as number).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Pizza - Status */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Quantidade de solicitações por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => {
                      const statusColors: { [key: string]: string } = {
                        "Pendente": "#F59E0B",
                        "Aprovado": "#10B981",
                        "Rejeitado": "#EF4444",
                      }
                      return <Cell key={`status-${index}`} fill={statusColors[entry.name] || CHART_COLORS[index]} />
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico de Barras - Histórico Mensal */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico Mensal de Gastos</CardTitle>
            <CardDescription>Evolução dos custos aprovados por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis
                  tickFormatter={(value) =>
                    `R$${(value / 1000).toFixed(0)}k`
                  }
                  stroke="#6B7280"
                />
                <Tooltip
                  formatter={(value) =>
                    `R$ ${(value as number).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  }
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações Detalhadas</CardTitle>
          <CardDescription>
            Mostrando {tableFilteredRequests.length} de {requests.length} solicitações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros da Tabela */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border-b pb-4">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={tableFilterStatus} onValueChange={(v: any) => setTableFilterStatus(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={tableFilterType} onValueChange={(v: any) => setTableFilterType(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="flight">Voos</SelectItem>
                  <SelectItem value="hotel">Hotéis</SelectItem>
                  <SelectItem value="car">Carros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Usuário</Label>
              <Input
                placeholder="Buscar usuário..."
                className="h-8 text-sm"
                value={tableSearchUser}
                onChange={(e) => setTableSearchUser(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Ordenar</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="cost">Custo</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                >
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          {tableFilteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableFilteredRequests.slice(0, 10).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.userName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {request.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.type === "flight"
                            ? "✈️ Voo"
                            : request.type === "hotel"
                              ? "🏨 Hotel"
                              : "🚗 Carro"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`capitalize ${
                            STATUS_COLORS[request.status]
                          }`}
                          variant="secondary"
                        >
                          {request.status === "pending"
                            ? "⏳ Pendente"
                            : request.status === "approved"
                              ? "✓ Aprovado"
                              : "✗ Rejeitado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        R${" "}
                        {(Number(request.selectedOption?.price) || 0).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tableFilteredRequests.length > 10 && (
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Mostrando 10 de {tableFilteredRequests.length} solicitações
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

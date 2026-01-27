"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ShoppingCart } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { getApprovedRequestsAction } from "@/app/actions/travel-requests"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface TravelRequest {
  id: string
  userId: string
  userName: string
  type: "flight" | "hotel" | "car"
  origin: string | null
  destination: string
  departureDate: string | Date
  returnDate: string | Date
  reason: string
  justification: string | null
  status: "pending" | "approved" | "rejected" | "purchased"
  selectedOption: any
  alternatives: any[]
  bookingUrl: string | null
  createdAt: string | Date
}

export default function PurchasePage() {
  const router = useRouter()
  const { currentUser } = useApp()
  const [requests, setRequests] = useState<TravelRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Verifica permissão de acesso
  useEffect(() => {
    if (currentUser.role !== "buyer" && currentUser.role !== "admin") {
      toast.error("Acesso Negado", {
        description: "Você não tem permissão para acessar esta página",
      })
      router.push("/dashboard")
    }
  }, [currentUser, router])

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setIsLoading(true)
    const data = await getApprovedRequestsAction()
    setRequests(data as TravelRequest[])
    setIsLoading(false)
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    return format(dateObj, "dd/MM/yyyy")
  }

  const calculateSavings = (selectedPrice: number, alternatives: any[]) => {
    const prices = alternatives.map((alt) => alt.price).filter((p) => p > 0)
    if (prices.length === 0) return 0
    const cheapest = Math.min(...prices)
    return selectedPrice > cheapest ? selectedPrice - cheapest : 0
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <ShoppingCart className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando solicitações aprovadas...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              Fila de Compras
            </h1>
            <p className="text-muted-foreground mt-1">
              Solicitações aprovadas aguardando confirmação de compra
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {requests.length} {requests.length === 1 ? "solicitação" : "solicitações"}
          </Badge>
        </div>

        {/* Lista de Solicitações em Tabela */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação aprovada</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Quando os aprovadores autorizarem viagens, elas aparecerão aqui para você efetuar a compra
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Solicitações aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">ID</TableHead>
                      <TableHead>Nome do solicitante</TableHead>
                      <TableHead>Data da solicitação</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Economia disponível</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const savings = calculateSavings(
                        request.selectedOption?.price || 0,
                        request.alternatives || []
                      )

                      return (
                        <TableRow
                          key={request.id}
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => router.push(`/purchase/${request.id}`)}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">{request.id}</TableCell>
                          <TableCell className="font-medium">{request.userName}</TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>{request.destination}</TableCell>
                          <TableCell>
                            {savings > 0 ? (
                              <span className="text-green-700 font-semibold">
                                R$ {savings.toLocaleString("pt-BR")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {request.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

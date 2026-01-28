"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { RequestTypeIcon } from "@/components/request-type-icon"
import Link from "next/link"
import { Plus, ArrowRight, Calendar, MapPin } from "lucide-react"
import { format, isAfter } from "date-fns"
import { useApp } from "@/context/app-context"
import { getUserRequestsAction, getPendingRequestsAction } from "@/app/actions/travel-requests"
import type { TravelRequest } from "@/context/app-context"

export function DashboardContent() {
  const { currentUser } = useApp()
  const [myRequests, setMyRequests] = useState<TravelRequest[]>([])
  const [pendingRequests, setPendingRequests] = useState<TravelRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return
      
      setLoading(true)
      try {
        // Buscar solicitações do usuário
        const requests = await getUserRequestsAction(currentUser.id)
        setMyRequests(requests as TravelRequest[])

        // Buscar solicitações pendentes (se for approver/admin)
        if (currentUser.role === "approver" || currentUser.role === "admin") {
          const pending = await getPendingRequestsAction()
          setPendingRequests(pending as TravelRequest[])
        } else {
          setPendingRequests([])
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser?.id, currentUser])

  // Stats para o usuário atual
  const myPending = myRequests.filter((r) => r.status === "pending").length
  const myApproved = myRequests.filter((r) => r.status === "approved").length
  const myRejected = myRequests.filter((r) => r.status === "rejected").length

  // Próximas viagens (solicitações aprovadas com datas futuras)
  const today = new Date()
  const upcomingTrips = myRequests
    .filter((r) => r.status === "approved" && isAfter(new Date(r.departureDate), today))
    .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
    .slice(0, 3)

  // Solicitações recentes
  const recentRequests = myRequests.slice(0, 5)

  const canApprove = currentUser && (currentUser.role === "approver" || currentUser.role === "admin")

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta, {currentUser?.name.split(" ")[0] || "Usuário"}</h1>
          <p className="text-muted-foreground">Aqui está uma visão geral das suas solicitações de viagem</p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Solicitações</CardDescription>
            <CardTitle className="text-3xl">{myRequests.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Seu total de solicitações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendente</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{myPending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovado</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{myApproved}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Pronto para viajar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejeitado</CardDescription>
            <CardTitle className="text-3xl text-destructive">{myRejected}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Precisa de revisão</p>
          </CardContent>
        </Card>
      </div>

      {/* Approver notice */}
      {canApprove && pendingRequests.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-bold text-primary">{pendingRequests.length}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Solicitações Aguardando Sua Aprovação</p>
                <p className="text-sm text-muted-foreground">Revise solicitações de viagem pendentes do seu time</p>
              </div>
            </div>
            <Link href="/analysis">
              <Button variant="outline">
                Revise agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Solicitações Recentes</CardTitle>
              <CardDescription>Suas últimas solicitações de viagem</CardDescription>
            </div>
            <Link href="/requests">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Ainda não há solicitações</p>
                <Link href="/requests/new" className="mt-2">
                  <Button variant="outline" size="sm">
                    Faça sua primeira solicitação
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <RequestTypeIcon type={request.type} className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{request.destination}</p>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.departureDate), "MMM d")} -{" "}
                        {format(new Date(request.returnDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      R$ {request.selectedOption.price.toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Trips */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Viagens</CardTitle>
            <CardDescription>Suas viagens aprovadas futuras</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Nenhuma viagem futura</p>
                <p className="text-sm text-muted-foreground mt-1">Solicitações aprovadas aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <RequestTypeIcon type={trip.type} className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{trip.destination}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {trip.origin}
                          </div>
                        </div>
                      </div>
                      {trip.approvalCode && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Código de Aprovação</p>
                          <p className="font-mono text-sm font-medium text-primary">{trip.approvalCode}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(trip.departureDate), "EEEE, MMMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

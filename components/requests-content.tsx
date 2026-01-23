"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { RequestTypeIcon } from "@/components/request-type-icon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Plus, Search, Calendar, MapPin, Copy, Check, Loader2, Plane, Building2, Car, Clock, Users, MapPinIcon, AlertCircle, CheckCircle, XCircle, TrendingUp, DollarSign } from "lucide-react"
import { format, parseISO } from "date-fns"
import { getUserRequestsAction } from "@/app/actions/travel-requests"
import type { RequestStatus, RequestType } from "@/context/app-context"

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
  status: "pending" | "approved" | "rejected"
  selectedOption: {
    id: string
    provider: string
    price: number
    details: string
    departureTime?: string
    arrivalTime?: string
    duration?: string
    bookingUrl?: string
    flightNumber?: string
    airplane?: string
    legroom?: string
    amenities?: string[]
    airlineLogo?: string
    departureAirport?: string
    arrivalAirport?: string
    images?: string[]
    rating?: number
    reviewsCount?: number
    locationDetails?: string
    hotelAmenities?: string[]
  }
  alternatives: Array<{
    id: string
    provider: string
    price: number
    details: string
    departureTime?: string
    arrivalTime?: string
    duration?: string
    bookingUrl?: string
    flightNumber?: string
    airplane?: string
    legroom?: string
    amenities?: string[]
    airlineLogo?: string
    departureAirport?: string
    arrivalAirport?: string
    images?: string[]
    rating?: number
    reviewsCount?: number
    locationDetails?: string
    hotelAmenities?: string[]
  }>
  bookingUrl: string | null
  createdAt: string | Date
  approvalCode: string | null
  rejectionReason: string | null
  approverId: string | null
}

export function RequestsContent() {
  const { currentUser } = useApp()
  const [myRequests, setMyRequests] = useState<TravelRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<RequestType | "all">("all")
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true)
      const requests = await getUserRequestsAction(currentUser.id)
      setMyRequests(requests as TravelRequest[])
      setIsLoading(false)
    }
    loadRequests()
  }, [currentUser.id])

  const filteredRequests = myRequests.filter((request) => {
    const matchesSearch =
      request.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesType = typeFilter === "all" || request.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return dateObj
  }

  // Calcular métricas
  const totalRequests = myRequests.length
  const approvedRequests = myRequests.filter(r => r.status === "approved").length
  const rejectedRequests = myRequests.filter(r => r.status === "rejected").length
  const pendingRequests = myRequests.filter(r => r.status === "pending").length
  const totalSpent = myRequests
    .filter(r => r.status === "approved")
    .reduce((sum, r) => sum + r.selectedOption.price, 0)
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Solicitações</h1>
            <p className="text-muted-foreground">Gerencie e acompanhe suas solicitações de viagem</p>
          </div>
          <Link href="/requests/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </Link>
        </div>

        {/* Metrics Cards */}
        {!isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Total Requests */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total de Solicitações</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{totalRequests}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approved Requests */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aprovadas</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{approvedRequests}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pendentes</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">{pendingRequests}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rejected Requests */}
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rejeitadas</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{rejectedRequests}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Spent */}
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Valor Aprovado</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">R$ {totalSpent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquise por destino, origem ou motivo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RequestStatus | "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as RequestType | "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="flight">Voo</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="car">Locação de Carro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Carregando solicitações...</p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
              {myRequests.length === 0 && (
                <Link href="/requests/new" className="mt-4">
                  <Button>Criar sua primeira solicitação</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusColorMap = {
                approved: { border: "border-l-emerald-500", bg: "from-emerald-50 to-emerald-100", text: "text-emerald-600", iconBg: "bg-emerald-100" },
                pending: { border: "border-l-amber-500", bg: "from-amber-50 to-amber-100", text: "text-amber-600", iconBg: "bg-amber-100" },
                rejected: { border: "border-l-red-500", bg: "from-red-50 to-red-100", text: "text-red-600", iconBg: "bg-red-100" },
              }
              const colors = statusColorMap[request.status as keyof typeof statusColorMap] || { border: "border-l-slate-500", bg: "from-slate-50 to-slate-100", text: "text-slate-600", iconBg: "bg-slate-100" }

              return (
                <Card
                  key={request.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-l-4 ${colors.border}`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.iconBg}`}>
                          <RequestTypeIcon type={request.type} className={`h-6 w-6 ${colors.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-lg">{request.destination}</h3>
                            <StatusBadge status={request.status} />
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="font-medium">De {request.origin || "N/A"}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-medium">
                              {format(formatDate(request.departureDate), "d MMM")} - {format(formatDate(request.returnDate), "d MMM, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:items-end">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${colors.text}`}>
                            R$ {request.selectedOption?.price?.toLocaleString("pt-BR") || "0"}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium mt-1">{request.selectedOption?.provider || "N/A"}</p>
                        </div>
                        {request.approvalCode && (
                          <div className={`rounded-lg px-3 py-2 backdrop-blur-sm ${colors.bg.split(" ")[0]} bg-gradient-to-r ${colors.bg}`}>
                            <p className={`font-mono text-xs font-bold ${colors.text}`}>{request.approvalCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Request Detail Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
            {selectedRequest && (
              <>
                {/* Header - Fixed */}
                <div className="sticky top-0 z-50 bg-gradient-to-r from-primary/5 to-primary/10 border-b px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                      <RequestTypeIcon type={selectedRequest.type} className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {selectedRequest.destination}
                        <StatusBadge status={selectedRequest.status} />
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        {selectedRequest.type === "flight" && <Plane className="h-3.5 w-3.5 inline mr-1" />}
                        {selectedRequest.type === "hotel" && <Building2 className="h-3.5 w-3.5 inline mr-1" />}
                        {selectedRequest.type === "car" && <Car className="h-3.5 w-3.5 inline mr-1" />}
                        {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)} solicitação de{" "}
                        <span className="font-semibold text-foreground">{selectedRequest.origin || "N/A"}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1 overflow-hidden">
                  <div className="space-y-6 p-6">
                    {/* Trip Details */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="bg-card rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium text-muted-foreground">Partida</p>
                        </div>
                        <p className="font-bold text-foreground">
                          {format(formatDate(selectedRequest.departureDate), "d 'de' MMMM")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(formatDate(selectedRequest.departureDate), "EEEE")}
                        </p>
                      </div>
                      <div className="bg-card rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium text-muted-foreground">Retorno</p>
                        </div>
                        <p className="font-bold text-foreground">
                          {format(formatDate(selectedRequest.returnDate), "d 'de' MMMM")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(formatDate(selectedRequest.returnDate), "EEEE")}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-secondary/30 rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">Motivo da Viagem</p>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{selectedRequest.reason}</p>
                    </div>

                    {/* Selected Option */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        Opção Selecionada
                      </h3>
                      <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-bold text-lg text-foreground">{selectedRequest.selectedOption.provider}</p>
                              <p className="text-sm text-muted-foreground mt-1">{selectedRequest.selectedOption.details}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-600">
                                R$ {selectedRequest.selectedOption?.price?.toLocaleString("pt-BR") || "0"}
                              </p>
                            </div>
                          </div>

                          {/* Flight/Trip Information */}
                          {selectedRequest.type === "flight" && selectedRequest.selectedOption.departureTime && (
                            <div className="space-y-2 pt-4 border-t">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Horário:</span>
                                <span className="font-mono bg-muted px-2 py-1 rounded text-xs font-semibold">
                                  {selectedRequest.selectedOption.departureTime} - {selectedRequest.selectedOption.arrivalTime}
                                </span>
                              </div>
                              {selectedRequest.selectedOption.duration && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Duração:</span>
                                  <span className="font-medium">{selectedRequest.selectedOption.duration}</span>
                                </div>
                              )}
                              {selectedRequest.selectedOption.flightNumber && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Voo:</span>
                                  <span className="font-mono font-bold text-lg">{selectedRequest.selectedOption.flightNumber}</span>
                                </div>
                              )}
                              {selectedRequest.selectedOption.airplane && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Aeronave:</span>
                                  <span className="font-medium">{selectedRequest.selectedOption.airplane}</span>
                                </div>
                              )}
                              {selectedRequest.selectedOption.departureAirport && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2 text-muted-foreground"><MapPinIcon className="h-3.5 w-3.5" /> Aeroportos:</span>
                                  <span className="font-medium">{selectedRequest.selectedOption.departureAirport} → {selectedRequest.selectedOption.arrivalAirport}</span>
                                </div>
                              )}
                              {selectedRequest.selectedOption.legroom && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Espaço:</span>
                                  <span className="font-medium">{selectedRequest.selectedOption.legroom}</span>
                                </div>
                              )}
                              {selectedRequest.selectedOption.amenities && selectedRequest.selectedOption.amenities.length > 0 && (
                                <div className="pt-2 space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Amenidades:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedRequest.selectedOption.amenities.map((amenity, idx) => (
                                      <span key={idx} className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                                        ✓ {amenity}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Hotel Information */}
                          {(selectedRequest.type === "hotel" || selectedRequest.type === "car") && (
                            <div className="space-y-2 pt-4 border-t">
                              {selectedRequest.selectedOption.locationDetails && (
                                <div className="text-sm">
                                  <p className="flex items-center gap-2 text-muted-foreground font-semibold mb-1"><MapPinIcon className="h-3.5 w-3.5" /> Localização:</p>
                                  <p className="font-medium text-foreground">{selectedRequest.selectedOption.locationDetails}</p>
                                </div>
                              )}
                              {selectedRequest.selectedOption.rating && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Avaliação:</span>
                                  <span className="font-bold text-lg">⭐ {selectedRequest.selectedOption.rating}</span>
                                </div>
                              )}
                              {selectedRequest.selectedOption.reviewsCount && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Avaliações:</span>
                                  <span className="font-medium">{selectedRequest.selectedOption.reviewsCount} reviews</span>
                                </div>
                              )}
                              {selectedRequest.selectedOption.hotelAmenities && selectedRequest.selectedOption.hotelAmenities.length > 0 && (
                                <div className="pt-2 space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Comodidades:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedRequest.selectedOption.hotelAmenities.map((amenity, idx) => (
                                      <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                                        • {amenity}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedRequest.selectedOption.images && selectedRequest.selectedOption.images.length > 0 && (
                                <div className="pt-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Fotos:</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {selectedRequest.selectedOption.images.map((img, idx) => (
                                      <img 
                                        key={idx} 
                                        src={img} 
                                        alt={`Foto ${idx}`} 
                                        className="h-24 w-full object-cover rounded-lg border"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Alternatives */}
                    {selectedRequest.alternatives.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                          Opções Alternativas
                          <span className="text-xs font-normal bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                            {selectedRequest.alternatives.length}
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {selectedRequest.alternatives.map((alt) => (
                            <Card key={alt.id} className="hover:shadow-md transition-all hover:border-primary/50">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">{alt.provider}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{alt.details}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-foreground whitespace-nowrap text-lg">
                                      R$ {alt.price.toLocaleString("pt-BR")}
                                    </p>
                                  </div>
                                </div>

                                {/* Flight Details */}
                                {selectedRequest.type === "flight" && alt.departureTime && (
                                  <div className="text-xs space-y-1.5 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Horário:</span>
                                      <span className="font-mono font-semibold">{alt.departureTime} - {alt.arrivalTime}</span>
                                    </div>
                                    {alt.flightNumber && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Voo:</span>
                                        <span className="font-mono font-bold">{alt.flightNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Hotel Details */}
                                {(selectedRequest.type === "hotel" || selectedRequest.type === "car") && alt.rating && (
                                  <div className="text-xs space-y-1.5 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Avaliação:</span>
                                      <span className="font-semibold">⭐ {alt.rating} ({alt.reviewsCount} reviews)</span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approval/Rejection Info */}
                    {selectedRequest.status === "approved" && selectedRequest.approvalCode && (
                      <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-5">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-emerald-900">Solicitação Aprovada</p>
                            <p className="text-sm text-emerald-700 mt-1">Código de aprovação registrado</p>
                          </div>
                        </div>
                        <div className="mt-4 bg-white rounded-lg p-3 flex items-center justify-between">
                          <p className="font-mono text-lg font-bold text-emerald-700">{selectedRequest.approvalCode}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                            onClick={() => handleCopyCode(selectedRequest.approvalCode!)}
                          >
                            {copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="mt-3 text-xs text-emerald-600">Use este código ao subir o boleto para pagamento</p>
                      </div>
                    )}

                    {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                      <div className="rounded-lg bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-5">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-red-900">Solicitação Rejeitada</p>
                            <p className="text-sm text-red-700 mt-1">Motivo da rejeição</p>
                          </div>
                        </div>
                        <div className="mt-3 bg-white rounded-lg p-3">
                          <p className="text-sm text-foreground leading-relaxed">{selectedRequest.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

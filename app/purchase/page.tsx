"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
  ShoppingCart, 
  Plane, 
  Building2, 
  Car, 
  ExternalLink, 
  Check, 
  X, 
  AlertCircle,
  TrendingDown,
  Calendar,
  MapPin,
  DollarSign
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { getApprovedRequestsAction, completePurchaseAction, rejectRequestAction } from "@/app/actions/travel-requests"
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
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [confirmationCode, setConfirmationCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Verifica permissão de acesso
  useEffect(() => {
    if (currentUser.role !== "buyer" && currentUser.role !== "admin") {
      toast.error("Acesso Negado", {
        description: "Você não tem permissão para acessar esta página"
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

  const handleCompletePurchase = async () => {
    if (!selectedRequest || !confirmationCode.trim()) {
      toast.error("Preencha o código de confirmação")
      return
    }

    setIsProcessing(true)
    const result = await completePurchaseAction(selectedRequest.id, currentUser.id, confirmationCode)
    
    if (result.success) {
      toast.success("Compra Confirmada!", {
        description: "A solicitação foi marcada como comprada"
      })
      setShowConfirmDialog(false)
      setConfirmationCode("")
      setSelectedRequest(null)
      loadRequests()
    } else {
      toast.error("Erro ao confirmar compra", {
        description: "Tente novamente"
      })
    }
    setIsProcessing(false)
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Preencha o motivo da rejeição")
      return
    }

    setIsProcessing(true)
    const result = await rejectRequestAction(selectedRequest.id, currentUser.id, rejectionReason)
    
    if (result.success) {
      toast.success("Solicitação Rejeitada", {
        description: "O solicitante será notificado"
      })
      setShowRejectDialog(false)
      setSelectedRequest(null)
      setRejectionReason("")
      loadRequests()
    } else {
      toast.error("Erro ao rejeitar solicitação")
    }
    setIsProcessing(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "flight": return <Plane className="h-5 w-5" />
      case "hotel": return <Building2 className="h-5 w-5" />
      case "car": return <Car className="h-5 w-5" />
      default: return null
    }
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, "dd/MM/yyyy")
  }

  const calculateSavings = (selectedPrice: number, alternatives: any[]) => {
    const prices = alternatives.map(alt => alt.price).filter(p => p > 0)
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

        {/* Lista de Solicitações */}
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
          <div className="space-y-4">
            {requests.map((request) => {
              const savings = calculateSavings(
                request.selectedOption?.price || 0,
                request.alternatives || []
              )

              return (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getTypeIcon(request.type)}
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {request.type === "flight" && request.origin 
                              ? `${request.origin} → ${request.destination}`
                              : request.destination
                            }
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Solicitado por {request.userName}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Aprovada
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Informações da Viagem */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Datas</p>
                          <p className="font-medium text-sm">
                            {formatDate(request.departureDate)} - {formatDate(request.returnDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Destino</p>
                          <p className="font-medium text-sm">{request.destination}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Valor</p>
                          <p className="font-bold text-sm text-primary">
                            R$ {request.selectedOption?.price?.toLocaleString("pt-BR") || "0"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <p className="text-xs font-semibold text-blue-900 mb-1">MOTIVO DA SOLICITAÇÃO</p>
                      <p className="text-sm text-blue-800">{request.reason}</p>
                    </div>

                    {/* Justificativa (se existir) */}
                    {request.justification && (
                      <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                        <p className="text-xs font-semibold text-amber-900 mb-1">JUSTIFICATIVA PARA OPÇÃO MAIS CARA</p>
                        <p className="text-sm text-amber-800">{request.justification}</p>
                      </div>
                    )}

                    {/* Alerta de economia */}
                    {savings > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-orange-900">
                            Atenção: Economia disponível
                          </p>
                          <p className="text-xs text-orange-700">
                            Há alternativas até R$ {savings.toLocaleString("pt-BR")} mais baratas
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Opção Selecionada */}
                    <div className="border rounded-lg p-4 bg-card">
                      <h4 className="text-sm font-bold text-muted-foreground mb-2">OPÇÃO SELECIONADA</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{request.selectedOption?.provider}</p>
                          <p className="text-sm text-muted-foreground">{request.selectedOption?.details}</p>
                        </div>
                        <p className="text-2xl font-black text-primary">
                          R$ {request.selectedOption?.price?.toLocaleString("pt-BR") || "0"}
                        </p>
                      </div>
                    </div>

                    {/* Alternativas */}
                    {request.alternatives && request.alternatives.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-muted-foreground mb-2">
                          ALTERNATIVAS DISPONÍVEIS ({request.alternatives.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {request.alternatives.slice(0, 5).map((alt, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded border">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{alt.provider}</p>
                                <p className="text-xs text-muted-foreground truncate">{alt.details}</p>
                              </div>
                              <p className="font-bold text-sm ml-4">
                                R$ {alt.price?.toLocaleString("pt-BR") || "0"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-3 pt-4 border-t">
                      {request.bookingUrl && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(request.bookingUrl!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Acessar Reserva
                        </Button>
                      )}
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowConfirmDialog(true)
                        }}
                        disabled={isProcessing}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar Compra
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowRejectDialog(true)
                        }}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog de Confirmação de Compra */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open)
        if (!open) {
          setConfirmationCode("")
          setSelectedRequest(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
            <DialogDescription>
              Digite o código do comprovante de compra para confirmar a transação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="confirmCode" className="text-sm font-medium">
                Código do Comprovante *
              </label>
              <Input
                id="confirmCode"
                type="text"
                placeholder="Ex: COMP-2026-001234"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCompletePurchase}
              disabled={!confirmationCode.trim() || isProcessing}
            >
              Confirmar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo técnico da rejeição. O solicitante será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Ex: Link de reserva inválido, opção não disponível, erro no sistema do fornecedor..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

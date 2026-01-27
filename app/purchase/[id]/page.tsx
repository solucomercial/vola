"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { AlertCircle, Check, ShoppingCart, X } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import {
  getApprovedRequestsAction,
  completePurchaseAction,
  rejectRequestAction,
} from "@/app/actions/travel-requests"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

export default function PurchaseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { currentUser } = useApp()

  const [requests, setRequests] = useState<TravelRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmationCode, setConfirmationCode] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const request = useMemo(
    () => requests.find((r) => r.id === params.id),
    [requests, params.id],
  )

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

  const buildExternalLink = (req: TravelRequest) => {
    const departure = format(typeof req.departureDate === "string" ? parseISO(req.departureDate) : req.departureDate, "yyyy-MM-dd")
    const back = req.returnDate
      ? format(typeof req.returnDate === "string" ? parseISO(req.returnDate) : req.returnDate, "yyyy-MM-dd")
      : null

    if (req.type === "flight") {
      const origin = req.origin || ""
      const query = `from ${origin} to ${req.destination} ${departure}${back ? ` ${back}` : ""}`.trim()
      return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`
    }

    if (req.type === "hotel") {
      const query = `${req.destination} ${departure}${back ? ` ${back}` : ""}`.trim()
      return `https://www.google.com/travel/hotels?q=${encodeURIComponent(query)}`
    }

    return null
  }

  const handleCompletePurchase = async () => {
    if (!request || !confirmationCode.trim()) {
      toast.error("Preencha os códigos de confirmação")
      return
    }

    const codes = confirmationCode
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code.length > 0)

    if (codes.length === 0) {
      toast.error("Informe pelo menos um código de confirmação válido")
      return
    }

    setIsProcessing(true)
    const result = await completePurchaseAction(request.id, currentUser.id, codes)

    if (result.success) {
      toast.success("Compra Confirmada!", {
        description: `Solicitação marcada como comprada com ${codes.length} localizador${codes.length > 1 ? "es" : ""}`,
      })
      setShowConfirmDialog(false)
      setConfirmationCode("")
      router.push("/purchase")
    } else {
      toast.error("Erro ao confirmar compra", {
        description: "Tente novamente",
      })
    }
    setIsProcessing(false)
  }

  const handleReject = async () => {
    if (!request || !rejectionReason.trim()) {
      toast.error("Preencha o motivo da rejeição")
      return
    }

    setIsProcessing(true)
    const result = await rejectRequestAction(request.id, currentUser.id, rejectionReason)

    if (result.success) {
      toast.success("Solicitação Rejeitada", {
        description: "O solicitante será notificado",
      })
      setShowRejectDialog(false)
      setRejectionReason("")
      router.push("/purchase")
    } else {
      toast.error("Erro ao rejeitar solicitação")
    }
    setIsProcessing(false)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <ShoppingCart className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando detalhes da solicitação...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!request) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold">Solicitação não encontrada</p>
            <p className="text-muted-foreground mt-2">ID: {params.id}</p>
            <Button className="mt-4" onClick={() => router.push("/purchase")}>Voltar</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const savings = calculateSavings(request.selectedOption?.price || 0, request.alternatives || [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Solicitação #{request.id}</p>
            <h1 className="text-3xl font-bold">Detalhes para Compra</h1>
            <p className="text-muted-foreground">Solicitante: {request.userName}</p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {request.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded border">
                <p className="text-xs text-muted-foreground">Data da solicitação</p>
                <p className="text-lg font-semibold">{formatDate(request.createdAt)}</p>
              </div>
              <div className="p-3 rounded border">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-lg font-semibold">{request.destination}</p>
              </div>
              <div className="p-3 rounded border">
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="text-lg font-semibold">
                  {formatDate(request.departureDate)} — {formatDate(request.returnDate)}
                </p>
              </div>
              <div className="p-3 rounded border">
                <p className="text-xs text-muted-foreground">Valor selecionado</p>
                <p className="text-lg font-semibold text-primary">
                  R$ {request.selectedOption?.price?.toLocaleString("pt-BR") || "0"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded border bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-900 font-semibold">Motivo</p>
                <p className="text-sm text-blue-900">{request.reason}</p>
              </div>
              {request.justification && (
                <div className="p-3 rounded border bg-amber-50 border-amber-200">
                  <p className="text-xs text-amber-900 font-semibold">Justificativa</p>
                  <p className="text-sm text-amber-900">{request.justification}</p>
                </div>
              )}
            </div>

            {buildExternalLink(request) && (
              <div className="pt-2">
                <Button asChild variant="outline">
                  <a href={buildExternalLink(request) ?? "#"} target="_blank" rel="noreferrer">
                    Buscar no mercado
                  </a>
                </Button>
              </div>
            )}

            {savings > 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">
                    Economia disponível
                  </p>
                  <p className="text-xs text-orange-700">
                    Há alternativas até R$ {savings.toLocaleString("pt-BR")} mais baratas
                  </p>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowConfirmDialog(true)}
              >
                <Check className="h-4 w-4 mr-2" /> Confirmar Compra
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                <X className="h-4 w-4 mr-2" /> Rejeitar Solicitação
              </Button>
              <Button variant="outline" onClick={() => router.push("/purchase")}>Voltar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Compra */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open)
        if (!open) {
          setConfirmationCode("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
            <DialogDescription>
              Digite os códigos de confirmação (localizadores) da compra. Separe múltiplos códigos com vírgula.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="confirmCode" className="text-sm font-medium">
                Códigos de Confirmação (Localizadores) *
              </label>
              <Input
                id="confirmCode"
                type="text"
                placeholder="Ex: ABC123, XYZ789"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Estes serão os localizadores para check-in do viajante.
              </p>
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

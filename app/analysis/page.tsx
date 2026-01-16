// app/analysis/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RequestTypeIcon } from "@/components/request-type-icon"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ComparisonDialog } from "@/components/comparison-dialog"
import { format, parseISO } from "date-fns"
import { Calendar, MapPin, AlertTriangle, CheckCircle2, XCircle, TrendingDown, User, Loader2 } from "lucide-react"
import { approveRequestAction, rejectRequestAction, getPendingRequestsAction, updateRequestOptionAction } from "@/app/actions/travel-requests"

export default function AnalysisPage() {
  const { currentUser } = useApp()
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false)
  const [requestForComparison, setRequestForComparison] = useState<any | null>(null)

  // Função para carregar dados reais do banco
  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    const data = await getPendingRequestsAction()
    setPendingRequests(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleApprove = async () => {
    if (!selectedRequest) return
    setIsProcessing(true)
    try {
      const res = await approveRequestAction(selectedRequest.id, currentUser.id)
      if (res.success) {
        setConfirmApproveOpen(false)
        setSelectedRequest(null)
        loadRequests() // Recarrega a lista
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return
    setIsProcessing(true)
    try {
      const res = await rejectRequestAction(selectedRequest.id, currentUser.id, rejectionReason)
      if (res.success) {
        setRejectDialogOpen(false)
        setRejectionReason("")
        setSelectedRequest(null)
        loadRequests() // Recarrega a lista
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenComparison = (request: any) => {
    setRequestForComparison(request)
    setComparisonDialogOpen(true)
  }

  const handleComparisonApprove = async () => {
    if (!requestForComparison) return
    setIsProcessing(true)
    try {
      const res = await approveRequestAction(requestForComparison.id, currentUser.id)
      if (res.success) {
        setComparisonDialogOpen(false)
        setRequestForComparison(null)
        loadRequests()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleComparisonApproveWithOption = async (selectedOption: any) => {
    if (!requestForComparison || !selectedOption) return
    setIsProcessing(true)
    try {
      // Se a opção selecionada é diferente da original, atualiza a solicitação
      if (selectedOption.id !== requestForComparison.selectedOption.id) {
        const updateRes = await updateRequestOptionAction(requestForComparison.id, selectedOption)
        if (!updateRes.success) {
          setIsProcessing(false)
          return
        }
      }
      
      const res = await approveRequestAction(requestForComparison.id, currentUser.id)
      if (res.success) {
        setComparisonDialogOpen(false)
        setRequestForComparison(null)
        loadRequests()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleComparisonReject = async () => {
    if (!requestForComparison) return
    setComparisonDialogOpen(false)
    setSelectedRequest(requestForComparison)
    setRejectDialogOpen(true)
    setRequestForComparison(null)
  }

  // Helpers de cálculo
  const getCheapestOption = (request: any) => {
    const allOptions = [request.selectedOption, ...(request.alternatives || [])]
    return allOptions.reduce((min: any, opt: any) => (opt.price < min.price ? opt : min), allOptions[0])
  }

  const getPotentialSavings = (request: any) => {
    const cheapest = getCheapestOption(request)
    return request.selectedOption.price - cheapest.price
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análise de solicitação</h1>
          <p className="text-muted-foreground">Analisar e aprovar pedidos de viagem vindos da base de dados.</p>
        </div>

        {/* Estatísticas baseadas nos dados REAIS */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pedidos Pendentes</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{pendingRequests.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Valor em Análise</CardDescription>
              <CardTitle className="text-3xl">
                R$ {pendingRequests.reduce((sum, r) => sum + r.selectedOption.price, 0).toLocaleString("pt-BR")}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Economia Possível</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">
                R$ {pendingRequests.reduce((sum, r) => sum + getPotentialSavings(r), 0).toLocaleString("pt-BR")}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
              <p className="text-lg font-medium">Tudo atualizado!</p>
              <p className="text-muted-foreground">Nenhuma solicitação pendente no banco de dados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const savings = getPotentialSavings(request)
              return (
                <Card key={request.id} className="overflow-hidden border-l-4 border-l-amber-500">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                            <RequestTypeIcon type={request.type} className="h-6 w-6 text-secondary-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{request.destination}</h3>
                              <Badge variant="outline" className="capitalize">{request.type}</Badge>
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-1"><User className="h-3 w-3" /> Solicitado por: <strong>{request.userName}</strong></p>
                              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> De: {request.origin || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 rounded bg-muted/50">
                          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Motivo da Viagem</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>
                      </div>

                      <div className="border-t lg:border-t-0 lg:border-l border-border bg-secondary/20 p-6 lg:w-96">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-widest">Opção Selecionada</h4>
                        <div 
                          className="p-3 rounded-lg border bg-card mb-4 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleOpenComparison(request)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-primary">{request.selectedOption.provider}</p>
                            <p className="font-black">R$ {request.selectedOption.price.toLocaleString("pt-BR")}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{request.selectedOption.details}</p>
                        </div>

                        {savings > 0 && (
                          <div className="mb-4 flex items-center gap-2 p-2 rounded bg-amber-100 text-amber-800 text-xs font-medium">
                            <TrendingDown className="h-3 w-3" /> Economia de R$ {savings.toLocaleString("pt-BR")} disponível em alternativas.
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10"
                            onClick={() => { setSelectedRequest(request); setConfirmApproveOpen(true); }}
                          >
                            Aprovar
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1 h-10"
                            onClick={() => { setSelectedRequest(request); setRejectDialogOpen(true); }}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Diálogos de Aprovação e Rejeição */}
        <Dialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Aprovação</DialogTitle>
              <DialogDescription>Deseja gerar o código de aprovação para esta viagem?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmApproveOpen(false)}>Cancelar</Button>
              <Button onClick={handleApprove} disabled={isProcessing} className="bg-emerald-600">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Aprovar Agora"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Motivo da Rejeição</DialogTitle>
              <DialogDescription>Explique ao colaborador por que a viagem foi recusada.</DialogDescription>
            </DialogHeader>
            <Textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              placeholder="Ex: Orçamento excedido para este período..." 
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Rejeição"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ComparisonDialog 
          isOpen={comparisonDialogOpen}
          onOpenChange={setComparisonDialogOpen}
          request={requestForComparison}
          onApprove={handleComparisonApproveWithOption}
          onReject={handleComparisonReject}
          isProcessing={isProcessing}
        />
      </div>
    </DashboardLayout>
  )
}
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp, type TravelRequest } from "@/context/app-context"
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
import { format, parseISO } from "date-fns"
import { Calendar, MapPin, AlertTriangle, CheckCircle2, XCircle, TrendingDown, User } from "lucide-react"

export default function AnalysisPage() {
  const { getPendingRequests, approveRequest, rejectRequest, currentUser, users } = useApp()
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false)

  const pendingRequests = getPendingRequests()

  const handleApprove = () => {
    if (!selectedRequest) return
    approveRequest(selectedRequest.id, currentUser.id)
    setConfirmApproveOpen(false)
    setSelectedRequest(null)
  }

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) return
    rejectRequest(selectedRequest.id, currentUser.id, rejectionReason)
    setRejectDialogOpen(false)
    setRejectionReason("")
    setSelectedRequest(null)
  }

  const getCheapestOption = (request: TravelRequest) => {
    const allOptions = [request.selectedOption, ...request.alternatives]
    return allOptions.reduce((min, opt) => (opt.price < min.price ? opt : min), allOptions[0])
  }

  const getPotentialSavings = (request: TravelRequest) => {
    const cheapest = getCheapestOption(request)
    return request.selectedOption.price - cheapest.price
  }

  const getUserByName = (name: string) => {
    return users.find((u) => u.name === name)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Request Analysis</h1>
          <p className="text-muted-foreground">Review and approve pending travel requests</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{pendingRequests.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Awaiting your decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Value</CardDescription>
              <CardTitle className="text-3xl">
                R$ {pendingRequests.reduce((sum, r) => sum + r.selectedOption.price, 0).toLocaleString("pt-BR")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Potential Savings</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">
                R$ {pendingRequests.reduce((sum, r) => sum + getPotentialSavings(r), 0).toLocaleString("pt-BR")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">By choosing cheapest options</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
              <p className="text-lg font-medium text-foreground">All caught up!</p>
              <p className="text-muted-foreground">No pending requests to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const savings = getPotentialSavings(request)
              const cheapest = getCheapestOption(request)
              const isSelectedCheapest = request.selectedOption.id === cheapest.id
              const requester = getUserByName(request.userName)

              return (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Request Info */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                            <RequestTypeIcon type={request.type} className="h-6 w-6 text-secondary-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-foreground">{request.destination}</h3>
                              <Badge variant="secondary" className="capitalize">
                                {request.type}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>From {request.origin}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(parseISO(request.departureDate), "MMM d")} -{" "}
                                {format(parseISO(request.returnDate), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Requester */}
                        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {request.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{request.userName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{requester?.role || "Requester"}</p>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">Reason</p>
                          <p className="text-sm font-medium text-foreground">{request.reason}</p>
                        </div>
                      </div>

                      {/* Options Comparison */}
                      <div className="border-t lg:border-t-0 lg:border-l border-border bg-secondary/30 p-6 lg:w-96">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Options Comparison</h4>

                        {/* Selected Option */}
                        <div
                          className={`rounded-lg border p-3 mb-2 ${isSelectedCheapest ? "border-emerald-500 bg-emerald-50" : "border-amber-500 bg-amber-50"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{request.selectedOption.provider}</p>
                                <Badge variant="outline" className="text-xs">
                                  Selected
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{request.selectedOption.details}</p>
                            </div>
                            <p className={`font-bold ${isSelectedCheapest ? "text-emerald-700" : "text-amber-700"}`}>
                              R$ {request.selectedOption.price.toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        {/* Alternatives */}
                        {request.alternatives.map((alt) => {
                          const isCheapest = alt.id === cheapest.id
                          return (
                            <div
                              key={alt.id}
                              className={`rounded-lg border p-3 mb-2 ${isCheapest ? "border-emerald-500 bg-emerald-50" : "border-border bg-card"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{alt.provider}</p>
                                    {isCheapest && <Badge className="bg-emerald-600 text-xs">Best Price</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{alt.details}</p>
                                </div>
                                <p className={`font-bold ${isCheapest ? "text-emerald-700" : "text-foreground"}`}>
                                  R$ {alt.price.toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          )
                        })}

                        {/* Savings Alert */}
                        {savings > 0 && (
                          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-100 p-3">
                            <TrendingDown className="h-4 w-4 text-amber-700" />
                            <p className="text-sm text-amber-800">
                              Save <span className="font-bold">R$ {savings.toLocaleString("pt-BR")}</span> with{" "}
                              {cheapest.provider}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedRequest(request)
                              setConfirmApproveOpen(true)
                            }}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => {
                              setSelectedRequest(request)
                              setRejectDialogOpen(true)
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
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

        {/* Approve Confirmation Dialog */}
        <Dialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Approval</DialogTitle>
              <DialogDescription>
                You are about to approve this travel request. An approval code will be generated.
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary p-4">
                  <div className="flex items-center gap-3">
                    <RequestTypeIcon type={selectedRequest.type} className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{selectedRequest.destination}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.selectedOption.provider} - R${" "}
                        {selectedRequest.selectedOption.price.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Requested by {selectedRequest.userName}</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmApproveOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Reject Request
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this request. This will be shared with the requester.
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary p-4">
                  <div className="flex items-center gap-3">
                    <RequestTypeIcon type={selectedRequest.type} className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{selectedRequest.destination}</p>
                      <p className="text-sm text-muted-foreground">Requested by {selectedRequest.userName}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rejection Reason *</label>
                  <Textarea
                    placeholder="Enter the reason for rejecting this request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false)
                  setRejectionReason("")
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

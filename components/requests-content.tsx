"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { RequestTypeIcon } from "@/components/request-type-icon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { Plus, Search, Calendar, MapPin, Copy, Check } from "lucide-react"
import { format, parseISO } from "date-fns"
import type { RequestStatus, RequestType, TravelRequest } from "@/context/app-context"

export function RequestsContent() {
  const { getMyRequests } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<RequestType | "all">("all")
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)
  const [copied, setCopied] = useState(false)

  const myRequests = getMyRequests()

  const filteredRequests = myRequests.filter((request) => {
    const matchesSearch =
      request.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Requests</h1>
            <p className="text-muted-foreground">Manage and track your travel requests</p>
          </div>
          <Link href="/requests/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by destination, origin, or reason..."
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as RequestType | "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="car">Car Rental</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No requests found</p>
              {myRequests.length === 0 && (
                <Link href="/requests/new" className="mt-4">
                  <Button>Create your first request</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card
                key={request.id}
                className="cursor-pointer transition-colors hover:bg-secondary/50"
                onClick={() => setSelectedRequest(request)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                        <RequestTypeIcon type={request.type} className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{request.destination}</h3>
                          <StatusBadge status={request.status} />
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
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          R$ {request.selectedOption.price.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground">{request.selectedOption.provider}</p>
                      </div>
                      {request.approvalCode && (
                        <div className="rounded bg-primary/10 px-2 py-1">
                          <p className="font-mono text-xs text-primary">{request.approvalCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Request Detail Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <RequestTypeIcon type={selectedRequest.type} className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <DialogTitle className="flex items-center gap-2">
                        {selectedRequest.destination}
                        <StatusBadge status={selectedRequest.status} />
                      </DialogTitle>
                      <DialogDescription>
                        {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)} request from{" "}
                        {selectedRequest.origin}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Trip Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Departure</p>
                      <p className="font-medium text-foreground">
                        {format(parseISO(selectedRequest.departureDate), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Return</p>
                      <p className="font-medium text-foreground">
                        {format(parseISO(selectedRequest.returnDate), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Reason for Travel</p>
                    <p className="font-medium text-foreground">{selectedRequest.reason}</p>
                  </div>

                  {/* Selected Option */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Selected Option</p>
                    <Card className="border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{selectedRequest.selectedOption.provider}</p>
                            <p className="text-sm text-muted-foreground">{selectedRequest.selectedOption.details}</p>
                            {selectedRequest.selectedOption.departureTime && (
                              <p className="text-sm text-muted-foreground">
                                {selectedRequest.selectedOption.departureTime} -{" "}
                                {selectedRequest.selectedOption.arrivalTime}
                                {selectedRequest.selectedOption.duration &&
                                  ` (${selectedRequest.selectedOption.duration})`}
                              </p>
                            )}
                          </div>
                          <p className="text-xl font-bold text-primary">
                            R$ {selectedRequest.selectedOption.price.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Alternatives */}
                  {selectedRequest.alternatives.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Alternative Options</p>
                      <div className="space-y-2">
                        {selectedRequest.alternatives.map((alt) => (
                          <Card key={alt.id}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">{alt.provider}</p>
                                  <p className="text-sm text-muted-foreground">{alt.details}</p>
                                </div>
                                <p className="font-semibold text-foreground">R$ {alt.price.toLocaleString("pt-BR")}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval/Rejection Info */}
                  {selectedRequest.status === "approved" && selectedRequest.approvalCode && (
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-sm font-medium text-emerald-800">Approval Code</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="font-mono text-lg font-bold text-emerald-700">{selectedRequest.approvalCode}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyCode(selectedRequest.approvalCode!)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-emerald-600" />
                          )}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-emerald-600">Use this code when booking with the provider</p>
                    </div>
                  )}

                  {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                    <div className="rounded-lg bg-destructive/10 p-4">
                      <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                      <p className="mt-1 text-foreground">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

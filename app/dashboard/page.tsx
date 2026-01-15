"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { RequestTypeIcon } from "@/components/request-type-icon"
import Link from "next/link"
import { Plus, ArrowRight, Calendar, MapPin } from "lucide-react"
import { format, parseISO, isAfter } from "date-fns"

export default function DashboardPage() {
  const { currentUser, getMyRequests, getPendingRequests } = useApp()

  const myRequests = getMyRequests()
  const pendingRequests = getPendingRequests()

  // Stats for current user
  const myPending = myRequests.filter((r) => r.status === "pending").length
  const myApproved = myRequests.filter((r) => r.status === "approved").length
  const myRejected = myRequests.filter((r) => r.status === "rejected").length

  // Upcoming trips (approved requests with future dates)
  const today = new Date()
  const upcomingTrips = myRequests
    .filter((r) => r.status === "approved" && isAfter(parseISO(r.departureDate), today))
    .sort((a, b) => parseISO(a.departureDate).getTime() - parseISO(b.departureDate).getTime())
    .slice(0, 3)

  // Recent requests
  const recentRequests = myRequests.slice(0, 5)

  const canApprove = currentUser.role === "approver" || currentUser.role === "admin"

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {currentUser.name.split(" ")[0]}</h1>
            <p className="text-muted-foreground">Here&apos;s an overview of your travel requests</p>
          </div>
          <Link href="/requests/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-3xl">{myRequests.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{myPending}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{myApproved}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Ready to travel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rejected</CardDescription>
              <CardTitle className="text-3xl text-destructive">{myRejected}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Need revision</p>
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
                  <p className="font-medium text-foreground">Requests Awaiting Your Approval</p>
                  <p className="text-sm text-muted-foreground">Review pending travel requests from your team</p>
                </div>
              </div>
              <Link href="/analysis">
                <Button variant="outline">
                  Review Now
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
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Your latest travel requests</CardDescription>
              </div>
              <Link href="/requests">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No requests yet</p>
                  <Link href="/requests/new" className="mt-2">
                    <Button variant="outline" size="sm">
                      Create your first request
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
                          {format(parseISO(request.departureDate), "MMM d")} -{" "}
                          {format(parseISO(request.returnDate), "MMM d, yyyy")}
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
              <CardTitle>Upcoming Trips</CardTitle>
              <CardDescription>Your approved upcoming travel</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No upcoming trips</p>
                  <p className="text-sm text-muted-foreground mt-1">Approved requests will appear here</p>
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
                            <p className="text-xs text-muted-foreground">Approval Code</p>
                            <p className="font-mono text-sm font-medium text-primary">{trip.approvalCode}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(trip.departureDate), "EEEE, MMMM d, yyyy")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

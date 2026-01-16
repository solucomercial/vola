"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, XCircle, Bell, Info, FileText, Check, Loader2 } from "lucide-react"
import { getNotificationsAction, markNotificationReadAction } from "@/app/actions/travel-requests"

type NotificationFilter = "all" | "approval" | "rejection" | "system" | "new_request"

export interface NotificationData {
  id: string
  userId: string
  type: "approval" | "rejection" | "system" | "new_request"
  title: string
  message: string
  read: boolean
  requestId?: string | null
  createdAt: Date | string
}

export function NotificationsContent() {
  const { currentUser } = useApp()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true)
      try {
        const data = await getNotificationsAction(currentUser.id)
        setNotifications(data as NotificationData[])
      } catch (error) {
        console.error("Erro ao carregar notificações:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [currentUser.id])

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true
    return n.type === filter
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: NotificationData["type"]) => {
    switch (type) {
      case "approval":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "rejection":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "new_request":
        return <FileText className="h-5 w-5 text-primary" />
      case "system":
        return <Info className="h-5 w-5 text-muted-foreground" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getNotificationBadge = (type: NotificationData["type"]) => {
    switch (type) {
      case "approval":
        return (
          <Badge variant="default" className="bg-emerald-600">
            Aprovado
          </Badge>
        )
      case "rejection":
        return <Badge variant="destructive">Rejeitado</Badge>
      case "new_request":
        return <Badge variant="default">Nova Solicitação</Badge>
      case "system":
        return <Badge variant="secondary">Sistema</Badge>
      default:
        return null
    }
  }

  const handleMarkRead = async (notificationId: string) => {
    setMarking(notificationId)
    try {
      await markNotificationReadAction(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    } finally {
      setMarking(null)
    }
  }

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read)
    for (const n of unreadNotifications) {
      await markNotificationReadAction(n.id)
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">Fique atualizado sobre suas solicitações de viagem</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <Check className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{notifications.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Não Lidas</CardDescription>
            <CardTitle className="text-2xl text-primary">{unreadCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovações</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {notifications.filter((n) => n.type === "approval").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejeições</CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {notifications.filter((n) => n.type === "rejection").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="approval">Aprovações</TabsTrigger>
          <TabsTrigger value="rejection">Rejeições</TabsTrigger>
          <TabsTrigger value="new_request">Solicitações</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhuma notificação</p>
            <p className="text-muted-foreground">
              {filter === "all" ? "Você está tudo atualizado!" : `Nenhuma notificação de ${filter.replace("_", " ")}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${!notification.read ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      {getNotificationBadge(notification.type)}
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" title="Unread" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={marking === notification.id}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {marking === notification.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

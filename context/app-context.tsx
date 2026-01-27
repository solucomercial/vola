"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"

// Types
export type UserRole = "requester" | "approver" | "admin" | "buyer"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export type RequestType = "flight" | "hotel" | "car"
export type RequestStatus = "pending" | "approved" | "rejected" | "purchased"

export interface TravelOption {
  id: string
  provider: string
  price: number
  details: string
  departureTime?: string
  arrivalTime?: string
  duration?: string
}

export interface TravelRequest {
  id: string
  userId: string
  userName: string
  type: RequestType
  origin: string | null
  destination: string
  departureDate: Date | string
  returnDate: Date | string
  reason: string
  status: RequestStatus
  selectedOption: TravelOption
  alternatives: TravelOption[]
  createdAt: string | Date
  approvalCode?: string | null
  rejectionReason?: string | null
  approverId?: string | null
}

export interface Notification {
  id: string
  userId: string
  type: "approval" | "rejection" | "system" | "new_request"
  title: string
  message: string
  date: string
  read: boolean
  requestId?: string
}

interface AppContextType {
  currentUser: User
  setCurrentUser: (user: User) => void
  users: User[]
  requests: TravelRequest[]
  notifications: Notification[]
  addRequest: (request: Omit<TravelRequest, "id" | "createdAt" | "status">) => Promise<void>
  approveRequest: (requestId: string, approverId: string) => Promise<void>
  rejectRequest: (requestId: string, approverId: string, reason: string) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  getMyRequests: () => TravelRequest[]
  getPendingRequests: () => TravelRequest[]
  getUnreadNotificationsCount: () => Promise<number>
  refreshData: () => Promise<void>
  loading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const skipAuth = pathname === "/login"
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [requests, setRequests] = useState<TravelRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Função para carregar dados do banco
  const loadData = useCallback(async (userId?: string) => {
    if (skipAuth) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Verificar sessão primeiro
      const sessionResponse = await fetch("/api/auth/session")
      if (!sessionResponse.ok) {
        // Redirecionar para login se não estiver autenticado
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        return
      }

      const { user } = await sessionResponse.json()
      
      // Definir o usuário da sessão como usuário atual
      if (!currentUser || currentUser.id !== user.id) {
        setCurrentUser(user)
      }

      // Carregar requests
      const requestsResponse = await fetch(`/api/requests?userId=${user.id}`)
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setRequests(requestsData)
      }

      // Carregar notificações
      const notificationsResponse = await fetch(`/api/notifications?userId=${user.id}`)
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData)
      }

      // Carregar todos os usuários (para uso em listagens)
      const usersResponse = await fetch("/api/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    } finally {
      setLoading(false)
    }
  }, [currentUser, skipAuth])

  // Carregar dados na inicialização
  useEffect(() => {
    loadData()
  }, []) // Executar apenas uma vez

  const generateApprovalCode = () => {
    const year = new Date().getFullYear()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `APR-${year}-${random}`
  }

  const addRequest = useCallback(async (request: Omit<TravelRequest, "id" | "createdAt" | "status">) => {
    try {
      // Importa a action de criar request do servidor
      const { createTravelRequestAction } = await import("@/app/actions/travel-requests")
      
      // Garantir que as datas estão no formato string ISO
      const departureDate = typeof request.departureDate === 'string' 
        ? request.departureDate 
        : new Date(request.departureDate).toISOString()
      const returnDate = typeof request.returnDate === 'string'
        ? request.returnDate
        : new Date(request.returnDate).toISOString()
      
      await createTravelRequestAction({
        ...request,
        departureDate,
        returnDate,
        costCenter: "DEFAULT",
      })

      // Recarregar dados após criar
      await loadData(currentUser?.id)
    } catch (error) {
      console.error("Error adding request:", error)
      throw error
    }
  }, [currentUser?.id, loadData])

  const approveRequest = useCallback(
    async (requestId: string, approverId: string) => {
      try {
        const { approveRequestAction } = await import("@/app/actions/travel-requests")
        await approveRequestAction(requestId, approverId)
        
        // Recarregar dados após aprovar
        await loadData(currentUser?.id)
      } catch (error) {
        console.error("Error approving request:", error)
        throw error
      }
    },
    [currentUser?.id, loadData],
  )

  const rejectRequest = useCallback(
    async (requestId: string, approverId: string, reason: string) => {
      try {
        const { rejectRequestAction } = await import("@/app/actions/travel-requests")
        await rejectRequestAction(requestId, approverId, reason)
        
        // Recarregar dados após rejeitar
        await loadData(currentUser?.id)
      } catch (error) {
        console.error("Error rejecting request:", error)
        throw error
      }
    },
    [currentUser?.id, loadData],
  )

  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
      
      // Atualizar localmente
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  const getMyRequests = useCallback(() => {
    return requests.filter((r) => r.userId === currentUser?.id)
  }, [requests, currentUser?.id])

  const getPendingRequests = useCallback(() => {
    return requests.filter((r) => r.status === "pending")
  }, [requests])

  const getUnreadNotificationsCount = useCallback(async () => {
    if (!currentUser?.id) return 0
    
    try {
      const response = await fetch(`/api/notifications/unread-count?userId=${currentUser.id}`)
      if (response.ok) {
        const data = await response.json()
        return data.count
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
    // Fallback to local state if API fails
    return notifications.filter((n) => n.userId === currentUser.id && !n.read).length
  }, [notifications, currentUser?.id])

  const refreshData = useCallback(async () => {
    await loadData(currentUser?.id)
  }, [loadData, currentUser?.id])

  // Não renderiza o provider até ter carregado o usuário inicial (exceto na página de login)
  if (!currentUser && !skipAuth) {
    return null
  }

  if (skipAuth) {
    return children
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        requests,
        notifications,
        addRequest,
        approveRequest,
        rejectRequest,
        markNotificationRead,
        getMyRequests,
        getPendingRequests,
        getUnreadNotificationsCount,
        refreshData,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}

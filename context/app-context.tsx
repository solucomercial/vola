"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

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

// Mock Users
const mockUsers: User[] = [
  { id: "1", name: "João Silva", email: "joao@solucoes.com", role: "requester" },
  { id: "2", name: "Maria Santos", email: "maria@solucoes.com", role: "approver" },
  { id: "3", name: "Carlos Admin", email: "carlos@solucoes.com", role: "admin" },
  { id: "4", name: "Ana Compradora", email: "ana@solucoes.com", role: "buyer" },
]

// Mock Travel Requests
const initialRequests: TravelRequest[] = [
  {
    id: "req-001",
    userId: "1",
    userName: "João Silva",
    type: "flight",
    origin: "São Paulo (GRU)",
    destination: "Rio de Janeiro (GIG)",
    departureDate: "2026-02-15",
    returnDate: "2026-02-18",
    reason: "Reunião com Petrobras",
    status: "pending",
    selectedOption: {
      id: "opt-1",
      provider: "LATAM",
      price: 890,
      details: "Direct flight, Economy",
      departureTime: "08:00",
      arrivalTime: "09:05",
      duration: "1h 5m",
    },
    alternatives: [
      {
        id: "opt-2",
        provider: "GOL",
        price: 750,
        details: "Direct flight, Economy",
        departureTime: "10:30",
        arrivalTime: "11:35",
        duration: "1h 5m",
      },
      {
        id: "opt-3",
        provider: "Azul",
        price: 820,
        details: "Direct flight, Economy Plus",
        departureTime: "14:00",
        arrivalTime: "15:10",
        duration: "1h 10m",
      },
    ],
    createdAt: "2026-01-10T10:30:00Z",
  },
  {
    id: "req-002",
    userId: "1",
    userName: "João Silva",
    type: "hotel",
    origin: "São Paulo",
    destination: "Rio de Janeiro",
    departureDate: "2026-02-15",
    returnDate: "2026-02-18",
    reason: "Reunião com Petrobras",
    status: "approved",
    selectedOption: {
      id: "opt-4",
      provider: "Marriott Copacabana",
      price: 1200,
      details: "Standard Room, Breakfast included",
    },
    alternatives: [
      {
        id: "opt-5",
        provider: "Hilton Barra",
        price: 980,
        details: "Standard Room",
      },
      {
        id: "opt-6",
        provider: "Windsor Atlantica",
        price: 850,
        details: "Ocean View Room",
      },
    ],
    createdAt: "2026-01-10T10:35:00Z",
    approvalCode: "APR-2026-001",
    approverId: "2",
  },
  {
    id: "req-003",
    userId: "1",
    userName: "João Silva",
    type: "car",
    origin: "Rio de Janeiro (GIG)",
    destination: "Rio de Janeiro",
    departureDate: "2026-02-15",
    returnDate: "2026-02-18",
    reason: "Transporte para reunião com cliente",
    status: "rejected",
    selectedOption: {
      id: "opt-7",
      provider: "Localiza",
      price: 450,
      details: "Compact Car, Full Insurance",
    },
    alternatives: [
      {
        id: "opt-8",
        provider: "Unidas",
        price: 380,
        details: "Economy Car",
      },
      {
        id: "opt-9",
        provider: "Movida",
        price: 420,
        details: "Compact Car, Basic Insurance",
      },
    ],
    createdAt: "2026-01-11T09:00:00Z",
    rejectionReason: "Utilize o carro da empresa disponível no destino. Entre em contato com o escritório local.",
    approverId: "2",
  },
  {
    id: "req-004",
    userId: "3",
    userName: "Carlos Admin",
    type: "flight",
    origin: "São Paulo (GRU)",
    destination: "Brasília (BSB)",
    departureDate: "2026-02-20",
    returnDate: "2026-02-21",
    reason: "Negociação de contrato governamental",
    status: "pending",
    selectedOption: {
      id: "opt-10",
      provider: "LATAM",
      price: 1250,
      details: "Business Class",
      departureTime: "06:00",
      arrivalTime: "07:45",
      duration: "1h 45m",
    },
    alternatives: [
      {
        id: "opt-11",
        provider: "GOL",
        price: 680,
        details: "Economy",
        departureTime: "07:30",
        arrivalTime: "09:15",
        duration: "1h 45m",
      },
    ],
    createdAt: "2026-01-12T14:20:00Z",
  },
  {
    id: "req-005",
    userId: "2",
    userName: "Maria Santos",
    type: "flight",
    origin: "São Paulo (GRU)",
    destination: "Curitiba (CWB)",
    departureDate: "2026-03-01",
    returnDate: "2026-03-03",
    reason: "Treinamento de workshop",
    status: "approved",
    selectedOption: {
      id: "opt-12",
      provider: "Azul",
      price: 520,
      details: "Economy",
      departureTime: "09:00",
      arrivalTime: "10:10",
      duration: "1h 10m",
    },
    alternatives: [],
    createdAt: "2026-01-08T11:00:00Z",
    approvalCode: "APR-2026-002",
    approverId: "3",
  },
]

// Mock Notifications
const initialNotifications: Notification[] = [
  {
    id: "notif-001",
    userId: "1",
    type: "approval",
    title: "Solicitação Aprovada",
    message: "Sua reserva no Marriott Copacabana foi aprovada. Código de aprovação: APR-2026-001.",
    date: "2026-01-11T08:00:00Z",
    read: false,
    requestId: "req-002",
  },
  {
    id: "notif-002",
    userId: "1",
    type: "rejection",
    title: "Solicitação Rejeitada",
    message: "Sua solicitação de aluguel de carro foi rejeitada. Motivo: Utilize o carro da empresa disponível no destino.",
    date: "2026-01-11T14:30:00Z",
    read: true,
    requestId: "req-003",
  },
  {
    id: "notif-003",
    userId: "2",
    type: "new_request",
    title: "Nova Solicitação para Análise",
    message: "João Silva submeteu uma solicitação de voo para Rio de Janeiro que requer sua aprovação.",
    date: "2026-01-10T10:35:00Z",
    read: false,
    requestId: "req-001",
  },
  {
    id: "notif-004",
    userId: "3",
    type: "system",
    title: "Relatório Mensal Disponível",
    message: "O relatório de despesas de viagens de janeiro de 2026 está disponível para revisão.",
    date: "2026-01-15T09:00:00Z",
    read: false,
  },
]

interface AppContextType {
  currentUser: User
  setCurrentUser: (user: User) => void
  users: User[]
  requests: TravelRequest[]
  notifications: Notification[]
  addRequest: (request: Omit<TravelRequest, "id" | "createdAt" | "status">) => void
  approveRequest: (requestId: string, approverId: string) => void
  rejectRequest: (requestId: string, approverId: string, reason: string) => void
  markNotificationRead: (notificationId: string) => void
  getMyRequests: () => TravelRequest[]
  getPendingRequests: () => TravelRequest[]
  getUnreadNotificationsCount: () => Promise<number>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0])
  const [requests, setRequests] = useState<TravelRequest[]>(initialRequests)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const generateApprovalCode = () => {
    const year = new Date().getFullYear()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `APR-${year}-${random}`
  }

  const addRequest = useCallback((request: Omit<TravelRequest, "id" | "createdAt" | "status">) => {
    const newRequest: TravelRequest = {
      ...request,
      id: `req-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    setRequests((prev) => [newRequest, ...prev])

    // Notify approvers
    const approversAndAdmins = mockUsers.filter((u) => u.role === "approver" || u.role === "admin")
    const newNotifications: Notification[] = approversAndAdmins.map((user) => ({
      id: `notif-${Date.now()}-${user.id}`,
      userId: user.id,
      type: "new_request",
      title: "Nova Solicitação de Análise",
      message: `${request.userName} submeteu uma solicitação de ${request.type} para ${request.destination} que requer sua aprovação.`,
      date: new Date().toISOString(),
      read: false,
      requestId: newRequest.id,
    }))
    setNotifications((prev) => [...newNotifications, ...prev])
  }, [])

  const approveRequest = useCallback(
    (requestId: string, approverId: string) => {
      const approvalCode = generateApprovalCode()
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "approved" as RequestStatus, approvalCode, approverId } : req,
        ),
      )

      const request = requests.find((r) => r.id === requestId)
      if (request) {
        const newNotification: Notification = {
          id: `notif-${Date.now()}`,
          userId: request.userId,
          type: "approval",
          title: "Solicitação aprovada",
          message: `Sua solicitação de ${request.type} para ${request.destination} foi aprovada. Código: ${approvalCode}`,
          date: new Date().toISOString(),
          read: false,
          requestId,
        }
        setNotifications((prev) => [newNotification, ...prev])
      }
    },
    [requests],
  )

  const rejectRequest = useCallback(
    (requestId: string, approverId: string, reason: string) => {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: "rejected" as RequestStatus, rejectionReason: reason, approverId }
            : req,
        ),
      )

      const request = requests.find((r) => r.id === requestId)
      if (request) {
        const newNotification: Notification = {
          id: `notif-${Date.now()}`,
          userId: request.userId,
          type: "rejection",
          title: "Solicitação Rejeitada",
          message: `Sua solicitação de ${request.type} para ${request.destination} foi rejeitada. Motivo: ${reason}`,
          date: new Date().toISOString(),
          read: false,
          requestId,
        }
        setNotifications((prev) => [newNotification, ...prev])
      }
    },
    [requests],
  )

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }, [])

  const getMyRequests = useCallback(() => {
    return requests.filter((r) => r.userId === currentUser.id)
  }, [requests, currentUser.id])

  const getPendingRequests = useCallback(() => {
    return requests.filter((r) => r.status === "pending")
  }, [requests])

  const getUnreadNotificationsCount = useCallback(async () => {
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
  }, [notifications, currentUser.id])

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users: mockUsers,
        requests,
        notifications,
        addRequest,
        approveRequest,
        rejectRequest,
        markNotificationRead,
        getMyRequests,
        getPendingRequests,
        getUnreadNotificationsCount,
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

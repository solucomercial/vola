"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OverviewContent } from "@/components/overview-content"
import { getOverviewDataAction } from "@/app/actions/travel-requests"
import { Skeleton } from "@/components/ui/skeleton"

interface TravelRequest {
  id: string
  userId: string
  userName: string
  type: "flight" | "hotel" | "car"
  destination: string
  origin?: string | null
  departureDate: Date | string
  returnDate: Date | string
  status: "pending" | "approved" | "rejected"
  reason: string
  selectedOption: any
  createdAt: Date | string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function OverviewPage() {
  const [data, setData] = useState<{ requests: TravelRequest[]; users: User[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getOverviewDataAction()
        // Mapear dados para incluir userName
        const requestsWithNames = (result.requests || []).map((r: any) => ({
          ...r,
          userName:
            result.users?.find((u: any) => u.id === r.userId)?.name || "Desconhecido",
        }))
        setData({
          requests: requestsWithNames,
          users: result.users || [],
        })
      } catch (error) {
        console.error("Erro ao carregar dados de overview:", error)
        setData({ requests: [], users: [] })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        ) : data ? (
          <OverviewContent requests={data.requests} users={data.users} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Erro ao carregar dados</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
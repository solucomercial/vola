import { Suspense } from "react"
import { RequestsContent } from "@/components/requests-content"

export default function RequestsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Solicitações</h2>
      </div>
      <Suspense fallback={<div>Carregando solicitações...</div>}>
        <RequestsContent />
      </Suspense>
    </div>
  )
}
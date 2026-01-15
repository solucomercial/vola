import { Suspense } from "react"
import { RequestsContent } from "@/components/requests-content"

export default function RequestsPage() {
  return (
    <Suspense fallback={null}>
      <RequestsContent />
    </Suspense>
  )
}

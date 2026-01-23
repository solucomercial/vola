import { Badge } from "@/components/ui/badge"
import type { RequestStatus } from "@/context/app-context"

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<
    RequestStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
  > = {
    pending: { variant: "secondary", label: "Pendente" },
    approved: { variant: "default", label: "Aprovada" },
    rejected: { variant: "destructive", label: "Rejeitada" },
    purchased: { variant: "outline", label: "Comprada" },
  }

  const { variant, label } = variants[status]

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

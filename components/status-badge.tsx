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
    pending: { variant: "secondary", label: "Pending" },
    approved: { variant: "default", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
  }

  const { variant, label } = variants[status]

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

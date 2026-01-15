import { Plane, Building2, Car } from "lucide-react"
import type { RequestType } from "@/context/app-context"
import { cn } from "@/lib/utils"

interface RequestTypeIconProps {
  type: RequestType
  className?: string
}

export function RequestTypeIcon({ type, className }: RequestTypeIconProps) {
  const icons: Record<RequestType, typeof Plane> = {
    flight: Plane,
    hotel: Building2,
    car: Car,
  }

  const Icon = icons[type]

  return <Icon className={cn("h-4 w-4", className)} />
}

import { type TravelOption } from "@/lib/travel-api"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from "@/components/ui/dialog"
import { Plane, Wifi, BatteryCharging, Tv, Ruler, Info, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface FlightInfoProps {
  option: TravelOption
  onSelect: (optionId: string) => void
}

export function FlightInfo({ option, onSelect }: FlightInfoProps) {
  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <div className="flex items-center gap-4 mb-2">
          {/* Exibição do Logótipo da Companhia */}
          <Avatar className="h-12 w-12 border-2 border-muted bg-white">
            <AvatarImage src={option.airlineLogo} alt={option.provider} className="object-contain p-1" />
            <AvatarFallback className="font-bold">{option.provider.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-xl">{option.provider}</DialogTitle>
            <DialogDescription>
              Voo {option.flightNumber} • {option.airplane}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        <div className="flex items-center justify-between rounded-xl border p-4 bg-primary/5 border-primary/20">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase">Valor Total</span>
            <span className="text-3xl font-bold text-primary">R$ {option.price.toLocaleString("pt-BR")}</span>
          </div>
          <Badge variant="outline" className="h-fit py-1 px-3 border-primary/30 text-primary">
            {option.details?.split(' - ')[0] || "Economy"}
          </Badge>
        </div>

        <div className="relative flex flex-col gap-4 rounded-xl border p-4 bg-muted/30">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono leading-none">{option.departureTime}</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground max-w-[150px] leading-tight">
                {option.departureAirport}
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-1 mt-2">
              <div className="h-[2px] w-16 bg-muted-foreground/30 relative">
                <Plane className="h-4 w-4 absolute -top-2 left-1/2 -translate-x-1/2 text-muted-foreground" />
              </div>
              <span className="text-[9px] text-muted-foreground uppercase font-bold">
                {option.details?.split(' - ')[1]?.replace('Duração total: ', '')}
              </span>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-2xl font-bold font-mono leading-none">{option.arrivalTime}</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground max-w-[150px] leading-tight ml-auto">
                {option.arrivalAirport}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Info className="h-3 w-3" /> Espaço
            </h4>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Ruler className="h-4 w-4 text-primary" />
              <span>{option.legroom || "Espaço padrão"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Wifi className="h-3 w-3" /> Comodidades
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {option.amenities?.map((amenity, idx) => (
                <Badge key={idx} variant="secondary" className="text-[9px] font-medium py-0 px-2 bg-secondary/50">
                  {amenity.toLowerCase().includes("wi-fi") && <Wifi className="h-3 w-3 mr-1" />}
                  {amenity.toLowerCase().includes("usb") && <BatteryCharging className="h-3 w-3 mr-1" />}
                  {amenity.toLowerCase().includes("media") && <Tv className="h-3 w-3 mr-1" />}
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={() => onSelect(option.id)} className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
          <Check className="h-4 w-4" /> Confirmar este Voo
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
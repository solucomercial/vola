// components/hotel-info.tsx
"use client"

import { useState } from "react"
import { type TravelOption } from "@/lib/travel-api"
import { Button } from "@/components/ui/button"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Building2,
  MapPin,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HotelInfoProps {
  option: TravelOption
  type: "hotel" | "car"
  onSelect: (optionId: string) => void
}

export function HotelInfo({ option, type, onSelect }: HotelInfoProps) {
  const [currentImg, setCurrentImg] = useState(0)
  const images = option.images || []

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImg((prev) => (prev + 1) % images.length)
  }

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImg((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    // Definimos altura fixa no Dialog para permitir o scroll interno
    <DialogContent className="sm:max-w-[600px] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
      
      {/* Galeria fixa no topo */}
      <div className="relative h-64 sm:h-72 w-full bg-muted shrink-0">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImg]}
              alt={option.provider}
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/30 hover:bg-black/50 text-white"
                  onClick={prevImg}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/30 hover:bg-black/50 text-white"
                  onClick={nextImg}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] text-white font-medium">
              {currentImg + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Building2 className="h-12 w-12 opacity-20" />
          </div>
        )}
      </div>

      {/* Área de Conteúdo Scrollable */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-6 space-y-6">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {option.provider}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1 mt-1 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> 
                  {option.locationDetails || "Localização privilegiada"}
                </DialogDescription>
              </div>
              
              {option.rating && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold text-sm">
                    <Star className="h-3.5 w-3.5 fill-emerald-700" />
                    {option.rating}
                  </div>
                  {option.reviewsCount && (
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {option.reviewsCount} avaliações
                    </span>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="flex items-center justify-between rounded-xl border p-4 bg-primary/5 border-primary/20">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Valor Estimado</p>
                <p className="text-3xl font-black text-primary">
                  R$ {option.price.toLocaleString("pt-BR")}
                </p>
              </div>
              <Badge className="bg-primary text-white">Melhor Opção</Badge>
            </div>

            {/* Lista de Comodidades */}
            {option.hotelAmenities && option.hotelAmenities.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground underline decoration-primary/30">O que este lugar oferece</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {option.hotelAmenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="leading-tight">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sobre a acomodação</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{option.details}</p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Rodapé fixo com botão */}
      <div className="p-4 border-t bg-background shrink-0">
        <Button 
          onClick={() => onSelect(option.id)} 
          className="w-full h-12 text-base font-bold gap-2"
        >
          <Check className="h-5 w-5" /> Selecionar Hospedagem
        </Button>
      </div>
    </DialogContent>
  )
}
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
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl">
      
      {/* Galeria de Fotos Fixa no Topo */}
      <div className="relative h-64 sm:h-72 w-full bg-black shrink-0">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImg]} 
              alt={option.provider} 
              className="h-full w-full object-cover transition-opacity duration-300" 
            />
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/20 hover:bg-black/50 text-white" onClick={prevImg}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-black/20 hover:bg-black/50 text-white" onClick={nextImg}>
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}
            <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white font-medium">
              {currentImg + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">
            <Building2 className="h-16 w-16" />
          </div>
        )}
      </div>

      {/* Área de Informações com Scroll */}
      <div className="flex-1 overflow-y-auto bg-background p-6 space-y-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black">{option.provider}</DialogTitle>
              <DialogDescription className="flex items-center gap-1 mt-1 text-primary font-bold">
                <MapPin className="h-4 w-4" /> {option.locationDetails}
              </DialogDescription>
            </div>
            
            {option.rating && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-md font-bold">
                  <Star className="h-4 w-4 fill-emerald-700" />
                  {option.rating}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                  {option.reviewsCount} avaliações
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-5">
          {/* Cartão de Preço - Agora com valor corrigido */}
          <div className="flex items-center justify-between rounded-xl border-2 border-primary/10 p-5 bg-primary/[0.02]">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Estimado</p>
              <p className="text-4xl font-black text-primary tracking-tighter">
                {option.price.toLocaleString("pt-BR")}
              </p>
            </div>
            <Badge className="px-4 py-1 font-bold">Melhor Oferta</Badge>
          </div>

          {/* Comodidades */}
          {option.hotelAmenities && option.hotelAmenities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">O que este lugar oferece</h4>
              <div className="grid grid-cols-2 gap-3">
                {option.hotelAmenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sobre a acomodação</h4>
            <p className="text-sm text-muted-foreground leading-relaxed italic">"{option.details}"</p>
          </div>
        </div>
      </div>

      {/* Rodapé Fixo com Botão */}
      <div className="p-4 border-t bg-background shrink-0 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
        <Button onClick={() => onSelect(option.id)} className="w-full h-14 text-lg font-black uppercase tracking-tight gap-2">
          <Check className="h-6 w-6" /> Confirmar Seleção
        </Button>
      </div>
    </DialogContent>
  )
}
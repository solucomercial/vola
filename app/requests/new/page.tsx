"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog" 
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Plane, 
  Building2, 
  Car, 
  Check, 
  Sparkles, 
  Loader2, 
  Plus, 
  Eye, 
  ArrowRight 
} from "lucide-react"
import Link from "next/link"
import { searchOptionsAction, createTravelRequestAction } from "@/app/actions/travel-requests"
import { type TravelOption } from "@/lib/travel-api"
import { FlightInfo } from "@/components/flight-info"
import { HotelInfo } from "@/components/hotel-info"

export default function NewRequestPage() {
  const router = useRouter()
  const { currentUser } = useApp()

  // Estados do formulário
  const [type, setType] = useState<"flight" | "hotel" | "car">("flight")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [reason, setReason] = useState("")

  // Estados de dados e interface
  const [options, setOptions] = useState<TravelOption[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)
  const [viewingOption, setViewingOption] = useState<TravelOption | null>(null)

  const handleTypeChange = (newType: string) => {
    setType(newType as any)
    setOptions([])
    setSelectedOptionId("")
    setVisibleCount(5)
  }

  const handleSearch = async () => {
    if (!destination || !departureDate || !returnDate) return
    if (type === "flight" && !origin) return

    setIsSearching(true)
    setVisibleCount(5)
    setSelectedOptionId("") 
    try {
      // Chamada atualizada com returnDate
      const results = await searchOptionsAction(type, origin, destination, departureDate, returnDate)
      setOptions(results)
    } catch (error) {
      console.error("Erro ao pesquisar:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectFromDialog = (optionId: string) => {
    setSelectedOptionId(optionId)
    setViewingOption(null) 
  }

  const handleSubmit = async () => {
    const selectedOption = options.find((o) => o.id === selectedOptionId)
    if (!selectedOption || !reason) return

    setIsSubmitting(true)
    try {
      const result = await createTravelRequestAction({
        userId: currentUser.id,
        userName: currentUser.name,
        type,
        origin: type === "flight" ? origin : null,
        destination,
        departureDate,
        returnDate,
        reason,
        selectedOption,
        alternatives: options.filter((o) => o.id !== selectedOptionId),
      })

      if (result.success) {
        router.push("/requests")
      }
    } catch (error) {
      console.error("Erro ao submeter:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 relative">
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nova Solicitação</h1>
            <p className="text-muted-foreground">Pesquise opções reais via SerpApi & RapidAPI</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Tipo de Serviço</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={type} onValueChange={handleTypeChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="flight" className="gap-2"><Plane className="h-4 w-4" />Voo</TabsTrigger>
                <TabsTrigger value="hotel" className="gap-2"><Building2 className="h-4 w-4" />Hotel</TabsTrigger>
                <TabsTrigger value="car" className="gap-2"><Car className="h-4 w-4" />Carro</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes da {type === "flight" ? "Viagem" : type === "hotel" ? "Hospedagem" : "Locação"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid gap-4 sm:grid-cols-2">
              {type === "flight" && (
                <div className="space-y-2">
                  <Label>Origem (IATA)</Label>
                  <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ex: GRU" />
                </div>
              )}
              <div className="space-y-2">
                <Label>{type === "flight" ? "Destino (IATA)" : "Cidade / Destino"}</Label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={type === "flight" ? "Ex: GIG" : "Ex: São Paulo"} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{type === "hotel" ? "Check-in" : "Partida / Retirada"}</Label>
                <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{type === "hotel" ? "Check-out" : "Retorno / Devolução"}</Label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="w-full">
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isSearching ? "Buscando..." : "Pesquisar Opções"}
            </Button>
          </CardContent>
        </Card>

        {options.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resultados Encontrados ({options.length})</CardTitle>
                <p className="text-xs text-muted-foreground">Exibindo {Math.min(visibleCount, options.length)} de {options.length}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.slice(0, visibleCount).map((option) => {
                const isSelected = selectedOptionId === option.id
                return (
                  <div 
                    key={option.id} 
                    onClick={() => setViewingOption(option)}
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-md ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-secondary/50"}`}
                  >
                    <Avatar className="h-10 w-10 border bg-white shrink-0">
                      <AvatarImage src={option.airlineLogo} alt={option.provider} className="object-contain p-1" />
                      <AvatarFallback>{option.provider.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-lg">{option.provider}</p>
                        <p className="text-lg font-bold text-primary">R$ {option.price.toLocaleString("pt-BR")}</p>
                      </div>
                      
                      {type === 'flight' && option.departureTime ? (
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{option.departureTime}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{option.arrivalTime}</span>
                            <span className="text-xs ml-2 truncate max-w-[200px]">{option.details}</span>
                         </div>
                      ) : (
                         <p className="text-sm text-muted-foreground line-clamp-1">{option.details}</p>
                      )}
                    </div>

                    <Button variant={isSelected ? "default" : "secondary"} size="icon" className="shrink-0 pointer-events-none">
                      {isSelected ? <Check className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                )
              })}
              
              {options.length > visibleCount && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-muted-foreground hover:text-primary gap-2"
                  onClick={() => setVisibleCount(prev => prev + 5)}
                >
                  <Plus className="h-4 w-4" />
                  Ver mais resultados ({options.length - visibleCount} restantes)
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {selectedOptionId && (
          <Card className="border-primary/20 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
            <CardHeader><CardTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> Opção Selecionada & Justificativa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Selecionou a opção fornecida por <strong>{options.find(o => o.id === selectedOptionId)?.provider}</strong>. Justifique a sua escolha para o aprovador.</p>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Descreva o motivo desta solicitação..." rows={3} className="resize-none" />
              <div className="flex gap-4 pt-2">
                <Button onClick={handleSubmit} disabled={isSubmitting || !reason} className="flex-1">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enviar para Aprovação
                </Button>
                <Button variant="outline" onClick={() => setSelectedOptionId("")}>Trocar Seleção</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!viewingOption} onOpenChange={(open) => !open && setViewingOption(null)}>
        {viewingOption && type === 'flight' && (
          <FlightInfo option={viewingOption} onSelect={handleSelectFromDialog} />
        )}
        {viewingOption && (type === 'hotel' || type === 'car') && (
          <HotelInfo option={viewingOption} type={type} onSelect={handleSelectFromDialog} />
        )}
      </Dialog>
    </DashboardLayout>
  )
}
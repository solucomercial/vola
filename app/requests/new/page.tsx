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
  ArrowRight,
  X,
  Wallet
} from "lucide-react"
import { Suspense } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { searchOptionsAction, createTravelRequestAction, submitCartAction, type CartItem } from "@/app/actions/travel-requests"
import { type TravelOption } from "@/lib/travel-api"
import { FlightInfo } from "@/components/flight-info"
import { HotelInfo } from "@/components/hotel-info"
import { LocationSearch } from "@/components/location-search"
import { toast } from "sonner"

function TravelRequestForm() {
  const router = useRouter()
  const { currentUser } = useApp()

  // Estados do formulário
  const [type, setType] = useState<"flight" | "hotel" | "car">("flight")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [costCenter, setCostCenter] = useState("")
  const [reason, setReason] = useState("")

  // Estados de dados e interface
  const [options, setOptions] = useState<TravelOption[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)
  const [viewingOption, setViewingOption] = useState<TravelOption | null>(null)
  
  // Estados do carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)

  const handleTypeChange = (newType: string) => {
    setType(newType as any)
    setOptions([])
    setSelectedOptionId("")
    setVisibleCount(5)
    setCostCenter("")
    setReason("")
  }

  const handleSearch = async () => {
    if (!destination || !departureDate || !returnDate || !costCenter) return
    if (type === "flight" && !origin) return

    setIsSearching(true)
    setVisibleCount(5)
    setSelectedOptionId("") 
    try {
      const results = await searchOptionsAction(type, origin, destination, departureDate, returnDate)
      setOptions(results)
      if (results.length > 0) {
        toast.success(`${results.length} opções encontradas!`, {
          description: `Escolha a melhor opção de ${type === "flight" ? "voo" : type === "hotel" ? "hotel" : "locação de carro"}`
        })
      } else {
        toast.info("Nenhuma opção encontrada", {
          description: "Tente ajustar os critérios de busca"
        })
      }
    } catch (error) {
      console.error("Erro ao pesquisar:", error)
      toast.error("Erro ao pesquisar opções", {
        description: "Tente novamente em alguns momentos"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectFromDialog = (optionId: string) => {
    setSelectedOptionId(optionId)
    setViewingOption(null) 
  }

  const handleAddToCart = async () => {
    const selectedOption = options.find((o) => o.id === selectedOptionId)
    if (!selectedOption || !reason) {
      toast.error("Erro", { description: "Selecione uma opção e descreva a justificativa" })
      return
    }

    const newItem: CartItem = {
      type,
      origin: type === "flight" ? origin : null,
      destination,
      departureDate,
      returnDate,
      costCenter,
      reason,
      selectedOption: {
        ...selectedOption,
        id: selectedOption.id,
        provider: selectedOption.provider,
        price: selectedOption.price,
        details: selectedOption.details,
        bookingUrl: selectedOption.bookingUrl,
        departureTime: selectedOption.departureTime,
        arrivalTime: selectedOption.arrivalTime,
        flightNumber: selectedOption.flightNumber,
        airplane: selectedOption.airplane,
        legroom: selectedOption.legroom,
        amenities: selectedOption.amenities,
        airlineLogo: selectedOption.airlineLogo,
        departureAirport: selectedOption.departureAirport,
        arrivalAirport: selectedOption.arrivalAirport,
        images: selectedOption.images,
        rating: selectedOption.rating,
        reviewsCount: selectedOption.reviewsCount,
        locationDetails: selectedOption.locationDetails,
        hotelAmenities: selectedOption.hotelAmenities,
      },
      alternatives: options
        .filter((o) => o.id !== selectedOptionId)
        .map(alt => ({
          ...alt,
          id: alt.id,
          provider: alt.provider,
          price: alt.price,
          details: alt.details,
          bookingUrl: alt.bookingUrl,
          departureTime: alt.departureTime,
          arrivalTime: alt.arrivalTime,
          flightNumber: alt.flightNumber,
          airplane: alt.airplane,
          legroom: alt.legroom,
          amenities: alt.amenities,
          airlineLogo: alt.airlineLogo,
          departureAirport: alt.departureAirport,
          arrivalAirport: alt.arrivalAirport,
          images: alt.images,
          rating: alt.rating,
          reviewsCount: alt.reviewsCount,
          locationDetails: alt.locationDetails,
          hotelAmenities: alt.hotelAmenities,
        })),
    }

    setCartItems([...cartItems, newItem])
    toast.success("Adicionado ao carrinho!", {
      description: `${type === "flight" ? "Voo" : type === "hotel" ? "Hotel" : "Carro"} adicionado com sucesso`
    })

    // Limpa o formulário
    setOptions([])
    setSelectedOptionId("")
    setDestination("")
    setOrigin("")
    setDepartureDate("")
    setReturnDate("")
    setReason("")
  }

  const handleRemoveFromCart = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index)
    setCartItems(newCart)
    toast.success("Removido do carrinho")
  }

  const handleSubmitCart = async () => {
    if (cartItems.length === 0) {
      toast.error("Carrinho vazio", { description: "Adicione pelo menos um item antes de enviar" })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitCartAction(cartItems, currentUser.id, currentUser.name)
      
      if (result.success) {
        toast.success("Carrinho enviado com sucesso!", {
          description: `${cartItems.length} item(ns) foram registrados para aprovação`
        })
        setCartItems([])
        setShowCheckout(false)
        router.push("/requests")
      } else {
        toast.error("Erro ao enviar carrinho", {
          description: result.error || "Tente novamente"
        })
      }
    } catch (error) {
      console.error("Erro ao enviar carrinho:", error)
      toast.error("Erro inesperado", {
        description: "Não conseguimos processar seu carrinho"
      })
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
                  <LocationSearch
                    value={origin}
                    iataCode={origin}
                    onChange={(code, display) => setOrigin(code)}
                    placeholder="Ex: São Paulo - Guarulhos (GRU)"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>{type === "flight" ? "Destino (IATA)" : "Cidade / Destino"}</Label>
                {type === "flight" ? (
                  <LocationSearch
                    value={destination}
                    iataCode={destination}
                    onChange={(code, display) => setDestination(code)}
                    placeholder="Ex: Rio de Janeiro - Galeão (GIG)"
                  />
                ) : (
                  <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ex: São Paulo" />
                )}
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
            <div className="space-y-2">
              <Label>Centro de Custo *</Label>
              <Input 
                value={costCenter} 
                onChange={(e) => setCostCenter(e.target.value)} 
                placeholder="Ex: 1005" 
              />
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
                <Button onClick={handleAddToCart} disabled={isSubmitting || !reason} className="flex-1 bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Adicionando..." : "Adicionar ao Carrinho"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedOptionId("")}>Trocar Seleção</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Shopping Cart Section */}
      {cartItems.length > 0 && (
        <Card className="col-span-full border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Seu Carrinho ({cartItems.length} {cartItems.length === 1 ? "item" : "itens"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {item.type === "flight" && <Plane className="w-4 h-4" />}
                      {item.type === "hotel" && <Building2 className="w-4 h-4" />}
                      {item.type === "car" && <Car className="w-4 h-4" />}
                      <span className="font-medium">
                        {item.type === "flight"
                          ? `${item.origin} → ${item.destination}`
                          : `${item.destination}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>
                        {format(new Date(item.departureDate), "dd/MM/yyyy")}
                        {item.returnDate && ` - ${format(new Date(item.returnDate), "dd/MM/yyyy")}`}
                      </span>
                      <span>Centro: {item.costCenter}</span>
                      <span className="text-blue-600 font-semibold">
                        {item.selectedOption.price
                          ? `${item.selectedOption.price.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "Valor não disponível"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromCart(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="mt-4 pt-4 border-t border-green-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  {" "}
                  {cartItems
                    .reduce((total, item) => total + (item.selectedOption.price || 0), 0)
                    .toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {cartItems.length} item(ns) selecionado(s) para aprovação
              </p>
            </div>

            {/* Checkout Button */}
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => setShowCheckout(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Finalizar Compra
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resumo de Solicitações</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Items List */}
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          {item.type === "flight" && <Plane className="w-4 h-4" />}
                          {item.type === "hotel" && <Building2 className="w-4 h-4" />}
                          {item.type === "car" && <Car className="w-4 h-4" />}
                          <span>
                            {item.type === "flight"
                              ? `Voo: ${item.origin} → ${item.destination}`
                              : item.type === "hotel"
                                ? `Hotel: ${item.destination}`
                                : `Carro: ${item.destination}`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <p>
                            📅{" "}
                            {format(new Date(item.departureDate), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                            {item.returnDate &&
                              ` - ${format(new Date(item.returnDate), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}`}
                          </p>
                          <p>💼 Centro: {item.costCenter}</p>
                          <p>📝 Motivo: {item.reason}</p>
                          <p className="text-blue-600 font-medium">
                            {" "}
                            {(item.selectedOption.price || 0).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Total de Itens:</span>
                  <span className="font-bold">{cartItems.length}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                  <span className="font-medium">Valor Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {" "}
                    {cartItems
                      .reduce((total, item) => total + (item.selectedOption.price || 0), 0)
                      .toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1"
                >
                  Voltar ao Carrinho
                </Button>
                <Button
                  onClick={handleSubmitCart}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Envio
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <TravelRequestForm />
    </Suspense>
  )
}
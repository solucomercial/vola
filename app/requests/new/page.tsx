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
  Wallet,
  MapPin,
  AlertCircle,
  ArrowUpDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

// Função auxiliar para encontrar o menor preço
function findLowestPrice(options: TravelOption[]): number | null {
  if (!options || options.length === 0) return null
  const prices = options.map(o => o.price).filter(p => p !== undefined && p !== null)
  return prices.length > 0 ? Math.min(...prices) : null
}

// Função para verificar se a justificativa é obrigatória
function isJustificationRequired(selectedPrice: number | undefined, lowestPrice: number | null): boolean {
  if (!selectedPrice || !lowestPrice) return false
  return selectedPrice > lowestPrice
}

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
  const [justification, setJustification] = useState("")

  // Estados de dados e interface
  const [options, setOptions] = useState<TravelOption[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)
  const [viewingOption, setViewingOption] = useState<TravelOption | null>(null)
  const [outboundPage, setOutboundPage] = useState(1)
  const [returnPage, setReturnPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("none")
  const itemsPerPage = 5
  
  // Estados de seleção em duas etapas (ida/volta)
  const [tripMode, setTripMode] = useState<"one-way" | "round-trip">("round-trip")
  const [outboundOption, setOutboundOption] = useState<TravelOption | null>(null)
  const [returnOption, setReturnOption] = useState<TravelOption | null>(null)
  
  // Estados do carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)

  // Função para ordenar opções por preço
  const getSortedOptions = (opts: TravelOption[]) => {
    if (sortOrder === "none") return opts
    return [...opts].sort((a, b) => {
      const priceA = a.price || 0
      const priceB = b.price || 0
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA
    })
  }

  // Calcula o menor preço disponível
  const lowestPrice = findLowestPrice(options)

  const handleTypeChange = (newType: string) => {
    setType(newType as any)
    setOptions([])
    setSelectedOptionId("")
    setVisibleCount(5)
    setCostCenter("")
    setReason("")
    setJustification("")
    setOutboundPage(1)
    setReturnPage(1)
  }

  const handleSearch = async () => {
    // Validações básicas obrigatórias
    const isFlightOneWay = type === "flight" && tripMode === "one-way"
    
    if (!destination || !departureDate || !costCenter) {
      toast.error("Preencha todos os campos obrigatórios", {
        description: "Destino, datas e centro de custo são obrigatórios"
      })
      return
    }

    // Valida returnDate apenas se não for voo somente ida
    if (!isFlightOneWay && !returnDate) {
      toast.error("Preencha todos os campos obrigatórios", {
        description: "Destino, datas e centro de custo são obrigatórios"
      })
      return
    }

    // Validações específicas por tipo
    if (type === "flight" && !origin) {
      toast.error("Origem não preenchida", {
        description: "Selecione a origem (aeroporto de partida)"
      })
      return
    }

    if (type === "car") {
      // Validação adicional para carros
      const departDate = new Date(departureDate)
      const returnDate_obj = new Date(returnDate)
      
      if (departDate >= returnDate_obj) {
        toast.error("Datas inválidas", {
          description: "A data de devolução deve ser posterior à de retirada"
        })
        return
      }

      if (!destination || destination.trim().length === 0) {
        toast.error("Localização inválida", {
          description: "Informe a cidade ou localidade para retirada do carro"
        })
        return
      }
    }

    setIsSearching(true)
    setVisibleCount(5)
    setSelectedOptionId("")
    try {
      const isRoundTrip = type === "flight" && tripMode === "round-trip"
      const results = await searchOptionsAction(type, origin, destination, departureDate, returnDate, isRoundTrip)
      setOptions(results)
      if (results.length > 0) {
        let successMessage = `${results.length} opções encontradas!`
        let description = ""
        
        if (type === "flight") {
          description = isRoundTrip ? "Escolha o voo de ida e volta" : "Escolha seu voo"
        } else if (type === "hotel") {
          description = "Escolha sua hospedagem"
        } else if (type === "car") {
          // Verifica se tem IDs mockados
          const isMocked = results.some(r => r.id?.includes('mock'))
          description = isMocked 
            ? "Escolha seu veículo (opções de demonstração)"
            : "Escolha seu veículo"
        }

        toast.success(successMessage, { description })
      } else {
        toast.info("Nenhuma opção encontrada", {
          description: type === "car" 
            ? "Nenhum veículo disponível nesta localização e período. Tente outras datas."
            : "Tente ajustar os critérios de busca"
        })
      }
    } catch (error) {
      console.error("Erro ao pesquisar:", error)
      const errorMessage = type === "car"
        ? "Erro ao buscar carros. Verifique se a localização está correta."
        : "Erro ao pesquisar opções"
      toast.error(errorMessage, {
        description: "Tente novamente em alguns momentos"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectFromDialog = (optionId: string) => {
    if (type === "flight" && tripMode === "round-trip") {
      // Para round-trip, chama handleSelectOption que sabe qual é (outbound/return)
      handleSelectOption(optionId)
    } else {
      // Para one-way ou outro tipo, apenas marca como selecionado
      setSelectedOptionId(optionId)
    }
    setViewingOption(null) 
  }

  const handleSelectOption = (optionId: string) => {
    const selectedOption = options.find((o) => o.id === optionId)
    if (!selectedOption) return

    if (type === "flight" && tripMode === "round-trip") {
      if (selectedOption.legType === "outbound") {
        // Selecionou voo de ida
        setOutboundOption(selectedOption)
        toast.success("Voo de ida selecionado!", {
          description: "Agora escolha o voo de volta"
        })
      } else if (selectedOption.legType === "return") {
        // Selecionou voo de volta
        setReturnOption(selectedOption)
        toast.success("Voo de volta selecionado!", {
          description: "Ambos os voos foram selecionados. Proceda para o carrinho"
        })
      }
      setSelectedOptionId("")
    } else {
      // One-way ou não é voo
      setSelectedOptionId(optionId)
    }
  }

  const handleAddToCart = async () => {
    let finalOption: TravelOption | null = null
    
    if (type === "flight" && tripMode === "round-trip") {
      if (!outboundOption || !returnOption) {
        toast.error("Erro", { description: "Selecione os voos de ida e volta" })
        return
      }
      // Cria uma opção combinada para round-trip
      finalOption = {
        ...outboundOption,
        details: `${outboundOption.details} + ${returnOption.details}`,
        price: (outboundOption.price || 0) + (returnOption.price || 0)
      }
    } else {
      if (!selectedOptionId) {
        toast.error("Erro", { description: "Selecione uma opção" })
        return
      }
      finalOption = options.find((o) => o.id === selectedOptionId) || null
    }

    if (!finalOption || !reason) {
      toast.error("Erro", { description: "Selecione uma opção e descreva a justificativa" })
      return
    }

    // Valida se justificativa é obrigatória
    if (isJustificationRequired(finalOption.price, lowestPrice) && !justification) {
      toast.error("Erro", { description: "Justificativa é obrigatória para opções mais caras" })
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
      justification: justification || null,
      selectedOption: {
        ...finalOption,
        id: finalOption.id,
        provider: finalOption.provider,
        price: finalOption.price,
        details: finalOption.details,
        bookingUrl: finalOption.bookingUrl,
        departureTime: finalOption.departureTime,
        arrivalTime: finalOption.arrivalTime,
        flightNumber: finalOption.flightNumber,
        airplane: finalOption.airplane,
        legroom: finalOption.legroom,
        amenities: finalOption.amenities,
        airlineLogo: finalOption.airlineLogo,
        departureAirport: finalOption.departureAirport,
        arrivalAirport: finalOption.arrivalAirport,
        images: finalOption.images,
        rating: finalOption.rating,
        reviewsCount: finalOption.reviewsCount,
        locationDetails: finalOption.locationDetails,
        hotelAmenities: finalOption.hotelAmenities,
      },
      alternatives: options
        .filter((o) => o.id !== finalOption?.id)
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

    // Reseta o formulário
    setOptions([])
    setSelectedOptionId("")
    setOutboundOption(null)
    setReturnOption(null)
    setDestination("")
    setOrigin("")
    setDepartureDate("")
    setReturnDate("")
    setReason("")
    setJustification("")
    setOutboundPage(1)
    setReturnPage(1)
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
          <CardHeader>
            <CardTitle>Tipo de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={type} onValueChange={handleTypeChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="flight" className="gap-2"><Plane className="h-4 w-4" />Voo</TabsTrigger>
                <TabsTrigger value="hotel" className="gap-2"><Building2 className="h-4 w-4" />Hotel</TabsTrigger>
                <TabsTrigger value="car" className="gap-2"><Car className="h-4 w-4" />Carro</TabsTrigger>
              </TabsList>
            </Tabs>

            {type === "flight" && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <Label>Tipo de Viagem</Label>
                <div className="flex gap-3">
                  <Button 
                    variant={tripMode === "round-trip" ? "default" : "outline"}
                    onClick={() => setTripMode("round-trip")}
                    className="flex-1"
                  >
                    Ida e Volta
                  </Button>
                  <Button 
                    variant={tripMode === "one-way" ? "default" : "outline"}
                    onClick={() => setTripMode("one-way")}
                    className="flex-1"
                  >
                    Somente Ida
                  </Button>
                </div>
              </div>
            )}
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
                  <>
                    <Input 
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)} 
                      placeholder={type === "car" ? "Ex: São Paulo, Rio de Janeiro" : "Ex: São Paulo"}
                    />
                    {type === "car" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Cidades suportadas: São Paulo, Rio de Janeiro, Belo Horizonte, Brasília, Salvador, Porto Alegre, Curitiba, entre outras
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{type === "hotel" ? "Check-in" : type === "car" ? "Data de Retirada" : "Partida"}</Label>
                <Input 
                  type="date" 
                  value={departureDate} 
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>
              {(type !== "flight" || tripMode === "round-trip") && (
                <div className="space-y-2">
                  <Label>{type === "hotel" ? "Check-out" : type === "car" ? "Data de Devolução" : "Retorno"}</Label>
                  <Input 
                    type="date" 
                    value={returnDate} 
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                  />
                </div>
              )}
              {type === "flight" && tripMode === "one-way" && (
                <Input 
                  type="date" 
                  value={returnDate} 
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="hidden"
                />
              )}
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(s => s === "asc" ? "desc" : s === "desc" ? "none" : "asc")}
                    className="gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === "asc" ? "Menor preço" : sortOrder === "desc" ? "Maior preço" : "Ordenar"}
                  </Button>
                  <p className="text-xs text-muted-foreground">Exibindo {Math.min(visibleCount, options.length)} de {options.length}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {type === "flight" && tripMode === "round-trip" ? (
                <>
                  {/* Seção de voos de IDA */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-600">✈️ IDA</Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        {options.filter(o => o.legType === "outbound").length} opções
                      </span>
                      {outboundOption && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                    </div>
                    <div className="space-y-3">
                      {getSortedOptions(options.filter(o => o.legType === "outbound"))
                        .slice((outboundPage - 1) * itemsPerPage, outboundPage * itemsPerPage)
                        .map((option) => {
                          const isSelected = outboundOption?.id === option.id

                          return (
                            <div 
                              key={option.id} 
                              onClick={() => setViewingOption(option)}
                              className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-md ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-border hover:bg-secondary/50"}`}
                            >
                              <Avatar className="h-10 w-10 border bg-white shrink-0">
                                <AvatarImage src={option.airlineLogo} alt={option.provider} className="object-contain p-1" />
                                <AvatarFallback>{option.provider.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>

                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-lg">{option.provider}</p>
                                  <p className="text-lg font-bold text-blue-600">R$ {option.price.toLocaleString("pt-BR")}</p>
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

                              <Button 
                                variant={isSelected ? "default" : "secondary"} 
                                size="icon" 
                                className="shrink-0 pointer-events-none"
                              >
                                {isSelected ? <Check className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </Button>
                            </div>
                          )
                        })}
                    </div>

                    {/* Paginação para voos de IDA */}
                    {Math.ceil(options.filter(o => o.legType === "outbound").length / itemsPerPage) > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Página {outboundPage} de {Math.ceil(options.filter(o => o.legType === "outbound").length / itemsPerPage)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOutboundPage(p => Math.max(1, p - 1))}
                            disabled={outboundPage === 1}
                          >
                            ← Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOutboundPage(p => Math.min(Math.ceil(options.filter(o => o.legType === "outbound").length / itemsPerPage), p + 1))}
                            disabled={outboundPage === Math.ceil(options.filter(o => o.legType === "outbound").length / itemsPerPage)}
                          >
                            Próximo →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seção de voos de VOLTA */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">✈️ VOLTA</Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        {options.filter(o => o.legType === "return").length} opções
                      </span>
                      {returnOption && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                    </div>
                    <div className="space-y-3">
                      {getSortedOptions(options.filter(o => o.legType === "return"))
                        .slice((returnPage - 1) * itemsPerPage, returnPage * itemsPerPage)
                        .map((option) => {
                          const isSelected = returnOption?.id === option.id

                          return (
                            <div 
                              key={option.id} 
                              onClick={() => setViewingOption(option)}
                              className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-md ${isSelected ? "border-green-500 bg-green-50 shadow-sm" : "border-border hover:bg-secondary/50"}`}
                            >
                              <Avatar className="h-10 w-10 border bg-white shrink-0">
                                <AvatarImage src={option.airlineLogo} alt={option.provider} className="object-contain p-1" />
                                <AvatarFallback>{option.provider.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>

                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-lg">{option.provider}</p>
                                  <p className="text-lg font-bold text-green-600">R$ {option.price.toLocaleString("pt-BR")}</p>
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

                              <Button 
                                variant={isSelected ? "default" : "secondary"} 
                                size="icon" 
                                className="shrink-0 pointer-events-none"
                              >
                                {isSelected ? <Check className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </Button>
                            </div>
                          )
                        })}
                    </div>

                    {/* Paginação para voos de VOLTA */}
                    {Math.ceil(options.filter(o => o.legType === "return").length / itemsPerPage) > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Página {returnPage} de {Math.ceil(options.filter(o => o.legType === "return").length / itemsPerPage)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReturnPage(p => Math.max(1, p - 1))}
                            disabled={returnPage === 1}
                          >
                            ← Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReturnPage(p => Math.min(Math.ceil(options.filter(o => o.legType === "return").length / itemsPerPage), p + 1))}
                            disabled={returnPage === Math.ceil(options.filter(o => o.legType === "return").length / itemsPerPage)}
                          >
                            Próximo →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Exibição normal para one-way ou outro tipo */
                <>
                  {getSortedOptions(options).slice(0, visibleCount).map((option) => {
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
                </>
              )}
            </CardContent>
          </Card>
        )}

        {selectedOptionId && (
          <Card className="border-primary/20 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
            <CardHeader><CardTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> Opção Selecionada & Justificativa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Selecionou a opção fornecida por <strong>{options.find(o => o.id === selectedOptionId)?.provider}</strong>. Justifique a sua escolha para o aprovador.</p>
              
              {/* Aviso se não for a opção mais barata */}
              {isJustificationRequired(options.find(o => o.id === selectedOptionId)?.price, lowestPrice) && (
                <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Justificativa Obrigatória</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Você escolheu uma opção por R$ {options.find(o => o.id === selectedOptionId)?.price.toLocaleString("pt-BR")} quando existe uma opção mais barata por R$ {lowestPrice?.toLocaleString("pt-BR")}. 
                      Por favor, justifique por que escolheu essa opção mais cara.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>
                  Motivo da Solicitação
                  {isJustificationRequired(options.find(o => o.id === selectedOptionId)?.price, lowestPrice) ? (
                    <span className="text-red-500 ml-1">*</span>
                  ) : null}
                </Label>
                <Textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="Descreva o motivo desta solicitação..." 
                  rows={3} 
                  className="resize-none" 
                />
              </div>

              {/* Campo de justificativa (visível apenas se obrigatório) */}
              {isJustificationRequired(options.find(o => o.id === selectedOptionId)?.price, lowestPrice) && (
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label htmlFor="justification">
                    Justificativa para Opção Mais Cara
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explique por que escolheu uma opção mais cara (ex: horário melhor, conexões diretas, comodidade, etc.)..."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-blue-600 mt-1">Este campo é obrigatório para opções que não são a mais barata disponível.</p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button 
                  onClick={handleAddToCart} 
                  disabled={isSubmitting || !reason || (isJustificationRequired(options.find(o => o.id === selectedOptionId)?.price, lowestPrice) && !justification)} 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Adicionando..." : "Adicionar ao Carrinho"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedOptionId("")}>Trocar Seleção</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {type === "flight" && tripMode === "round-trip" && (outboundOption || returnOption) && (
          <Card className="border-green-200 bg-green-50 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                {outboundOption && returnOption ? "✅ Ambos os voos selecionados" : outboundOption ? "✈️ Voo de ida selecionado" : "✈️ Voo de volta selecionado"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {outboundOption && (
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="mb-2">Ida</Badge>
                      <p className="font-semibold">{outboundOption.provider}</p>
                      <p className="text-sm text-muted-foreground">{outboundOption.departureTime} → {outboundOption.arrivalTime}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">R$ {outboundOption.price.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {returnOption && (
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">Volta</Badge>
                      <p className="font-semibold">{returnOption.provider}</p>
                      <p className="text-sm text-muted-foreground">{returnOption.departureTime} → {returnOption.arrivalTime}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">R$ {returnOption.price.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                </div>
              )}

              {outboundOption && returnOption && (
                <>
                  {/* Aviso se combinação não for a mais barata */}
                  {isJustificationRequired((outboundOption.price || 0) + (returnOption.price || 0), lowestPrice) && (
                    <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900">Justificativa Obrigatória</p>
                        <p className="text-sm text-amber-800 mt-1">
                          O custo total dos voos selecionados (R$ {((outboundOption.price || 0) + (returnOption.price || 0)).toLocaleString("pt-BR")}) é maior que a opção mais barata (R$ {lowestPrice?.toLocaleString("pt-BR")}). 
                          Por favor, justifique por que escolheu essas opções.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      Motivo da Solicitação
                      {isJustificationRequired((outboundOption.price || 0) + (returnOption.price || 0), lowestPrice) ? (
                        <span className="text-red-500 ml-1">*</span>
                      ) : null}
                    </Label>
                    <Textarea 
                      value={reason} 
                      onChange={(e) => setReason(e.target.value)} 
                      placeholder="Descreva o motivo desta solicitação..." 
                      rows={3} 
                      className="resize-none" 
                    />
                  </div>

                  {/* Campo de justificativa (visível apenas se obrigatório) */}
                  {isJustificationRequired((outboundOption.price || 0) + (returnOption.price || 0), lowestPrice) && (
                    <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label htmlFor="justification-round">
                        Justificativa para Opção Mais Cara
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Textarea
                        id="justification-round"
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Explique por que escolheu opções mais caras (ex: horários melhores, menos conexões, comodidade, etc.)..."
                        rows={3}
                        className="resize-none"
                      />
                      <p className="text-xs text-blue-600 mt-1">Este campo é obrigatório para opções que não são as mais baratas disponíveis.</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <Button 
                      onClick={handleAddToCart} 
                      disabled={isSubmitting || !reason || (isJustificationRequired((outboundOption.price || 0) + (returnOption.price || 0), lowestPrice) && !justification)} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Adicionando..." : "Adicionar ao Carrinho"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setOutboundOption(null)
                      setReturnOption(null)
                      setOptions([])
                    }}>Trocar Voos</Button>
                  </div>
                </>
              )}
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
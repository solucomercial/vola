"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequestTypeIcon } from "@/components/request-type-icon"
import { ArrowLeft, Plane, Building2, Car, Check, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { searchOptionsAction, createTravelRequestAction } from "@/app/actions/travel-requests"
import { type TravelOption } from "@/lib/amadeus"

export default function NewRequestPage() {
  const router = useRouter()
  const { currentUser } = useApp()

  const [type, setType] = useState<"flight" | "hotel" | "car">("flight")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [reason, setReason] = useState("")
  const [options, setOptions] = useState<TravelOption[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSearch = async () => {
    if (!origin || !destination || !departureDate || !returnDate) return

    setIsSearching(true)
    try {
      const results = await searchOptionsAction(type, origin, destination, departureDate)
      setOptions(results)
      setSelectedOptionId(results[0]?.id || "")
    } catch (error) {
      console.error("Erro ao pesquisar:", error)
    } finally {
      setIsSearching(false)
    }
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
        origin,
        destination,
        departureDate,
        returnDate,
        reason,
        selectedOption,
        alternatives: options.filter((o) => o.id !== selectedOptionId),
      })

      if (result.success) {
        router.push("/requests")
      } else {
        alert("Erro ao guardar a solicitação.")
      }
    } catch (error) {
      console.error("Erro ao submeter:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cheapestOption = options.length > 0 
    ? options.reduce((min, opt) => (opt.price < min.price ? opt : min), options[0])
    : null

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nova Solicitação</h1>
            <p className="text-muted-foreground">Pesquise opções reais via API Amadeus</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={type} onValueChange={(v) => setType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="flight" className="gap-2"><Plane className="h-4 w-4" />Voo</TabsTrigger>
                <TabsTrigger value="hotel" className="gap-2"><Building2 className="h-4 w-4" />Hotel</TabsTrigger>
                <TabsTrigger value="car" className="gap-2"><Car className="h-4 w-4" />Carro</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes da Viagem</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Origem (Ex: GRU)</Label>
                <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Código IATA" />
              </div>
              <div className="space-y-2">
                <Label>Destino (Ex: GIG)</Label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Código IATA" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Partida</Label>
                <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Retorno</Label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="w-full sm:w-auto">
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Pesquisar Opções
            </Button>
          </CardContent>
        </Card>

        {options.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Opções Disponíveis</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={selectedOptionId} onValueChange={setSelectedOptionId} className="space-y-3">
                {options.map((option) => {
                  const isCheapest = cheapestOption?.id === option.id
                  return (
                    <label key={option.id} className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${selectedOptionId === option.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}>
                      <RadioGroupItem value={option.id} className="sr-only" />
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selectedOptionId === option.id ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                        {selectedOptionId === option.id && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{option.provider}</p>
                          {isCheapest && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Melhor Preço</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">{option.details}</p>
                        {option.departureTime && <p className="text-sm text-muted-foreground">{option.departureTime} - {option.arrivalTime}</p>}
                      </div>
                      <p className="text-lg font-bold">R$ {option.price.toLocaleString("pt-BR")}</p>
                    </label>
                  )
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {options.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Justificativa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Finalidade da viagem..." rows={3} />
              <div className="flex gap-4">
                <Button onClick={handleSubmit} disabled={isSubmitting || !reason} className="flex-1">
                  {isSubmitting ? "A guardar..." : "Submeter Solicitação"}
                </Button>
                <Link href="/requests"><Button variant="outline">Cancelar</Button></Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
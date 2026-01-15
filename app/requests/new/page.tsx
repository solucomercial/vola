"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useApp, type RequestType, type TravelOption } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequestTypeIcon } from "@/components/request-type-icon"
import { ArrowLeft, Plane, Building2, Car, Check, Sparkles } from "lucide-react"
import Link from "next/link"

// Mock travel options generator
function generateMockOptions(type: RequestType, origin: string, destination: string): TravelOption[] {
  const providers: Record<RequestType, string[]> = {
    flight: ["LATAM", "GOL", "Azul"],
    hotel: ["Marriott", "Hilton", "Windsor"],
    car: ["Localiza", "Unidas", "Movida"],
  }

  const basePrice: Record<RequestType, number> = {
    flight: 600,
    hotel: 400,
    car: 150,
  }

  return providers[type].map((provider, index) => ({
    id: `opt-${Date.now()}-${index}`,
    provider,
    price: basePrice[type] + Math.floor(Math.random() * 300) - 100,
    details:
      type === "flight"
        ? `Direct flight, ${index === 0 ? "Economy" : index === 1 ? "Economy Plus" : "Business"}`
        : type === "hotel"
          ? `${index === 0 ? "Standard" : index === 1 ? "Deluxe" : "Suite"} Room`
          : `${index === 0 ? "Compact" : index === 1 ? "Sedan" : "SUV"} Car`,
    departureTime: type === "flight" ? `${8 + index * 2}:00` : undefined,
    arrivalTime: type === "flight" ? `${9 + index * 2}:30` : undefined,
    duration: type === "flight" ? "1h 30m" : undefined,
  }))
}

export default function NewRequestPage() {
  const router = useRouter()
  const { addRequest, currentUser } = useApp()

  const [type, setType] = useState<RequestType>("flight")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [reason, setReason] = useState("")
  const [options, setOptions] = useState<TravelOption[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    if (!origin || !destination || !departureDate || !returnDate) return

    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      const mockOptions = generateMockOptions(type, origin, destination)
      setOptions(mockOptions)
      setSelectedOptionId(mockOptions[0]?.id || "")
      setIsSearching(false)
    }, 1000)
  }

  const handleSubmit = () => {
    if (!selectedOptionId || !reason) return

    const selectedOption = options.find((o) => o.id === selectedOptionId)
    if (!selectedOption) return

    addRequest({
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

    router.push("/requests")
  }

  const getCheapestOption = () => {
    if (options.length === 0) return null
    return options.reduce((min, opt) => (opt.price < min.price ? opt : min), options[0])
  }

  const cheapestOption = getCheapestOption()

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">New Travel Request</h1>
            <p className="text-muted-foreground">Search for options and submit for approval</p>
          </div>
        </div>

        {/* Request Type */}
        <Card>
          <CardHeader>
            <CardTitle>Request Type</CardTitle>
            <CardDescription>What type of travel service do you need?</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={type}
              onValueChange={(v) => {
                setType(v as RequestType)
                setOptions([])
                setSelectedOptionId("")
              }}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="flight" className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Flight
                </TabsTrigger>
                <TabsTrigger value="hotel" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Hotel
                </TabsTrigger>
                <TabsTrigger value="car" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Car Rental
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
            <CardDescription>Enter your travel information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  placeholder={type === "flight" ? "São Paulo (GRU)" : "São Paulo"}
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder={type === "flight" ? "Rio de Janeiro (GIG)" : "Rio de Janeiro"}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departure">{type === "hotel" ? "Check-in" : "Departure"}</Label>
                <Input
                  id="departure"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return">{type === "hotel" ? "Check-out" : "Return"}</Label>
                <Input id="return" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={!origin || !destination || !departureDate || !returnDate || isSearching}
              className="w-full sm:w-auto"
            >
              {isSearching ? (
                "Searching..."
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Search Options
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Options */}
        {options.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Options</CardTitle>
              <CardDescription>
                Select your preferred option. Alternatives will be shown to the approver.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedOptionId} onValueChange={setSelectedOptionId} className="space-y-3">
                {options.map((option) => {
                  const isCheapest = cheapestOption?.id === option.id
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                        selectedOptionId === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary/50"
                      }`}
                    >
                      <RadioGroupItem value={option.id} className="sr-only" />
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selectedOptionId === option.id ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                      >
                        {selectedOptionId === option.id && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <RequestTypeIcon type={type} className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{option.provider}</p>
                          {isCheapest && (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Best Price
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{option.details}</p>
                        {option.departureTime && (
                          <p className="text-sm text-muted-foreground">
                            {option.departureTime} - {option.arrivalTime} ({option.duration})
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isCheapest ? "text-emerald-600" : "text-foreground"}`}>
                          R$ {option.price.toLocaleString("pt-BR")}
                        </p>
                        {selectedOptionId === option.id && <p className="text-xs text-primary">Selected</p>}
                      </div>
                    </label>
                  )
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Reason */}
        {options.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reason for Travel</CardTitle>
              <CardDescription>Provide a brief justification for this travel request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter the business purpose and justification for this trip..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-4">
                <Button onClick={handleSubmit} disabled={!selectedOptionId || !reason} className="flex-1 sm:flex-none">
                  Submit Request
                </Button>
                <Link href="/requests">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

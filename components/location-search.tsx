"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchLocationsAction } from "@/app/actions/travel-requests"
import { type LocationOption } from "@/lib/travel-api"
import { Loader2, X, MapPin } from "lucide-react"

interface LocationSearchProps {
  value: string
  iataCode: string
  onChange: (iataCode: string, displayValue: string) => void
  placeholder?: string
}

export function LocationSearch({
  value,
  iataCode,
  onChange,
  placeholder = "Digite origem ou destino...",
}: LocationSearchProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<LocationOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Busca locais com debounce
  const fetchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      console.log(`[Component] Chamando searchLocationsAction com: "${query}"`)
      const results = await searchLocationsAction(query)
      console.log(`[Component] Recebeu ${results.length} resultados:`, results)
      setSuggestions(results)
      setSelectedIndex(-1)
    } catch (error) {
      console.error("[Component] Erro ao buscar locais:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)

    // Limpa timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounce de 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      console.log(`[LocationSearch] Buscando por: "${newValue}"`)
      fetchLocations(newValue)
    }, 300)
  }

  const handleSelectLocation = (location: LocationOption) => {
    const displayValue = `${location.city}${location.state ? ` - ${location.state}` : ""}${location.country ? ` (${location.country})` : ""}`
    setInputValue(displayValue)
    onChange(location.iata, displayValue)
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    setInputValue("")
    onChange("", "")
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Trata navegação do teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectLocation(suggestions[selectedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  // Fecha quando clica fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {!isLoading && inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sugestões */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((location, index) => (
            <button
              key={`${location.iata}-${index}`}
              onClick={() => handleSelectLocation(location)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary text-foreground"
              } ${index !== suggestions.length - 1 ? "border-b border-border" : ""}`}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {location.city}
                    {location.state && ` - ${location.state}`}
                    {location.country && ` (${location.country})`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {location.name}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded whitespace-nowrap">
                  {location.iata}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {isOpen && !isLoading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-muted-foreground"
        >
          Nenhum local encontrado
        </div>
      )}

      {/* Código IATA selecionado (debug) */}
      {iataCode && (
        <div className="text-xs text-muted-foreground mt-1">
          Código: <span className="font-mono font-bold text-primary">{iataCode}</span>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Loader2, Check } from "lucide-react"

interface ComparisonDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  request: any | null
  onApprove: (selectedOption?: any) => void
  onReject: () => void
  isProcessing: boolean
}

export function ComparisonDialog({
  isOpen,
  onOpenChange,
  request,
  onApprove,
  onReject,
  isProcessing
}: ComparisonDialogProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  if (!request) return null

  // Combina e ordena as opcións polo prezo máis baixo
  const allSortedOptions = [
    request.selectedOption,
    ...(request.alternatives || [])
  ].sort((a: any, b: any) => a.price - b.price)

  const cheapestPrice = allSortedOptions[0].price
  const selectedOption = allSortedOptions.find(opt => opt.id === selectedOptionId)

  const handleApproveSelected = () => {
    if (selectedOption) {
      onApprove(selectedOption)
    } else {
      onApprove()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Análise de Menor Prezo
          </DialogTitle>
          <DialogDescription>
            Comparación de todas as opcións dispoñibles para esta solicitude. Clique para selecionar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {allSortedOptions.map((option: any, idx: number) => {
            const isUserChoice = option.id === request.selectedOption.id
            const isCheapest = idx === 0
            const isSelected = option.id === selectedOptionId
            const priceDiff = option.price - cheapestPrice

            return (
              <div 
                key={option.id}
                onClick={() => setSelectedOptionId(option.id)}
                className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md" 
                    : isUserChoice 
                    ? "border-primary bg-primary/5 shadow-sm hover:shadow-md" 
                    : "border-border bg-card hover:shadow-md"
                }`}
              >
                {isUserChoice && (
                  <Badge className="absolute -top-2 -right-2 bg-primary">Escolha do Usuário</Badge>
                )}
                {isCheapest && !isUserChoice && (
                  <Badge variant="outline" className="absolute -top-2 -right-2 border-emerald-500 text-emerald-700 bg-white">Mais Barato</Badge>
                )}
                {isSelected && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-500 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Selecionada
                  </Badge>
                )}

                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground leading-none">{option.provider}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                      {option.details}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${isCheapest ? "text-emerald-600" : "text-foreground"}`}>
                      R$ {option.price.toLocaleString("pt-BR")}
                    </p>
                    {priceDiff > 0 && (
                      <p className="text-[10px] text-amber-600 font-bold">
                        + R$ {priceDiff.toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selectedOption && selectedOption.id !== request.selectedOption.id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
            <p className="text-sm text-blue-900">
              <span className="font-bold">Opção selecionada:</span> {selectedOption.provider} - R$ {selectedOption.price.toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0 pt-2 border-t">
          <Button 
            variant="ghost" 
            onClick={onReject} 
            disabled={isProcessing}
            className="flex-1 text-destructive hover:bg-destructive/5"
          >
            Rejeitar Escolha
          </Button>
          <Button 
            onClick={handleApproveSelected} 
            disabled={isProcessing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Aprovar Escolha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
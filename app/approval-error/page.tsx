// app/approval-error/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

function ApprovalErrorContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'unknown'

  const errorMessages: Record<string, { title: string; description: string }> = {
    'not-found': {
      title: 'Solicitação Não Encontrada',
      description: 'A solicitação que você tentou aprovar/rejeitar não existe ou já foi processada.',
    },
    'server-error': {
      title: 'Erro no Servidor',
      description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
    },
    'invalid-params': {
      title: 'Parâmetros Inválidos',
      description: 'O link de aprovação é inválido ou expirou.',
    },
    unknown: {
      title: 'Erro Desconhecido',
      description: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    },
  }

  const error = errorMessages[reason] || errorMessages.unknown

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">{error.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-gray-700">{error.description}</p>
          </div>

          <div className="space-y-3">
            <Link href="/analysis" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                <RefreshCw className="w-4 h-4" />
                Voltar para Análise
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Ir para Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ApprovalErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">Carregando...</div>}>
      <ApprovalErrorContent />
    </Suspense>
  )
}

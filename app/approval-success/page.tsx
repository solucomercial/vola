// app/approval-success/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Home, FileCheck } from 'lucide-react'
import Link from 'next/link'

export default function ApprovalSuccessPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || 'approved'
  const message = searchParams.get('message') || 'Operação concluída'
  const requestId = searchParams.get('requestId')

  const isApproved = status === 'approve'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pt-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isApproved ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isApproved ? (
              <Check className="w-8 h-8 text-green-600" />
            ) : (
              <X className="w-8 h-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isApproved ? '✓ Aprovado com Sucesso!' : '✗ Rejeitado'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-600">ID da Solicitação:</p>
            <p className="text-sm font-mono text-gray-800 break-all">{requestId}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Resultado:</span> {message}
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/analysis" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                <FileCheck className="w-4 h-4" />
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
            Esta página será redirecionada automaticamente em 10 segundos.
          </p>
        </CardContent>
      </Card>

      <script>
        {`
          setTimeout(() => {
            window.location.href = '/analysis';
          }, 10000);
        `}
      </script>
    </div>
  )
}

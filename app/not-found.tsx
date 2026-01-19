import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AlertCircle, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-lg mt-2">Página não encontrada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>A página que você está procurando não existe ou foi movida.</p>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button className="w-full" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Ir para Dashboard
              </Button>
            </Link>

            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Voltar ao Início
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>Se você acredita que isso é um erro, entre em contato com o suporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plane, Building2, Car, CheckCircle2, BarChart3, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
              <Image src="/solu-web.jpeg" alt="Soluções Serviços Terceirizados" width={40} height={40} priority />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Soluções Serviços Terceirizados</span>
              <span className="text-xs text-muted-foreground">Plataforma de Viagens</span>
            </div>
          </div>
          <Link href="/dashboard">
            <Button>Entrar na Plataforma</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-white py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <img src="/logo-solu-web.jpeg" alt="Soluções Serviços Terceirizados" className="mx-auto h-40 w-auto pb-4" />
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Plataforma de Gestão de Viagens Corporativas
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              Simplifique as viagens da sua empresa com fluxos de aprovação automatizados, controle de custos e relatórios abrangentes. Desenvolvido para Soluções Serviços Terceirizados.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Acessar Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                Saber mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Tudo o que você precisa</h2>
            <p className="mt-4 text-muted-foreground">Solução completa de gestão de viagens para sua organização</p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Reserva de voo</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Compare as opções de voo de diversas companhias aéreas e selecione a melhor opção para a sua viagem.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Reservas de hotéis</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reserve acomodações com preços transparentes e opções em conformidade com as políticas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Locação de Carro</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Alugue veículos no seu destino com preços competitivos e opções completas de seguro.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Fluxo de trabalho de aprovação</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Processo de aprovação simplificado com notificações e acompanhamento para todas as partes interessadas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Análises e relatórios</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Relatórios abrangentes sobre gastos com viagens, tendências e oportunidades de otimização de custos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">Conformidade com a Política</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Garanta que todas as solicitações de viagem estejam em conformidade com as políticas da empresa e os limites orçamentários.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
                <Image src="/logo-solu-web.jpeg" alt="Soluções Serviços Terceirizados" width={40} height={40} />
              </div>
              <span className="text-sm font-semibold text-foreground">Soluções Serviços Terceirizados</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Corporate Travel Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

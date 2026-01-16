import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AppProvider } from "@/context/app-context"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Corporate Travel Platform - Soluções Serviços Terceirizados",
  description: "Manage corporate travel requests, approvals, and reporting efficiently",
}

export const viewport: Viewport = {
  themeColor: "#3B5998",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br">
      <body className="font-sans antialiased">
        <AppProvider>{children}</AppProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

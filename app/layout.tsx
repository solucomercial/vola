import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/context/app-context"

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
    <html lang="en">
      <body className="font-sans antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}

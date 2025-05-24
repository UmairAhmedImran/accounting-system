import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CurrencyProvider } from "@/context/currency-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Accounting & Inventory Management System",
  description: "A full-stack accounting and inventory management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  )
}

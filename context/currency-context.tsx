"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define currency types and exchange rates
export type CurrencyCode = "USD" | "GBP" | "AUD" | "PKR" | "INR"

interface CurrencyInfo {
  code: CurrencyCode
  symbol: string
  name: string
  exchangeRate: number // Rate relative to USD
}

const currencies: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", exchangeRate: 1 },
  GBP: { code: "GBP", symbol: "£", name: "UK Pound", exchangeRate: 0.79 },
  AUD: { code: "AUD", symbol: "$", name: "Australian Dollar", exchangeRate: 1.52 },
  PKR: { code: "PKR", symbol: "₨", name: "Pakistani Rupee", exchangeRate: 278.5 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", exchangeRate: 83.2 },
}

interface CurrencyContextType {
  currency: CurrencyInfo
  setCurrencyCode: (code: CurrencyCode) => void
  formatCurrency: (amount: number) => string
  convertToBaseCurrency: (amount: number) => number
  convertFromBaseCurrency: (amount: number) => number
  currencies: Record<CurrencyCode, CurrencyInfo>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("USD")
  const [currency, setCurrency] = useState<CurrencyInfo>(currencies.USD)

  useEffect(() => {
    // Update currency when currency code changes
    setCurrency(currencies[currencyCode])

    // Save preference to localStorage
    localStorage.setItem("preferredCurrency", currencyCode)
  }, [currencyCode])

  useEffect(() => {
    // Load saved preference from localStorage on initial load
    const savedCurrency = localStorage.getItem("preferredCurrency") as CurrencyCode | null
    if (savedCurrency && currencies[savedCurrency]) {
      setCurrencyCode(savedCurrency)
    }
  }, [])

  // Convert amount from USD to selected currency
  const convertFromBaseCurrency = (amount: number): number => {
    return amount * currency.exchangeRate
  }

  // Convert amount from selected currency to USD
  const convertToBaseCurrency = (amount: number): number => {
    return amount / currency.exchangeRate
  }

  // Format amount in selected currency
  const formatCurrency = (amount: number): string => {
    const convertedAmount = convertFromBaseCurrency(amount)

    // Special case for PKR and INR which typically don't show decimal places
    const fractionDigits = ["PKR", "INR"].includes(currency.code) ? 0 : 2

    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(convertedAmount)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrencyCode,
        formatCurrency,
        convertToBaseCurrency,
        convertFromBaseCurrency,
        currencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useCurrency } from "@/context/currency-context"

interface TrialBalanceItem {
  account: {
    _id: string
    name: string
    code: string
    type: string
  }
  debit: number
  credit: number
}

interface TrialBalanceData {
  trialBalance: TrialBalanceItem[]
  totals: {
    debit: number
    credit: number
    isBalanced: boolean
  }
}

export default function TrialBalancePage() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null)
  const [adjustedTrialBalance, setAdjustedTrialBalance] = useState<TrialBalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    fetchTrialBalance()
    fetchAdjustedTrialBalance()
  }, [])

  const fetchTrialBalance = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/trial-balance")

      if (!response.ok) {
        throw new Error("Failed to fetch trial balance")
      }

      const data = await response.json()
      setTrialBalance(data)
    } catch (error) {
      console.error("Error fetching trial balance:", error)
      toast({
        title: "Error",
        description: "Failed to load trial balance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAdjustedTrialBalance = async () => {
    try {
      const response = await fetch("/api/trial-balance/adjusted")

      if (!response.ok) {
        throw new Error("Failed to fetch adjusted trial balance")
      }

      const data = await response.json()
      setAdjustedTrialBalance(data)
    } catch (error) {
      console.error("Error fetching adjusted trial balance:", error)
      toast({
        title: "Error",
        description: "Failed to load adjusted trial balance. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderTrialBalanceTable = (data: TrialBalanceData | null) => {
    if (!data) {
      return (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">No data available.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Account Code</th>
              <th className="px-4 py-2 text-left">Account Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-right">Debit</th>
              <th className="px-4 py-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.trialBalance.map((item) => (
              <tr key={item.account._id} className="border-b">
                <td className="px-4 py-2">{item.account.code}</td>
                <td className="px-4 py-2">{item.account.name}</td>
                <td className="px-4 py-2 capitalize">{item.account.type}</td>
                <td className="px-4 py-2 text-right">{item.debit > 0 ? formatCurrency(item.debit) : ""}</td>
                <td className="px-4 py-2 text-right">{item.credit > 0 ? formatCurrency(item.credit) : ""}</td>
              </tr>
            ))}
            <tr className="border-b bg-muted/50 font-bold">
              <td className="px-4 py-2" colSpan={3}>
                Totals
              </td>
              <td className="px-4 py-2 text-right">{formatCurrency(data.totals.debit)}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(data.totals.credit)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 text-right">
          {data.totals.isBalanced ? (
            <span className="text-sm text-green-600">✓ Trial balance is balanced</span>
          ) : (
            <span className="text-sm text-red-600">
              ✗ Trial balance is out of balance by {formatCurrency(Math.abs(data.totals.debit - data.totals.credit))}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
          <CardDescription>View the unadjusted and adjusted trial balance for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unadjusted">
            <TabsList className="mb-4">
              <TabsTrigger value="unadjusted">Unadjusted</TabsTrigger>
              <TabsTrigger value="adjusted">Adjusted</TabsTrigger>
            </TabsList>

            <TabsContent value="unadjusted">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p>Loading trial balance...</p>
                </div>
              ) : (
                renderTrialBalanceTable(trialBalance)
              )}
            </TabsContent>

            <TabsContent value="adjusted">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p>Loading adjusted trial balance...</p>
                </div>
              ) : (
                renderTrialBalanceTable(adjustedTrialBalance)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

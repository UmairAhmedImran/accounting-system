"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// Add the useCurrency import
import { useCurrency } from "@/context/currency-context"

interface AccountItem {
  _id: string
  name: string
  code: string
  balance: number
}

interface IncomeStatement {
  startDate: string | null
  endDate: string | null
  revenue: {
    accounts: AccountItem[]
    total: number
  }
  expenses: {
    accounts: AccountItem[]
    total: number
  }
  netIncome: number
}

interface BalanceSheet {
  date: string
  assets: {
    accounts: AccountItem[]
    total: number
  }
  liabilities: {
    accounts: AccountItem[]
    total: number
  }
  equity: {
    accounts: AccountItem[]
    total: number
  }
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
}

export default function FinancialsPage() {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null)
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{
    startDate: Date | undefined
    endDate: Date | undefined
  }>({
    startDate: undefined,
    endDate: undefined,
  })

  // Inside the component, add this line near the top
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    fetchFinancials()
  }, [])

  const fetchFinancials = async () => {
    try {
      setLoading(true)

      // Fetch income statement
      let url = "/api/financials/income-statement"
      const params = new URLSearchParams()

      if (dateRange.startDate) {
        params.append("startDate", dateRange.startDate.toISOString())
      }

      if (dateRange.endDate) {
        params.append("endDate", dateRange.endDate.toISOString())
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const incomeResponse = await fetch(url)

      if (!incomeResponse.ok) {
        throw new Error("Failed to fetch income statement")
      }

      const incomeData = await incomeResponse.json()
      setIncomeStatement(incomeData)

      // Fetch balance sheet
      const balanceResponse = await fetch("/api/financials/balance-sheet")

      if (!balanceResponse.ok) {
        throw new Error("Failed to fetch balance sheet")
      }

      const balanceData = await balanceResponse.json()
      setBalanceSheet(balanceData)
    } catch (error) {
      console.error("Error fetching financials:", error)
      toast({
        title: "Error",
        description: "Failed to load financial statements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    fetchFinancials()
  }

  const handleReset = () => {
    setDateRange({
      startDate: undefined,
      endDate: undefined,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Financial Statements</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Select a date range for the income statement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.startDate ? format(dateRange.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.startDate}
                    onSelect={(date) => setDateRange((prev) => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.endDate ? format(dateRange.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.endDate}
                    onSelect={(date) => setDateRange((prev) => ({ ...prev, endDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleReset} className="mr-2">
              Reset
            </Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="income">
        <TabsList className="mb-4">
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Statement</CardTitle>
              <CardDescription>
                {incomeStatement?.startDate && incomeStatement?.endDate ? (
                  <>
                    For the period {format(new Date(incomeStatement.startDate), "MMMM d, yyyy")} to{" "}
                    {format(new Date(incomeStatement.endDate), "MMMM d, yyyy")}
                  </>
                ) : (
                  "For the current period"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p>Loading income statement...</p>
                </div>
              ) : !incomeStatement ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No data available.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-2 text-lg font-bold" colSpan={2}>
                          Revenue
                        </td>
                      </tr>

                      {incomeStatement.revenue.accounts.map((account) => (
                        <tr key={account._id} className="border-b">
                          <td className="px-4 py-2 pl-8">{account.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(account.balance)}</td>
                        </tr>
                      ))}

                      <tr className="border-b bg-muted/30">
                        <td className="px-4 py-2 font-medium">Total Revenue</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(incomeStatement.revenue.total)}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="px-4 py-2 text-lg font-bold" colSpan={2}>
                          Expenses
                        </td>
                      </tr>

                      {incomeStatement.expenses.accounts.map((account) => (
                        <tr key={account._id} className="border-b">
                          <td className="px-4 py-2 pl-8">{account.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(account.balance)}</td>
                        </tr>
                      ))}

                      <tr className="border-b bg-muted/30">
                        <td className="px-4 py-2 font-medium">Total Expenses</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(incomeStatement.expenses.total)}
                        </td>
                      </tr>

                      <tr className="border-b bg-muted/50 font-bold">
                        <td className="px-4 py-2 text-lg">Net Income</td>
                        <td className="px-4 py-2 text-right text-lg">{formatCurrency(incomeStatement.netIncome)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                {balanceSheet?.date ? <>As of {format(new Date(balanceSheet.date), "MMMM d, yyyy")}</> : "As of today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p>Loading balance sheet...</p>
                </div>
              ) : !balanceSheet ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No data available.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-2 text-lg font-bold" colSpan={2}>
                          Assets
                        </td>
                      </tr>

                      {balanceSheet.assets.accounts.map((account) => (
                        <tr key={account._id} className="border-b">
                          <td className="px-4 py-2 pl-8">{account.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(account.balance)}</td>
                        </tr>
                      ))}

                      <tr className="border-b bg-muted/30">
                        <td className="px-4 py-2 font-medium">Total Assets</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(balanceSheet.assets.total)}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="px-4 py-2 text-lg font-bold" colSpan={2}>
                          Liabilities
                        </td>
                      </tr>

                      {balanceSheet.liabilities.accounts.map((account) => (
                        <tr key={account._id} className="border-b">
                          <td className="px-4 py-2 pl-8">{account.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(account.balance)}</td>
                        </tr>
                      ))}

                      <tr className="border-b bg-muted/30">
                        <td className="px-4 py-2 font-medium">Total Liabilities</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(balanceSheet.liabilities.total)}
                        </td>
                      </tr>

                      <tr className="border-b">
                        <td className="px-4 py-2 text-lg font-bold" colSpan={2}>
                          Equity
                        </td>
                      </tr>

                      {balanceSheet.equity.accounts.map((account) => (
                        <tr key={account._id} className="border-b">
                          <td className="px-4 py-2 pl-8">{account.name}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(account.balance)}</td>
                        </tr>
                      ))}

                      <tr className="border-b bg-muted/30">
                        <td className="px-4 py-2 font-medium">Total Equity</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(balanceSheet.equity.total)}
                        </td>
                      </tr>

                      <tr className="border-b bg-muted/50 font-bold">
                        <td className="px-4 py-2 text-lg">Total Liabilities & Equity</td>
                        <td className="px-4 py-2 text-right text-lg">
                          {formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-4 text-right">
                    {balanceSheet.isBalanced ? (
                      <span className="text-sm text-green-600">✓ Balance sheet is balanced</span>
                    ) : (
                      <span className="text-sm text-red-600">
                        ✗ Balance sheet is out of balance by{" "}
                        {formatCurrency(Math.abs(balanceSheet.assets.total - balanceSheet.totalLiabilitiesAndEquity))}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

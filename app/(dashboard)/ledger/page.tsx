"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"
import { Skeleton } from "@/components/ui/skeleton"

interface Account {
  _id: string
  name: string
  code: string
  type: string
  isActive: boolean
}

interface LedgerEntry {
  date: string
  description: string
  reference?: string
  debit: number
  credit: number
}

interface LedgerAccount {
  account: {
    _id: string
    name: string
    code: string
    type: string
  }
  entries: LedgerEntry[]
  totals: {
    debit: number
    credit: number
  }
  balance: number
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="bg-muted/50">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [ledger, setLedger] = useState<LedgerAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{
    startDate: Date | undefined
    endDate: Date | undefined
  }>({
    startDate: undefined,
    endDate: undefined,
  })
  const [loading, setLoading] = useState(true)

  const { formatCurrency } = useCurrency()

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount !== "all" || dateRange.startDate || dateRange.endDate) {
      fetchLedger()
    }
  }, [selectedAccount, dateRange.startDate, dateRange.endDate])

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts")

      if (!response.ok) {
        throw new Error("Failed to fetch accounts")
      }

      const data = await response.json()
      setAccounts(data.filter((account: Account) => account.isActive))

      // If no account is selected yet, fetch all ledger data
      if (selectedAccount === "all") {
        fetchLedger()
      }
    } catch (error) {
      console.warn("Error fetching accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load accounts. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchLedger = async () => {
    try {
      setLoading(true)

      let url = "/api/ledger"
      const params = new URLSearchParams()

      if (selectedAccount !== "all") {
        params.append("accountId", selectedAccount)
      }

      if (dateRange.startDate) {
        params.append("startDate", dateRange.startDate.toISOString())
      }

      if (dateRange.endDate) {
        params.append("endDate", dateRange.endDate.toISOString())
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch ledger")
      }

      const data = await response.json()
      setLedger(data)
    } catch (error) {
      console.warn("Error fetching ledger:", error)
      toast({
        title: "Error",
        description: "Failed to load ledger data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedAccount("all")
    setDateRange({
      startDate: undefined,
      endDate: undefined,
    })
  }

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      asset: "Asset",
      liability: "Liability",
      equity: "Equity",
      revenue: "Revenue",
      expense: "Expense",
    }
    return types[type] || type
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter ledger by account and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            <Button onClick={fetchLedger}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingSkeleton />
      ) : ledger.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">No ledger data found for the selected filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ledger.map((account) => (
            <Card key={account.account._id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{account.account.name}</CardTitle>
                    <CardDescription>
                      {account.account.code} - {getAccountTypeLabel(account.account.type)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Balance</div>
                    <div className="text-lg font-bold">{formatCurrency(account.balance)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="t-account">
                  <TabsList className="w-full rounded-none">
                    <TabsTrigger value="t-account" className="flex-1">
                      T-Account
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex-1">
                      List View
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="t-account" className="m-0">
                    <div className="grid grid-cols-2 divide-x">
                      <div className="p-4">
                        <div className="mb-2 text-center font-medium">Debits</div>
                        {account.entries.map(
                          (entry, index) =>
                            entry.debit > 0 && (
                              <div key={`debit-${index}`} className="mb-2 flex justify-between">
                                <div className="text-sm">{format(new Date(entry.date), "MM/dd/yyyy")}</div>
                                <div className="font-medium">{formatCurrency(entry.debit)}</div>
                              </div>
                            ),
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <div className="font-medium">Total</div>
                          <div className="font-bold">{formatCurrency(account.totals.debit)}</div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-2 text-center font-medium">Credits</div>
                        {account.entries.map(
                          (entry, index) =>
                            entry.credit > 0 && (
                              <div key={`credit-${index}`} className="mb-2 flex justify-between">
                                <div className="text-sm">{format(new Date(entry.date), "MM/dd/yyyy")}</div>
                                <div className="font-medium">{formatCurrency(entry.credit)}</div>
                              </div>
                            ),
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <div className="font-medium">Total</div>
                          <div className="font-bold">{formatCurrency(account.totals.credit)}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="list" className="m-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-right">Debit</th>
                            <th className="px-4 py-2 text-right">Credit</th>
                            <th className="px-4 py-2 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {account.entries.map((entry, index) => {
                            // Calculate running balance
                            const entriesUpToThis = account.entries.slice(0, index + 1)
                            let runningBalance = 0

                            if (["asset", "expense"].includes(account.account.type)) {
                              // Debit increases, credit decreases
                              runningBalance = entriesUpToThis.reduce(
                                (sum, e) => sum + (e.debit || 0) - (e.credit || 0),
                                0,
                              )
                            } else {
                              // Credit increases, debit decreases
                              runningBalance = entriesUpToThis.reduce(
                                (sum, e) => sum + (e.credit || 0) - (e.debit || 0),
                                0,
                              )
                            }

                            return (
                              <tr key={index} className="border-b">
                                <td className="px-4 py-2">{format(new Date(entry.date), "MM/dd/yyyy")}</td>
                                <td className="px-4 py-2">{entry.description}</td>
                                <td className="px-4 py-2 text-right">
                                  {entry.debit > 0 ? formatCurrency(entry.debit) : ""}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {entry.credit > 0 ? formatCurrency(entry.credit) : ""}
                                </td>
                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(runningBalance)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"

export default function ClosePeriodPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<{
    message: string
    netIncome: number
    closingEntries: any[]
  } | null>(null)

  const { formatCurrency } = useCurrency()

  const handleClosePeriod = async () => {
    if (!confirm("Are you sure you want to close the period? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      setSuccess(false)
      setResult(null)

      const response = await fetch("/api/close-period", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to close period")
      }

      const data = await response.json()
      setResult(data)
      setSuccess(true)

      toast({
        title: "Success",
        description: "Period closed successfully",
      })
    } catch (error: any) {
      console.error("Error closing period:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to close period. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Close Period</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Close Accounting Period</CardTitle>
          <CardDescription>
            This will close the current accounting period and transfer net income to retained earnings. All revenue and
            expense accounts will be reset to zero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Closing Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Warning</p>
              <p className="mt-1">Closing a period is a permanent action. This will:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>Transfer net income to retained earnings</li>
                <li>Reset all revenue and expense accounts to zero</li>
                <li>Create closing journal entries</li>
              </ul>
              <p className="mt-2">
                Make sure you have backed up your data and generated all necessary reports before proceeding.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleClosePeriod} disabled={loading}>
            {loading ? "Processing..." : "Close Period"}
          </Button>
        </CardFooter>
      </Card>

      {success && result && (
        <Card className="bg-green-50">
          <CardHeader>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Period Closed Successfully</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              The accounting period has been closed as of {format(date, "MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Net Income</h3>
                <p className="text-lg font-bold">{formatCurrency(result.netIncome)}</p>
              </div>

              <div>
                <h3 className="font-medium">Closing Entries</h3>
                <p className="text-sm text-muted-foreground">
                  {result.closingEntries.length} closing entries were created
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

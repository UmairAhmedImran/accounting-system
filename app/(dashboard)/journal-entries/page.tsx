"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import { useCurrency } from "@/context/currency-context"
import { Skeleton } from "@/components/ui/skeleton"

interface Account {
  _id: string
  name: string
  code: string
  type: string
  isActive: boolean
}

interface EntryItem {
  accountId: string
  account?: Account
  debit: number
  credit: number
}

interface JournalEntry {
  _id: string
  date: string
  description: string
  entries: EntryItem[]
  isAdjustment: boolean
  adjustmentType?: string
  isPosted: boolean
  reference?: string
  createdAt: string
}

export default function JournalEntriesPage() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)

  const [formData, setFormData] = useState({
    date: new Date(),
    description: "",
    entries: [{ accountId: "", debit: 0, credit: 0 }],
    isAdjustment: false,
    adjustmentType: "",
    reference: "",
  })

  const { formatCurrency } = useCurrency()

  const columns: ColumnDef<JournalEntry>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"))
        return <div>{format(date, "MMM dd, yyyy")}</div>
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "entries",
      header: "Amount",
      cell: ({ row }) => {
        const entries = row.original.entries
        const total = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0)
        return <div className="text-right font-medium">{formatCurrency(total)}</div>
      },
    },
    {
      accessorKey: "isAdjustment",
      header: "Type",
      cell: ({ row }) => {
        const isAdjustment = row.getValue("isAdjustment") as boolean
        const adjustmentType = row.original.adjustmentType
        return (
          <div>
            {isAdjustment ? (
              <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-800">
                {adjustmentType || "Adjustment"}
              </span>
            ) : (
              <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-800">Regular</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div>{format(date, "MMM dd, yyyy")}</div>
      },
    },
  ]

  useEffect(() => {
    fetchJournalEntries()
    fetchAccounts()
  }, [])

  const fetchJournalEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/journal-entries")

      if (!response.ok) {
        throw new Error("Failed to fetch journal entries")
      }

      const data = await response.json()
      setJournalEntries(data)
    } catch (error) {
      console.error("Error fetching journal entries:", error)
      toast({
        title: "Error",
        description: "Failed to load journal entries. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts")

      if (!response.ok) {
        throw new Error("Failed to fetch accounts")
      }

      const data = await response.json()
      setAccounts(data.filter((account: Account) => account.isActive))
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load accounts. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenDialog = () => {
    setFormData({
      date: new Date(),
      description: "",
      entries: [{ accountId: "", debit: 0, credit: 0 }],
      isAdjustment: false,
      adjustmentType: "",
      reference: "",
    })
    setOpenDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate entries
    if (formData.entries.length < 2) {
      toast({
        title: "Validation Error",
        description: "At least two entries are required",
        variant: "destructive",
      })
      return
    }

    // Check if all entries have an account selected
    const hasEmptyAccount = formData.entries.some((entry) => !entry.accountId)
    if (hasEmptyAccount) {
      toast({
        title: "Validation Error",
        description: "All entries must have an account selected",
        variant: "destructive",
      })
      return
    }

    // Calculate total debits and credits
    const totalDebits = formData.entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0)
    const totalCredits = formData.entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0)

    // Check if debits equal credits
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast({
        title: "Validation Error",
        description: "Total debits must equal total credits",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/journal-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log(response)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create journal entry")
      }

      toast({
        title: "Success",
        description: "Journal entry created successfully",
      })

      setOpenDialog(false)
      fetchJournalEntries()
    } catch (error: any) {
      console.error("Error creating journal entry:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create journal entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddEntry = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [...prev.entries, { accountId: "", debit: 0, credit: 0 }],
    }))
  }

  const handleRemoveEntry = (index: number) => {
    if (formData.entries.length <= 1) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index),
    }))
  }

  const handleEntryChange = (index: number, field: string, value: string | number) => {
    const newEntries = [...formData.entries]

    if (field === "debit" && value) {
      newEntries[index] = {
        ...newEntries[index],
        [field]: Number(value),
        credit: 0, // Clear credit when debit is entered
      }
    } else if (field === "credit" && value) {
      newEntries[index] = {
        ...newEntries[index],
        [field]: Number(value),
        debit: 0, // Clear debit when credit is entered
      }
    } else {
      newEntries[index] = { ...newEntries[index], [field]: value }
    }

    setFormData((prev) => ({
      ...prev,
      entries: newEntries,
    }))
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Calculate totals for the form
  const totalDebits = formData.entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0)
  const totalCredits = formData.entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-8 w-[100px]" />
              </div>
              <div className="rounded-lg border">
                <div className="border-b">
                  <div className="flex p-4">
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
                <div className="divide-y">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-4">
                      <Skeleton className="mr-4 h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      <DataTable columns={columns} data={journalEntries} searchKey="description" />

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
            <DialogDescription>
              Enter the details for the new journal entry. Ensure that debits equal credits.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => handleChange("date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => handleChange("reference", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Entry Details</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddEntry}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line
                  </Button>
                </div>

                <Card>
                  <CardHeader className="p-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6">
                        <CardTitle className="text-sm">Account</CardTitle>
                      </div>
                      <div className="col-span-3">
                        <CardTitle className="text-sm text-right">Debit</CardTitle>
                      </div>
                      <div className="col-span-3">
                        <CardTitle className="text-sm text-right">Credit</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {formData.entries.map((entry, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 mb-2">
                        <div className="col-span-6">
                          <Select
                            value={entry.accountId || "default"}
                            onValueChange={(value) => handleEntryChange(index, "accountId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Select account</SelectItem>
                              {accounts.map((account) => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.debit || ""}
                            onChange={(e) => handleEntryChange(index, "debit", e.target.value)}
                            className="text-right"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.credit || ""}
                            onChange={(e) => handleEntryChange(index, "credit", e.target.value)}
                            className="text-right"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveEntry(index)}
                            disabled={formData.entries.length <= 1}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-12 gap-4 mt-4 pt-4 border-t">
                      <div className="col-span-6 font-medium">Totals</div>
                      <div className="col-span-3 text-right font-medium">{formatCurrency(totalDebits)}</div>
                      <div className="col-span-3 text-right font-medium">{formatCurrency(totalCredits)}</div>
                    </div>

                    <div className="mt-2 text-right">
                      {isBalanced ? (
                        <span className="text-sm text-green-600">Balanced</span>
                      ) : (
                        <span className="text-sm text-red-600">
                          Out of balance: {formatCurrency(Math.abs(totalDebits - totalCredits))}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdjustment"
                    checked={formData.isAdjustment}
                    onChange={(e) => handleChange("isAdjustment", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isAdjustment">This is an adjustment entry</Label>
                </div>

                {formData.isAdjustment && (
                  <div className="mt-2">
                    <Label htmlFor="adjustmentType">Adjustment Type</Label>
                    <Select
                      value={formData.adjustmentType || "default"}
                      onValueChange={(value) => handleChange("adjustmentType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select adjustment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Select type</SelectItem>
                        <SelectItem value="Depreciation">Depreciation</SelectItem>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                        <SelectItem value="Unearned Revenue">Unearned Revenue</SelectItem>
                        <SelectItem value="Accrued Revenue">Accrued Revenue</SelectItem>
                        <SelectItem value="Accrued Expense">Accrued Expense</SelectItem>
                        <SelectItem value="Supplies">Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!isBalanced}>
                Create Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

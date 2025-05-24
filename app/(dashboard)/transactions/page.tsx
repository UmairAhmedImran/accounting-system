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
import { Skeleton } from "@/components/ui/skeleton"

import { useCurrency } from "@/context/currency-context"

interface InventoryItem {
  _id: string
  name: string
  sku: string
  category: string
  costPrice: number
  sellingPrice: number
  quantity: number
  isActive: boolean
}

interface TransactionItem {
  inventoryItemId: string
  inventoryItem?: {
    name: string
    sku: string
    category: string
  }
  quantity: number
  unitPrice: number
  total: number
}

interface Transaction {
  _id: string
  date: string
  type: string
  description: string
  items: TransactionItem[]
  total: number
  reference?: string
  createdAt: string
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-8 w-[150px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
            <div className="rounded-lg border">
              <div className="border-b">
                <div className="grid grid-cols-6 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-[100px]" />
                  ))}
                </div>
              </div>
              <div className="p-3 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <Skeleton key={j} className="h-5 w-[100px]" />
                    ))}
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)

  const [formData, setFormData] = useState({
    date: new Date(),
    type: "purchase",
    description: "",
    items: [{ inventoryItemId: "", quantity: 1, unitPrice: 0, total: 0 }],
    reference: "",
  })

  const { formatCurrency } = useCurrency()

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"))
        return <div>{format(date, "MMM dd, yyyy")}</div>
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return <div className="capitalize">{type.replace(/-/g, " ")}</div>
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("total"))
        return <div className="text-right font-medium">{formatCurrency(amount)}</div>
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
    fetchTransactions()
    fetchInventoryItems()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/transactions")

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.warn("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch("/api/inventory")

      if (!response.ok) {
        throw new Error("Failed to fetch inventory items")
      }

      const data = await response.json()
      setInventoryItems(data.filter((item: InventoryItem) => item.isActive))
    } catch (error) {
      console.warn("Error fetching inventory items:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory items. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenDialog = () => {
    setFormData({
      date: new Date(),
      type: "purchase",
      description: "",
      items: [{ inventoryItemId: "", quantity: 1, unitPrice: 0, total: 0 }],
      reference: "",
    })
    setOpenDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.items.length < 1) {
      toast({
        title: "Validation Error",
        description: "At least one item is required",
        variant: "destructive",
      })
      return
    }

    const hasEmptyItem = formData.items.some((item) => !item.inventoryItemId)
    if (hasEmptyItem) {
      toast({
        title: "Validation Error",
        description: "All items must have an inventory item selected",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create transaction")
      }

      toast({
        title: "Success",
        description: "Transaction created successfully",
      })

      setOpenDialog(false)
      fetchTransactions()
    } catch (error: any) {
      console.warn("Error creating transaction:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { inventoryItemId: "", quantity: 1, unitPrice: 0, total: 0 }],
    }))
  }

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    const newItems = [...formData.items]

    if (field === "inventoryItemId") {
      const selectedItem = inventoryItems.find((item) => item._id === value)
      let unitPrice = 0

      if (selectedItem) {
        if (["sale", "sale-return"].includes(formData.type)) {
          unitPrice = selectedItem.sellingPrice
        } else {
          unitPrice = selectedItem.costPrice
        }
      }

      newItems[index] = {
        ...newItems[index],
        [field]: value as string,
        unitPrice,
        total: newItems[index].quantity * unitPrice,
      }
    } else if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? Number(value) : newItems[index].quantity
      const unitPrice = field === "unitPrice" ? Number(value) : newItems[index].unitPrice

      newItems[index] = {
        ...newItems[index],
        [field]: Number(value),
        total: quantity * unitPrice,
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }

    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }))
  }

  const handleChange = (field: string, value: any) => {
    if (field === "type") {
      const newItems = formData.items.map((item) => {
        if (!item.inventoryItemId) return item

        const selectedItem = inventoryItems.find((invItem) => invItem._id === item.inventoryItemId)
        if (!selectedItem) return item

        let unitPrice = 0

        if (["sale", "sale-return"].includes(value)) {
          unitPrice = selectedItem.sellingPrice
        } else {
          unitPrice = selectedItem.costPrice
        }

        return {
          ...item,
          unitPrice,
          total: item.quantity * unitPrice,
        }
      })

      setFormData((prev) => ({
        ...prev,
        [field]: value,
        items: newItems,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const total = formData.items.reduce((sum, item) => sum + (item.total || 0), 0)

  if (loading) {
    return <TransactionsSkeleton />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      <DataTable columns={columns} data={transactions} searchKey="description" />

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
            <DialogDescription>Enter the details for the new transaction.</DialogDescription>
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
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="purchase-return">Purchase Return</SelectItem>
                      <SelectItem value="purchase-allowance">Purchase Allowance</SelectItem>
                      <SelectItem value="purchase-discount">Purchase Discount</SelectItem>
                      <SelectItem value="inbound-freight">Inbound Freight</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="sale-return">Sale Return</SelectItem>
                      <SelectItem value="sale-allowance">Sale Allowance</SelectItem>
                      <SelectItem value="sale-discount">Sale Discount</SelectItem>
                      <SelectItem value="outbound-freight">Outbound Freight</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleChange("reference", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                <Card>
                  <CardHeader className="p-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-5">
                        <CardTitle className="text-sm">Item</CardTitle>
                      </div>
                      <div className="col-span-2">
                        <CardTitle className="text-sm text-center">Quantity</CardTitle>
                      </div>
                      <div className="col-span-2">
                        <CardTitle className="text-sm text-right">Unit Price</CardTitle>
                      </div>
                      <div className="col-span-3">
                        <CardTitle className="text-sm text-right">Total</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 mb-2">
                        <div className="col-span-5">
                          <Select
                            value={item.inventoryItemId || "default"}
                            onValueChange={(value) => handleItemChange(index, "inventoryItemId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Select item</SelectItem>
                              {inventoryItems.map((invItem) => (
                                <SelectItem key={invItem._id} value={invItem._id}>
                                  {invItem.name} ({invItem.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            className="text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                            className="text-right"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input type="number" value={item.total} readOnly className="text-right bg-muted" />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            disabled={formData.items.length <= 1}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-12 gap-4 mt-4 pt-4 border-t">
                      <div className="col-span-9 font-medium text-right">Total</div>
                      <div className="col-span-3 text-right font-medium">{formatCurrency(total)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

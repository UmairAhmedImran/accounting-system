import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Transaction from "@/models/Transaction"
import InventoryItem from "@/models/InventoryItem"
import JournalEntry from "@/models/JournalEntry"
import Account from "@/models/Account"
import { getUserFromCookie } from "@/lib/auth"
import mongoose from "mongoose"

// GET all transactions
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get query parameters
    const url = new URL(req.url)
    const type = url.searchParams.get("type")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Build query
    const query: any = {}

    if (type) {
      query.type = type
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).populate({
      path: "items.inventoryItemId",
      select: "name sku category",
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new transaction
export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const data = await req.json()

    // Validate required fields
    if (!data.date || !data.type || !data.description || !data.items || data.items.length < 1) {
      return NextResponse.json(
        { error: "Date, type, description, and at least one item are required" },
        { status: 400 },
      )
    }

    // Calculate total
    let total = 0
    for (const item of data.items) {
      if (!item.inventoryItemId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: "Each item must have an inventory item ID, quantity, and unit price" },
          { status: 400 },
        )
      }

      item.total = item.quantity * item.unitPrice
      total += item.total
    }

    data.total = total

    // Create the transaction
    const newTransaction = new Transaction(data)
    await newTransaction.save({ session })

    // Update inventory quantities
    for (const item of data.items) {
      const inventoryItem = await InventoryItem.findById(item.inventoryItemId).session(session)

      if (!inventoryItem) {
        throw new Error(`Inventory item with ID ${item.inventoryItemId} not found`)
      }

      // Update quantity based on transaction type
      switch (data.type) {
        case "purchase":
        case "sale-return":
          inventoryItem.quantity += item.quantity
          break
        case "sale":
        case "purchase-return":
          if (inventoryItem.quantity < item.quantity) {
            throw new Error(`Insufficient quantity for item ${inventoryItem.name}`)
          }
          inventoryItem.quantity -= item.quantity
          break
        // Other transaction types don't affect inventory quantity
      }

      await inventoryItem.save({ session })
    }

    // Create corresponding journal entry
    const journalEntryData = {
      date: data.date,
      description: `${data.description} (${data.type})`,
      entries: [] as any[],
      reference: newTransaction._id.toString(),
    }

    // Get necessary accounts
    const inventoryAccount = await Account.findOne({ code: "1200" }).session(session) // Inventory
    const accountsPayable = await Account.findOne({ code: "2000" }).session(session) // Accounts Payable
    const accountsReceivable = await Account.findOne({ code: "1100" }).session(session) // Accounts Receivable
    const salesRevenue = await Account.findOne({ code: "4000" }).session(session) // Sales Revenue
    const costOfGoodsSold = await Account.findOne({ code: "5000" }).session(session) // COGS
    const purchaseReturns = await Account.findOne({ code: "5100" }).session(session) // Purchase Returns
    const salesReturns = await Account.findOne({ code: "4100" }).session(session) // Sales Returns
    const freightExpense = await Account.findOne({ code: "5200" }).session(session) // Freight Expense

    if (
      !inventoryAccount ||
      !accountsPayable ||
      !accountsReceivable ||
      !salesRevenue ||
      !costOfGoodsSold ||
      !purchaseReturns ||
      !salesReturns ||
      !freightExpense
    ) {
      throw new Error("Required accounts not found")
    }

    // Create journal entries based on transaction type
    switch (data.type) {
      case "purchase":
        journalEntryData.entries.push(
          { accountId: inventoryAccount._id, debit: total, credit: 0 },
          { accountId: accountsPayable._id, debit: 0, credit: total },
        )
        break
      case "purchase-return":
        journalEntryData.entries.push(
          { accountId: accountsPayable._id, debit: total, credit: 0 },
          { accountId: inventoryAccount._id, debit: 0, credit: total },
        )
        break
      case "sale":
        // Revenue entry
        journalEntryData.entries.push(
          { accountId: accountsReceivable._id, debit: total, credit: 0 },
          { accountId: salesRevenue._id, debit: 0, credit: total },
        )

        // COGS entry (assuming average cost)
        let cogsTotal = 0
        for (const item of data.items) {
          const inventoryItem = await InventoryItem.findById(item.inventoryItemId).session(session)
          cogsTotal += inventoryItem!.costPrice * item.quantity
        }

        journalEntryData.entries.push(
          { accountId: costOfGoodsSold._id, debit: cogsTotal, credit: 0 },
          { accountId: inventoryAccount._id, debit: 0, credit: cogsTotal },
        )
        break
      case "sale-return":
        // Revenue reversal
        journalEntryData.entries.push(
          { accountId: salesReturns._id, debit: total, credit: 0 },
          { accountId: accountsReceivable._id, debit: 0, credit: total },
        )

        // Inventory return (assuming average cost)
        let inventoryReturnTotal = 0
        for (const item of data.items) {
          const inventoryItem = await InventoryItem.findById(item.inventoryItemId).session(session)
          inventoryReturnTotal += inventoryItem!.costPrice * item.quantity
        }

        journalEntryData.entries.push(
          { accountId: inventoryAccount._id, debit: inventoryReturnTotal, credit: 0 },
          { accountId: costOfGoodsSold._id, debit: 0, credit: inventoryReturnTotal },
        )
        break
      case "inbound-freight":
        journalEntryData.entries.push(
          { accountId: inventoryAccount._id, debit: total, credit: 0 },
          { accountId: accountsPayable._id, debit: 0, credit: total },
        )
        break
      case "outbound-freight":
        journalEntryData.entries.push(
          { accountId: freightExpense._id, debit: total, credit: 0 },
          { accountId: accountsPayable._id, debit: 0, credit: total },
        )
        break
      // Handle other transaction types similarly
    }

    const newJournalEntry = new JournalEntry(journalEntryData)
    await newJournalEntry.save({ session })

    // Update transaction with journal entry ID
    newTransaction.journalEntryId = newJournalEntry._id
    await newTransaction.save({ session })

    // Update account balances
    for (const entry of journalEntryData.entries) {
      const account = await Account.findById(entry.accountId).session(session)

      if (!account) {
        throw new Error(`Account with ID ${entry.accountId} not found`)
      }

      // Update balance based on account type and debit/credit
      if (["asset", "expense"].includes(account.type)) {
        // Debit increases, credit decreases
        account.balance += (entry.debit || 0) - (entry.credit || 0)
      } else {
        // Credit increases, debit decreases
        account.balance += (entry.credit || 0) - (entry.debit || 0)
      }

      await account.save({ session })
    }

    await session.commitTransaction()

    // Populate inventory item details for response
    const populatedTransaction = await Transaction.findById(newTransaction._id).populate({
      path: "items.inventoryItemId",
      select: "name sku category",
    })

    return NextResponse.json(populatedTransaction, { status: 201 })
  } catch (error) {
    await session.abortTransaction()
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    session.endSession()
  }
}

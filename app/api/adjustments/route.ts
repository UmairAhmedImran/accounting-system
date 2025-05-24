import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import JournalEntry from "@/models/JournalEntry"
import Account from "@/models/Account"
import { getUserFromCookie } from "@/lib/auth"
import mongoose from "mongoose"

// GET all adjustments
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get query parameters
    const url = new URL(req.url)
    const adjustmentType = url.searchParams.get("adjustmentType")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Build query
    const query: any = {
      isAdjustment: true,
    }

    if (adjustmentType) {
      query.adjustmentType = adjustmentType
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const adjustments = await JournalEntry.find(query).sort({ date: -1 }).populate({
      path: "entries.accountId",
      select: "name code type",
    })

    return NextResponse.json(adjustments)
  } catch (error) {
    console.error("Error fetching adjustments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new adjustment
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
    if (!data.date || !data.description || !data.entries || data.entries.length < 2 || !data.adjustmentType) {
      return NextResponse.json(
        { error: "Date, description, adjustment type, and at least two entries are required" },
        { status: 400 },
      )
    }

    // Set adjustment flag
    data.isAdjustment = true

    // Calculate total debits and credits
    const totalDebits = data.entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0)
    const totalCredits = data.entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0)

    // Check if debits equal credits
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json({ error: "Total debits must equal total credits" }, { status: 400 })
    }

    // Create the adjustment entry
    const newAdjustment = new JournalEntry(data)
    await newAdjustment.save({ session })

    // Update account balances
    for (const entry of data.entries) {
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

    // Populate account details for response
    const populatedAdjustment = await JournalEntry.findById(newAdjustment._id).populate({
      path: "entries.accountId",
      select: "name code type",
    })

    return NextResponse.json(populatedAdjustment, { status: 201 })
  } catch (error) {
    await session.abortTransaction()
    console.error("Error creating adjustment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    session.endSession()
  }
}

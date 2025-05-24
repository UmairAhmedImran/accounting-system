import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Account from "@/models/Account"
import JournalEntry from "@/models/JournalEntry"
import { getUserFromCookie } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const { date } = await req.json()

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Get revenue and expense accounts
    const revenueAccounts = await Account.find({
      type: "revenue",
      isActive: true,
      balance: { $ne: 0 },
    }).session(session)

    const expenseAccounts = await Account.find({
      type: "expense",
      isActive: true,
      balance: { $ne: 0 },
    }).session(session)

    // Get retained earnings account
    const retainedEarningsAccount = await Account.findOne({
      code: "3200", // Retained Earnings
    }).session(session)

    if (!retainedEarningsAccount) {
      return NextResponse.json({ error: "Retained Earnings account not found" }, { status: 400 })
    }

    // Calculate net income
    const totalRevenue = revenueAccounts.reduce((sum, account) => sum + account.balance, 0)
    const totalExpenses = expenseAccounts.reduce((sum, account) => sum + account.balance, 0)
    const netIncome = totalRevenue - totalExpenses

    // Create closing entries
    const closingEntries = []

    // Close revenue accounts
    if (totalRevenue > 0) {
      const revenueClosingEntries = revenueAccounts.map((account) => ({
        accountId: account._id,
        debit: account.balance,
        credit: 0,
      }))

      closingEntries.push({
        date: new Date(date),
        description: "Closing revenue accounts",
        entries: [
          ...revenueClosingEntries,
          {
            accountId: retainedEarningsAccount._id,
            debit: 0,
            credit: totalRevenue,
          },
        ],
        isPosted: true,
        reference: "CLOSING",
      })
    }

    // Close expense accounts
    if (totalExpenses > 0) {
      const expenseClosingEntries = expenseAccounts.map((account) => ({
        accountId: account._id,
        debit: 0,
        credit: account.balance,
      }))

      closingEntries.push({
        date: new Date(date),
        description: "Closing expense accounts",
        entries: [
          {
            accountId: retainedEarningsAccount._id,
            debit: totalExpenses,
            credit: 0,
          },
          ...expenseClosingEntries,
        ],
        isPosted: true,
        reference: "CLOSING",
      })
    }

    // Save closing entries
    for (const entryData of closingEntries) {
      const journalEntry = new JournalEntry(entryData)
      await journalEntry.save({ session })
    }

    // Update account balances
    // Reset revenue and expense accounts to zero
    for (const account of [...revenueAccounts, ...expenseAccounts]) {
      account.balance = 0
      await account.save({ session })
    }

    // Update retained earnings
    retainedEarningsAccount.balance += netIncome
    await retainedEarningsAccount.save({ session })

    await session.commitTransaction()

    return NextResponse.json({
      message: "Period closed successfully",
      netIncome,
      closingEntries,
    })
  } catch (error) {
    await session.abortTransaction()
    console.error("Error closing period:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    session.endSession()
  }
}

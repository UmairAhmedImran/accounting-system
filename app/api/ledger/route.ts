import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import JournalEntry from "@/models/JournalEntry"
import Account from "@/models/Account"
import { getUserFromCookie } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get query parameters
    const url = new URL(req.url)
    const accountId = url.searchParams.get("accountId")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Build query for journal entries
    const query: any = {}

    if (accountId) {
      query["entries.accountId"] = accountId
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    // Get all accounts
    const accounts = await Account.find().sort({ code: 1 })

    // Get journal entries
    const journalEntries = await JournalEntry.find(query).sort({ date: 1 }).populate({
      path: "entries.accountId",
      select: "name code type",
    })

    // Build T-accounts
    const ledger = accounts.map((account) => {
      const accountEntries = []
      let debitTotal = 0
      let creditTotal = 0

      // Find all entries for this account
      for (const journalEntry of journalEntries) {
        for (const entry of journalEntry.entries) {
          if (entry.accountId._id.toString() === account._id.toString()) {
            accountEntries.push({
              date: journalEntry.date,
              description: journalEntry.description,
              reference: journalEntry.reference,
              debit: entry.debit,
              credit: entry.credit,
            })

            debitTotal += entry.debit
            creditTotal += entry.credit
          }
        }
      }

      // Calculate balance based on account type
      let balance = 0
      if (["asset", "expense"].includes(account.type)) {
        balance = debitTotal - creditTotal
      } else {
        balance = creditTotal - debitTotal
      }

      return {
        account: {
          _id: account._id,
          name: account.name,
          code: account.code,
          type: account.type,
        },
        entries: accountEntries,
        totals: {
          debit: debitTotal,
          credit: creditTotal,
        },
        balance,
      }
    })

    // Filter out accounts with no entries if an accountId was specified
    const filteredLedger = accountId ? ledger.filter((item) => item.account._id.toString() === accountId) : ledger

    return NextResponse.json(filteredLedger)
  } catch (error) {
    console.error("Error fetching ledger:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

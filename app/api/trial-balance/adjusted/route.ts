import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Account from "@/models/Account"
import JournalEntry from "@/models/JournalEntry"
import { getUserFromCookie } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get all accounts
    const accounts = await Account.find({ isActive: true }).sort({ code: 1 })

    // Get all adjustment entries
    const adjustmentEntries = await JournalEntry.find({ isAdjustment: true })

    // Calculate trial balance with adjustments
    let totalDebits = 0
    let totalCredits = 0

    const trialBalance = accounts.map((account) => {
      let debit = 0
      let credit = 0

      // Apply adjustments to account balances
      const adjustmentsForAccount = []

      for (const entry of adjustmentEntries) {
        for (const item of entry.entries) {
          if (item.accountId.toString() === account._id.toString()) {
            adjustmentsForAccount.push({
              debit: item.debit || 0,
              credit: item.credit || 0,
            })
          }
        }
      }

      // Calculate adjustment totals
      const adjustmentDebitTotal = adjustmentsForAccount.reduce((sum, adj) => sum + adj.debit, 0)
      const adjustmentCreditTotal = adjustmentsForAccount.reduce((sum, adj) => sum + adj.credit, 0)

      // Apply adjustments based on account type
      let adjustedBalance = account.balance

      if (["asset", "expense"].includes(account.type)) {
        // For asset and expense accounts, debits increase and credits decrease
        adjustedBalance += adjustmentDebitTotal - adjustmentCreditTotal
      } else {
        // For liability, equity, and revenue accounts, credits increase and debits decrease
        adjustedBalance += adjustmentCreditTotal - adjustmentDebitTotal
      }

      // Determine debit or credit presentation based on account type and adjusted balance
      if (["asset", "expense"].includes(account.type)) {
        // Normal debit balance
        if (adjustedBalance > 0) {
          debit = adjustedBalance
          totalDebits += debit
        } else {
          credit = Math.abs(adjustedBalance)
          totalCredits += credit
        }
      } else {
        // Normal credit balance
        if (adjustedBalance > 0) {
          credit = adjustedBalance
          totalCredits += credit
        } else {
          debit = Math.abs(adjustedBalance)
          totalDebits += debit
        }
      }

      return {
        account: {
          _id: account._id,
          name: account.name,
          code: account.code,
          type: account.type,
        },
        debit,
        credit,
      }
    })

    return NextResponse.json({
      trialBalance,
      totals: {
        debit: totalDebits,
        credit: totalCredits,
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    })
  } catch (error) {
    console.error("Error fetching adjusted trial balance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

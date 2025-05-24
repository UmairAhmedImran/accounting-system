import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Account from "@/models/Account"
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

    // Calculate trial balance
    let totalDebits = 0
    let totalCredits = 0

    const trialBalance = accounts.map((account) => {
      let debit = 0
      let credit = 0

      if (["asset", "expense"].includes(account.type)) {
        // Normal debit balance
        if (account.balance > 0) {
          debit = account.balance
          totalDebits += debit
        } else {
          credit = Math.abs(account.balance)
          totalCredits += credit
        }
      } else {
        // Normal credit balance
        if (account.balance > 0) {
          credit = account.balance
          totalCredits += credit
        } else {
          debit = Math.abs(account.balance)
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
    console.error("Error fetching trial balance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

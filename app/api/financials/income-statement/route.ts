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

    // Get query parameters
    const url = new URL(req.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    // Get revenue accounts
    const revenueAccounts = await Account.find({
      type: "revenue",
      isActive: true,
    }).sort({ code: 1 })

    // Get expense accounts
    const expenseAccounts = await Account.find({
      type: "expense",
      isActive: true,
    }).sort({ code: 1 })

    // Calculate totals
    const totalRevenue = revenueAccounts.reduce((sum, account) => sum + account.balance, 0)
    const totalExpenses = expenseAccounts.reduce((sum, account) => sum + account.balance, 0)
    const netIncome = totalRevenue - totalExpenses

    return NextResponse.json({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      revenue: {
        accounts: revenueAccounts.map((account) => ({
          _id: account._id,
          name: account.name,
          code: account.code,
          balance: account.balance,
        })),
        total: totalRevenue,
      },
      expenses: {
        accounts: expenseAccounts.map((account) => ({
          _id: account._id,
          name: account.name,
          code: account.code,
          balance: account.balance,
        })),
        total: totalExpenses,
      },
      netIncome,
    })
  } catch (error) {
    console.error("Error generating income statement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

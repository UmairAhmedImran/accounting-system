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

    // Get asset accounts
    const assetAccounts = await Account.find({
      type: "asset",
      isActive: true,
    }).sort({ code: 1 })

    // Get liability accounts
    const liabilityAccounts = await Account.find({
      type: "liability",
      isActive: true,
    }).sort({ code: 1 })

    // Get equity accounts
    const equityAccounts = await Account.find({
      type: "equity",
      isActive: true,
    }).sort({ code: 1 })

    // Calculate totals
    const totalAssets = assetAccounts.reduce((sum, account) => sum + account.balance, 0)
    const totalLiabilities = liabilityAccounts.reduce((sum, account) => sum + account.balance, 0)
    const totalEquity = equityAccounts.reduce((sum, account) => sum + account.balance, 0)

    return NextResponse.json({
      date: new Date(),
      assets: {
        accounts: assetAccounts.map((account) => ({
          _id: account._id,
          name: account.name,
          code: account.code,
          balance: account.balance,
        })),
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilityAccounts.map((account) => ({
          _id: account._id,
          name: account.name,
          code: account.code,
          balance: account.balance,
        })),
        total: totalLiabilities,
      },
      equity: {
        accounts: equityAccounts.map((account) => ({
          _id: account._id,
          name: account.name,
          code: account.code,
          balance: account.balance,
        })),
        total: totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    })
  } catch (error) {
    console.error("Error generating balance sheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

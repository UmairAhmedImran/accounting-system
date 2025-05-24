import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Account from "@/models/Account"
import { getUserFromCookie } from "@/lib/auth"

// GET all accounts
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const accounts = await Account.find().sort({ code: 1 })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new account
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const data = await req.json()

    // Validate required fields
    if (!data.name || !data.type || !data.code) {
      return NextResponse.json({ error: "Name, type, and code are required" }, { status: 400 })
    }

    // Check if account code already exists
    const existingAccount = await Account.findOne({ code: data.code })

    if (existingAccount) {
      return NextResponse.json({ error: "Account code already exists" }, { status: 400 })
    }

    const newAccount = new Account(data)
    await newAccount.save()

    return NextResponse.json(newAccount, { status: 201 })
  } catch (error) {
    console.error("Error creating account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import JournalEntry from "@/models/JournalEntry"
import { getUserFromCookie } from "@/lib/auth"

// GET a single journal entry by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const journalEntry = await JournalEntry.findById(params.id).populate({
      path: "entries.accountId",
      select: "name code type",
    })

    if (!journalEntry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 })
    }

    return NextResponse.json(journalEntry)
  } catch (error) {
    console.error("Error fetching journal entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

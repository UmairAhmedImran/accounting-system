import { type NextRequest, NextResponse } from "next/server"
import { removeUserCookie } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    removeUserCookie()

    return NextResponse.json({
      message: "Logout successful",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

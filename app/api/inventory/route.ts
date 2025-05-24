import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import InventoryItem from "@/models/InventoryItem"
import { getUserFromCookie } from "@/lib/auth"

// GET all inventory items
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get query parameters
    const url = new URL(req.url)
    const category = url.searchParams.get("category")
    const lowStock = url.searchParams.get("lowStock")

    // Build query
    const query: any = {}

    if (category) {
      query.category = category
    }

    if (lowStock === "true") {
      query.$expr = { $lte: ["$quantity", "$reorderLevel"] }
    }

    const inventoryItems = await InventoryItem.find(query).sort({ name: 1 })

    return NextResponse.json(inventoryItems)
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new inventory item
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const data = await req.json()

    // Validate required fields
    if (!data.name || !data.sku || !data.category || data.costPrice === undefined || data.sellingPrice === undefined) {
      return NextResponse.json(
        { error: "Name, SKU, category, cost price, and selling price are required" },
        { status: 400 },
      )
    }

    // Check if SKU already exists
    const existingItem = await InventoryItem.findOne({ sku: data.sku })

    if (existingItem) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    const newInventoryItem = new InventoryItem(data)
    await newInventoryItem.save()

    return NextResponse.json(newInventoryItem, { status: 201 })
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

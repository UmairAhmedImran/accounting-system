import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import InventoryItem from "@/models/InventoryItem"
import { getUserFromCookie } from "@/lib/auth"

// GET a single inventory item by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const inventoryItem = await InventoryItem.findById(params.id)

    if (!inventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    return NextResponse.json(inventoryItem)
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update an inventory item
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if SKU already exists (excluding this item)
    const existingItem = await InventoryItem.findOne({
      sku: data.sku,
      _id: { $ne: params.id },
    })

    if (existingItem) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    const updatedInventoryItem = await InventoryItem.findByIdAndUpdate(params.id, data, {
      new: true,
      runValidators: true,
    })

    if (!updatedInventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    return NextResponse.json(updatedInventoryItem)
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE an inventory item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromCookie()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const deletedInventoryItem = await InventoryItem.findByIdAndDelete(params.id)

    if (!deletedInventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

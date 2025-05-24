import mongoose, { Schema, type Document } from "mongoose"

export type TransactionType =
  | "purchase"
  | "purchase-return"
  | "purchase-allowance"
  | "purchase-discount"
  | "inbound-freight"
  | "sale"
  | "sale-return"
  | "sale-allowance"
  | "sale-discount"
  | "outbound-freight"

interface ITransactionItem {
  inventoryItemId: mongoose.Types.ObjectId
  quantity: number
  unitPrice: number
  total: number
}

export interface ITransaction extends Document {
  date: Date
  type: TransactionType
  description: string
  items: ITransactionItem[]
  total: number
  reference?: string
  journalEntryId?: mongoose.Types.ObjectId
}

const TransactionItemSchema = new Schema<ITransactionItem>({
  inventoryItemId: {
    type: Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: [true, "Inventory item ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.01, "Quantity must be greater than 0"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price cannot be negative"],
  },
  total: {
    type: Number,
    required: [true, "Total is required"],
    min: [0, "Total cannot be negative"],
  },
})

const TransactionSchema = new Schema<ITransaction>(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: [
        "purchase",
        "purchase-return",
        "purchase-allowance",
        "purchase-discount",
        "inbound-freight",
        "sale",
        "sale-return",
        "sale-allowance",
        "sale-discount",
        "outbound-freight",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    items: {
      type: [TransactionItemSchema],
      required: [true, "At least one item is required"],
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    reference: {
      type: String,
      trim: true,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)

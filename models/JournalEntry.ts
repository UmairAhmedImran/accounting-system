import mongoose, { Schema, type Document } from "mongoose"

interface IEntryItem {
  accountId: mongoose.Types.ObjectId
  debit: number
  credit: number
}

export interface IJournalEntry extends Document {
  date: Date
  description: string
  entries: IEntryItem[]
  isAdjustment: boolean
  adjustmentType?: string
  isPosted: boolean
  reference?: string
}

const EntryItemSchema = new Schema<IEntryItem>({
  accountId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Account ID is required"],
  },
  debit: {
    type: Number,
    default: 0,
    min: [0, "Debit amount cannot be negative"],
  },
  credit: {
    type: Number,
    default: 0,
    min: [0, "Credit amount cannot be negative"],
  },
})

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    entries: {
      type: [EntryItemSchema],
      required: [true, "At least one entry is required"],
      validate: {
        validator: (entries: IEntryItem[]) => {
          if (entries.length < 2) return false

          // Calculate total debits and credits
          const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0)
          const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0)

          // Check if debits equal credits (with small tolerance for floating point errors)
          return Math.abs(totalDebits - totalCredits) < 0.01
        },
        message: "Total debits must equal total credits",
      },
    },
    isAdjustment: {
      type: Boolean,
      default: false,
    },
    adjustmentType: {
  type: String,
  enum: ["Depreciation", "Prepaid", "Unearned Revenue", "Accrued Revenue", "Accrued Expense", "Supplies", null, ""],
  default: null
    },
    isPosted: {
      type: Boolean,
      default: false,
    },
    reference: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.JournalEntry || mongoose.model<IJournalEntry>("JournalEntry", JournalEntrySchema)

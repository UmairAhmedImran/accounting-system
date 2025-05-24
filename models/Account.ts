import mongoose, { Schema, type Document } from "mongoose"

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense"

export interface IAccount extends Document {
  name: string
  type: AccountType
  code: string
  description: string
  balance: number
  isActive: boolean
}

const AccountSchema = new Schema<IAccount>(
  {
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Account type is required"],
      enum: ["asset", "liability", "equity", "revenue", "expense"],
    },
    code: {
      type: String,
      required: [true, "Account code is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema)

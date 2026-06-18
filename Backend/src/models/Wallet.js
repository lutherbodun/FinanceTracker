import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "USD / US Dollar" },
    status: { type: String, default: "Active" },
    cards: {
      type: [
        {
          bank: { type: String, default: "Universal Bank" },
          cardNumber: { type: String, default: "5495 7381 3759 2321" },
          expires: { type: String, default: "09/25" },
          network: { type: String, default: "VISA" },
        },
      ],
      default: [],
    },
    payments: {
      type: [
        {
          name: String,
          provider: String,
          amount: Number,
          type: { type: String, enum: ["income", "expense"], default: "expense" },
          date: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);

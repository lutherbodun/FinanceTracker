import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    orderType: { type: String, default: "01", trim: true },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invoiceId: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, trim: true, default: "" },
    clientAddress: { type: String, trim: true, default: "" },
    companyName: { type: String, trim: true, default: "" },
    ordersType: { type: String, trim: true, default: "01" },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["paid", "pending", "unpaid"],
      default: "pending",
    },
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: Date.now },
    items: { type: [invoiceItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);

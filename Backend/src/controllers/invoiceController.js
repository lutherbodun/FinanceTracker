import Invoice from "../models/Invoice.js";

export const getInvoices = async (req, res) => {
  const invoices = await Invoice.find({ user: req.user._id }).sort({ invoiceDate: -1 });

  res.json(invoices);
};

export const createInvoice = async (req, res) => {
  const invoice = await Invoice.create({
    ...req.body,
    user: req.user._id,
  });

  res.status(201).json(invoice);
};

export const updateInvoice = async (req, res) => {
  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
  res.json(invoice);
};

export const deleteInvoice = async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
  res.json({ message: "Invoice deleted" });
};

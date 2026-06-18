import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

const editableFields = ["type", "amount", "category", "description", "date"];

function buildTransactionPayload(body) {
    const payload = {};

    editableFields.forEach((field) => {
      if (body[field] !== undefined) payload[field] = body[field];
    });

    if (payload.amount !== undefined) {
      const amount = Number(payload.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return { error: "Amount must be a valid positive number." };
      }
      payload.amount = amount;
    }

    if (payload.category !== undefined) {
      payload.category = String(payload.category).trim();
      if (!payload.category) return { error: "Category is required." };
    }

    if (payload.description !== undefined) {
      payload.description = String(payload.description).trim();
      if (!payload.description) return { error: "Description is required." };
    }

    if (payload.date !== undefined) {
      const date = new Date(payload.date);
      if (Number.isNaN(date.getTime())) return { error: "Date must be valid." };
      payload.date = date;
    }

    if (payload.type !== undefined && !["income", "expense"].includes(payload.type)) {
      return { error: "Transaction type must be income or expense." };
    }

    return { payload };
}

export const createTransaction = async (req, res) => {
    try {
      const { payload, error } = buildTransactionPayload(req.body);
      if (error) return res.status(400).json({ message: error });

      const transaction = await Transaction.create({
        ...payload,
        user: req.user._id
      });
  
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const getTransactions = async (req, res) => {
    try {
      const transactions = await Transaction
        .find({ user: req.user._id })
        .sort({ date: -1 });
  
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const getTransaction = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
  
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        user: req.user._id
      });
  
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
  
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  export const updateTransaction = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const { payload, error } = buildTransactionPayload(req.body);
      if (error) return res.status(400).json({ message: error });
  
      const updated = await Transaction.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        payload,
        { new: true, runValidators: true }
      );
  
      if (!updated) {
        return res.status(404).json({ message: "Transaction not found" });
      }
  
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const deleteTransaction = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
  
      const deleted = await Transaction.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });
  
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
  
      res.json({ message: "Transaction deleted" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

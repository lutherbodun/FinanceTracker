import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

export const getWallet = async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  let wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({
      user: req.user._id,
      balance: income - expenses,
      cards: [
        {
          bank: "Universal Bank",
          cardNumber: "5495 7381 3759 2321",
          expires: "09/25",
          network: "VISA",
        },
        {
          bank: "Commercial Bank",
          cardNumber: "85952548****",
          expires: "09/25",
          network: "VISA",
        },
      ],
      payments: [],
    });
  } else {
    wallet.balance = income - expenses;
    wallet.payments = [];
    await wallet.save();
  }

  res.json(wallet);
};

export const updateWallet = async (req, res) => {
  const wallet = await Wallet.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );

  res.json(wallet);
};

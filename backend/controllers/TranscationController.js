const Transaction = require("../model/Transaction");

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("user_id", "username email")
      .populate("restaurantId", "name")
      .populate("addedBy", "username");
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("user_id", "username email")
      .populate("restaurantId", "name")
      .populate("addedBy", "username");
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add new transaction
exports.addTransaction = async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete transaction (soft delete)
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get transactions by customer ID
exports.getTransactionByCustomer = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.params.id });
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get transactions by payment type
exports.getTransactionsByPaymentType = async (req, res) => {
  try {
    const { payment_type } = req.body;
    const transactions = await Transaction.find({ payment_type });
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // same as Laravel's belongsTo(Customer::class)
      required: true,
    },
    items: {
      type: Array, // Laravel casts to array
      required: true,
    },
    tax: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    discount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    sub_total: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    total: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    payment_type: {
      type: String,
      enum: ["cash", "card", "upi", "other"], // optional, adjust as per app
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // who added the transaction
    },
    tableNumber: {
      type: String,
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
    },
    note: {
      type: String,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);

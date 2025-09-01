const mongoose = require("mongoose");

const dueTransactionSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // Reference to Customer collection
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"], // optional: set allowed values
      default: "pending",
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // Reference to Restaurant collection
      required: true,
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  }
);

const DueTransaction = mongoose.model("DueTransaction", dueTransactionSchema);

module.exports = DueTransaction;

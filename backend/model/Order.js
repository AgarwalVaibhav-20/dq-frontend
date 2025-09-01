const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
      quantity: { type: Number, default: 1 },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"],
    default: "Pending",
  },
  orderType: { type: String, enum: ["Dine-In", "Takeaway", "Delivery"], default: "Dine-In" },
  tableNumber: { type: String }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);

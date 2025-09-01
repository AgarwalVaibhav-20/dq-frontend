const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["Manager", "Chef", "Waiter", "Delivery"], required: true },
  email: { type: String },
  phone: { type: String },
  salary: { type: Number },
  shift: { type: String }, // e.g. "Morning", "Evening"
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Staff", staffSchema);

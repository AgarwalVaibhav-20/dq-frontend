const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    supplierId: {
      type: String,
      required: true,
    },
    restaurantId: {
      type:String,
      ref: "User", 
      required: true,
    },
    unit: {
      type: String,
      required: true, 
      trim: true,
    },
  },
  { timestamps: true }
);

// 📌 Relation: Inventory belongsTo Supplier
inventorySchema.virtual("supplier", {
  ref: "Supplier",
  localField: "supplierId",
  foreignField: "_id",
  justOne: true,
});

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;

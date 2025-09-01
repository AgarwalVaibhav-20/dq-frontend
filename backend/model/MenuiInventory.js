const mongoose = require("mongoose");

const menuInventorySchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock", // assuming you will have a Stock collection
      required: true,
    },
  },
  { timestamps: true }
);

const MenuInventory = mongoose.model("MenuInventory", menuInventorySchema);
module.exports = MenuInventory;

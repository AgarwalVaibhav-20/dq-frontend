const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    itemImage: {
      type: String,
      default: null,
    },
    price: {
      type: Number,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // assuming you have a Category model
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // assuming you have a Restaurant model
      required: true,
    },
    status: {
      type: Number,
      default: 1, // 1 = active, 0 = inactive
    },
    sub_category: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// 📌 Virtual relation (Menu hasMany MenuInventory)
menuSchema.virtual("stockItems", {
  ref: "MenuInventory",
  localField: "_id",
  foreignField: "menuId",
});

const Menu = mongoose.model("Menu", menuSchema);
module.exports = Menu;

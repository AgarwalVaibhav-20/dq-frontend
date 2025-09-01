const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");
const supplierNanoId = customAlphabet("1234567890", 16);
const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    rawItem: {
      type: String,
      required: true,
      trim: true,
    },
    restaurantId: {
      type: String,
      required:true,
    },
    supplierId:{
      type:String,
      default:`S${supplierNanoId()}`,
    }
  },
  {
    timestamps: true,
  }
);

supplierSchema.virtual("inventories", {
  ref: "Inventory",
  localField: "supplierId",
  foreignField: "supplierId",
});

const Supplier = mongoose.model("Supplier", supplierSchema);

module.exports = Supplier;

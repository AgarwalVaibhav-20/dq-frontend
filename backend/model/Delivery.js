const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // link to Customer collection
      required: true,
    },
    address_1: {
      type: String,
      required: true,
      trim: true,
    },
    address_2: {
      type: String,
      trim: true,
    },
    phone_number: {
      type: String,
      required: true,
      trim: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // link to Restaurant collection
      required: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Delivery = mongoose.model("Delivery", deliverySchema);
module.exports = Delivery;

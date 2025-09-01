const mongoose = require("mongoose");

const deliveryManagementSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // links to Restaurant collection
      required: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    delivery_status: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Laravel model had timestamps disabled
  }
);

const DeliveryManagement = mongoose.model(
  "DeliveryManagement",
  deliveryManagementSchema
);

module.exports = DeliveryManagement;

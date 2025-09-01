const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // Assuming it references a Restaurant model
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // Assuming it references a Customer model
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
    },
    payment: {
      type: Number,
      default: 0,
    },
    advance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;

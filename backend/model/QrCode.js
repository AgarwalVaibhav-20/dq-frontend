const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // Assuming it references a Restaurant collection
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
    },
    qrImage: {
      type: String,
      required: true,
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true, // Laravel model has created_at & updated_at
  }
);

const QrCode = mongoose.model("QrCode", qrCodeSchema);

module.exports = QrCode;

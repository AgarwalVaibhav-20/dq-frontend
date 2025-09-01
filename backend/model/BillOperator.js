const mongoose = require("mongoose");

const billOperatorSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // link to Restaurant collection
      required: true,
    },
    operator: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const BillOperator = mongoose.model("BillOperator", billOperatorSchema);
module.exports = BillOperator;

const mongoose = require("mongoose");

const restaurantBannerSchema = new mongoose.Schema(
  {
    banner_1: {
      type: String,
      trim: true,
      default: "",
    },
    banner_2: {
      type: String,
      trim: true,
      default: "",
    },
    banner_3: {
      type: String,
      trim: true,
      default: "",
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // Assuming you have a Restaurant model
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

const RestaurantBanners = mongoose.model("RestaurantBanners", restaurantBannerSchema);

module.exports = RestaurantBanners;

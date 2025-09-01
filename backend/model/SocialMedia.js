const mongoose = require("mongoose");

const socialMediaSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // reference to Restaurant model
      required: true,
    },
    influencer: {
      type: String,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    insta: {
      type: String,
      trim: true,
    },
    facebook: {
      type: String,
      trim: true,
    },
    youtube: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    offers: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const SocialMedia = mongoose.model("SocialMedia", socialMediaSchema);

module.exports = SocialMedia;

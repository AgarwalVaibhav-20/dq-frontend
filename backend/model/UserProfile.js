const mongoose = require("mongoose");
// const uuid= require('uuid').v4;
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("1234567890", 12);
const userNanoId = customAlphabet("1234567890", 16);
const userProfileSchema = new mongoose.Schema(
  {
    profileImage: {
      type: String,
      default: "https://pbs.twimg.com/media/EbNX_erVcAUlwIx.jpg:large",
    },
    username:{
      type:String,
      ref:"User",
      required:true,
    },
    firstName: {
      type: String,
      trim: true,
      default: "Not set",
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "Not set",
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    userId: {
      type: String,
      default: `U${userNanoId()}`,
      required: true,
    },
    address: {
      type: String,
      default: "Not set",
      required: true,
    },
    phoneNumber: {
      type: String,
      default: "Not set",
      required: true,
    },
    pinCode: {
      type: String,
      default: "Not set",
      required: true,
    },
    restName: {
      type: String,
      default: "Not set",
      required: true,
    },
    restaurantId: {
      type: String,
      default: `R${nanoid()}`,
      required:true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
      required: true,
    },
    identity: {
      type: String,
      default: "Not set",
      required: true,
    },
    fcm: {
      type: String,
      default: "Not set",
      required: true,
    },
    permission: {
      type: String,
    },
    identityNumber: {
      type: String,
      default: "Not set",
    },
    facebook: {
      type: String,
      default: "Not set",
      required: true,
    },
    instagram: {
      type: String,
      default: "Not set",
      required: true,
    },
    whatsapp: {
      type: String,
      default: "Not set",
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

module.exports = UserProfile;

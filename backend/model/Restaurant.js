const mongoose = require("mongoose");
const uuid = require("uuid").v4;
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  restaurantId:{
      type:String,
      default:uuid(20),
    },
  phone: { type: String },
  email: { type: String, match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
  cuisineType: { type: String }, // e.g. "Italian", "Indian"
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Restaurant", restaurantSchema);

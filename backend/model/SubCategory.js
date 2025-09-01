const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    sub_category_name: {
      type: String,
      required: true,
      trim: true,
    },
    restaurantId: {
      type: String,
    },
    categoryId: {
      type: String, 
    },
  },
  {
    timestamps: true,
  }
);
console.log(subCategorySchema)
const SubCategory = mongoose.model("SubCategory", subCategorySchema);

module.exports = SubCategory;

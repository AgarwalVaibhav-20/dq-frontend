const RestaurantBanners = require("../model/RestaurantBanners");

// 📌 Create or update banners for a restaurant
exports.createOrUpdateBanners = async (req, res) => {
  try {
    const { restaurantId, banner_1, banner_2, banner_3 } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ message: "restaurantId is required" });
    }

    let banners = await RestaurantBanners.findOne({ restaurantId });

    if (banners) {
      // Update existing banners
      banners.banner_1 = banner_1 || banners.banner_1;
      banners.banner_2 = banner_2 || banners.banner_2;
      banners.banner_3 = banner_3 || banners.banner_3;
      await banners.save();
      return res.json({ message: "Banners updated successfully", banners });
    } else {
      // Create new banners
      banners = new RestaurantBanners({ restaurantId, banner_1, banner_2, banner_3 });
      await banners.save();
      return res.status(201).json({ message: "Banners created successfully", banners });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Get banners by restaurant
exports.getBannersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const banners = await RestaurantBanners.findOne({ restaurantId });
    if (!banners) {
      return res.status(404).json({ message: "No banners found for this restaurant" });
    }
    res.json({ banners });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Delete banners (optional)
exports.deleteBanners = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const result = await RestaurantBanners.findOneAndDelete({ restaurantId });
    if (!result) {
      return res.status(404).json({ message: "No banners found to delete" });
    }
    res.json({ message: "Banners deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

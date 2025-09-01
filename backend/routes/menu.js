const Menu = require('../model/Menu');
const express = require('express');
const router = express.Router();


router.post('/menu', upload.single("image"), async (req, res) => {
  try {
    const { restaurant, category, name, description, price, isAvailable } = req.body;

    if (!restaurant || !category || !name || !price) {
      return res.status(400).json({ error: "Restaurant, category, name, and price are required" });
    }

    const newMenuItem = new Menu({
      restaurant,
      category,
      name,
      description,
      price,
      isAvailable,
      image: req.file?.path // Cloudinary URL
    });

    const savedMenu = await newMenuItem.save();

    res.status(201).json({
      message: "Menu item created successfully",
      data: savedMenu
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Category = require('../model/Category');
const User = require('../model/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {authMiddleware} = require('../middleware/authMiddleware');



// ---------- Multer setup ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/categories';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ---------- CREATE CATEGORY ----------
router.post('/category',authMiddleware, upload.single('categoryImage'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const categoryId = req.user.categoryId;
    const { categoryName } = req.body;
    console.log(req.body)
    if (!categoryName  || !req.file) {
      return res.status(400).json({ message: 'categoryName, restaurantId, and image are required' });
    }
    const categoryImage = `/uploads/categories/${req.file.filename}`;
    const newCategory = new Category({ categoryName,  categoryImage ,restaurantId , categoryId });
    await newCategory.save();
    console.log(newCategory + "<----the new category ")
    res.status(201).json(newCategory);
  } catch (err) {
    console.log(err + "<----the error ")
    console.error(err);
    res.status(500).json({ message: 'Server error' });
    res.status(500).json({message:err.message})
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ data: categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- GET ALL CATEGORIES BY RESTAURANT ----------
// router.get('/categories/:restaurantId', async (req, res) => {
//   const { restaurantId } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
//     return res.status(400).json({ message: 'Invalid restaurantId' });
//   }

//   try {
//     const userExists = await User.exists({ restaurantId });
//     if (!userExists) {
//       return res.status(404).json({ message: 'No user found for this restaurantId' });
//     }

//     const categories = await Category.find();
//     res.json({ data: categories });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// ---------- GET CATEGORY BY ID ----------
router.get('/category/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ data: category });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- UPDATE CATEGORY ----------
router.post('/:id', upload.single('categoryImage'), async (req, res) => {
  try {
    const { categoryName, restaurantId } = req.body;
    const updateData = {};
    if (categoryName) updateData.categoryName = categoryName;
    if (restaurantId) updateData.restaurantId = restaurantId;
    if (req.file) updateData.categoryImage = req.file.path;

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedCategory);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- DELETE CATEGORY ----------
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (category.categoryImage && fs.existsSync(category.categoryImage)) {
      fs.unlinkSync(category.categoryImage);
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

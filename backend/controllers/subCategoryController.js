const SubCategory = require('../model/SubCategory');
const Category = require('../model/Category');

// ✅ Create a subcategory
// exports.createSubCategory = async (req, res) => {
//   try {

//     const { sub_category_name, categoryId, categoryName , restaurantId } = req.body;

//     if (!sub_category_name || !categoryId || !restaurantId) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Optional: Check if category exists
//     const category = await Category.findById(categoryId);
//     console.log(category)
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     const newSubCategory = await SubCategory.create({
//       sub_category_name,
//       categoryId,
//       categoryName,
//       restaurantId,
//     });

//     res.status(201).json(newSubCategory);
//   } catch (error) {
//     console.log(error)
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
exports.createSubCategory = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const categoryId = req.user.categoryId;
    const { sub_category_name  } = req.body;
    console.log(req.body)
    if (!sub_category_name || !categoryId) {
      return res.status(400).json({ message: 'sub_category_name and categoryId are required' });
    }
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const newSubCategory = new SubCategory({
      sub_category_name,
      categoryId,
      restaurantId,
    });
    console.log(newSubCategory)
    await newSubCategory.save();
    console.log(newSubCategory, '<---- new subcategory');
    res.status(201).json(newSubCategory);
  } catch (err) {
    console.error(err, '<---- subcategory creation error');
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// ✅ Fetch all subcategories for a restaurant
exports.getSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find();
    res.status(200).json(subCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Fetch single subcategory by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    res.status(200).json(subCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Update a subcategory
exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_category_name, categoryId } = req.body;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    if (sub_category_name) subCategory.sub_category_name = sub_category_name;
    if (categoryId) subCategory.categoryId = categoryId;

    await subCategory.save();
    res.status(200).json(subCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Delete a subcategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    await SubCategory.findByIdAndDelete(id);
    res.status(200).json({ message: 'Deleted successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

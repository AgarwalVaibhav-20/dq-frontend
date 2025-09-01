const express = require("express");
const router = express.Router();
const subcategoryController = require("../controllers/subCategoryController");
const {authMiddleware} = require('../middleware/authMiddleware')
router.post("/subCategory",authMiddleware, subcategoryController.createSubCategory);
router.get("/subCategory",authMiddleware, subcategoryController.getSubCategories);
router.get("/subCategory/:id",authMiddleware, subcategoryController.getSubCategoryById);
router.put("/subCategory/:id",authMiddleware, subcategoryController.updateSubCategory);
router.delete("/subCategory/:id",authMiddleware, subcategoryController.deleteSubCategory);


module.exports = router;

const express = require("express");
const router = express.Router();
const SupplierController = require("../controllers/SupplierController");

// Get all suppliers
router.get("/suppliers", SupplierController.getSuppliers);

// Get a supplier by ID
router.get("/:id", SupplierController.getSupplier);

// Create a new supplier
router.post("/suppliers", SupplierController.createSupplier);

// Update a supplier
router.put("/:id", SupplierController.updateSupplier);

// Delete a supplier
router.delete("/:id", SupplierController.deleteSupplier);

module.exports = router;

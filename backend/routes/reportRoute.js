const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/ReportController");
const authMiddleware = require("../middleware/authMiddleware");

// 📊 Reports Routes
router.get("/sales", authMiddleware, ReportController.getSalesReport);
router.get("/customers", authMiddleware, ReportController.getCustomerReport);
router.get("/inventory", authMiddleware, ReportController.getInventoryReport);
router.get("/orders", authMiddleware, ReportController.getOrderSummary);

module.exports = router;

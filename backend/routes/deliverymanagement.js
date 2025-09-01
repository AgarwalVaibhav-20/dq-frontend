const express = require("express");
const router = express.Router();
const DeliveryManagementController = require("../controllers/DeliveryManagementController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Delivery Management Routes
router.post("/assign", authMiddleware, DeliveryManagementController.assignDelivery);
router.put("/status", authMiddleware, DeliveryManagementController.updateDeliveryStatus);
router.get("/order/:id", authMiddleware, DeliveryManagementController.getOrderDeliveryDetails);
router.get("/active", authMiddleware, DeliveryManagementController.getActiveDeliveries);

module.exports = router;

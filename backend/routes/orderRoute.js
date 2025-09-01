const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const authMiddleware = require("../middleware/authMiddleware");

// 📦 Order Routes
router.post("/", authMiddleware, orderController.createOrder);
router.get("/", authMiddleware, orderController.getAllOrders);
router.get("/:id", authMiddleware, orderController.getOrderById);
router.put("/:id", authMiddleware, orderController.updateOrder);
router.delete("/:id", authMiddleware, orderController.deleteOrder);

module.exports = router;

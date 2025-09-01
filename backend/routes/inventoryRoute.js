const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/InventoryController");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/", authMiddleware, inventoryController.addInventory);
router.get("/", authMiddleware, inventoryController.getInventory);
router.get("/:id", authMiddleware, inventoryController.getInventoryById);
router.put("/:id", authMiddleware, inventoryController.updateInventory);
router.delete("/:id", authMiddleware, inventoryController.deleteInventory);
router.patch("/:id/stock", authMiddleware, inventoryController.updateStock);

module.exports = router;

const express = require("express");
const {
  getQrCodes,
  createQrCode,
  deleteQrCode,
} = require("../controller/qrController.js");
const { authMiddleware } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/:restaurantId", authMiddleware, getQrCodes);
router.post("/create", authMiddleware, createQrCode);
router.delete("/delete/:id", authMiddleware, deleteQrCode);

module.exports = router;

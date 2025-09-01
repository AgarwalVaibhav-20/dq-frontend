const express = require("express");
const CustomerController = require("../controllers/CustomerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Only admin/manager can manage customers
router.get("/", authMiddleware["user"], CustomerController.getAllCustomers);
router.get("/:id", authMiddleware["user"], CustomerController.getCustomerById);
router.put("/:id", authMiddleware["user"], CustomerController.updateCustomer);
router.delete("/:id", authMiddleware["user"], CustomerController.deleteCustomer);
router.patch("/:id/status", authMiddleware["user"], CustomerController.changeCustomerStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const TransactionController = require("../controllers/TranscationController");

// CRUD routes
router.get("/", TransactionController.getAllTransactions);
router.get("/:id", TransactionController.getTransactionById);
router.post("/", TransactionController.addTransaction);
router.put("/:id", TransactionController.updateTransaction);
router.delete("/:id", TransactionController.deleteTransaction);

// Extra routes
router.get("/customer/:id", TransactionController.getTransactionByCustomer);
router.post("/by-payment-type", TransactionController.getTransactionsByPaymentType);

module.exports = router;

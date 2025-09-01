const Order = require("../model/Order");
const User = require("../model/User");
const Inventory = require("../model/Inventory");

const ReportController = {
  // 📌 Sales Report
  getSalesReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filter = {};

      if (startDate && endDate) {
        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      const sales = await Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]);

      res.json({ success: true, sales: sales[0] || {} });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 📌 Customer Report
  getCustomerReport: async (req, res) => {
    try {
      const customers = await User.aggregate([
        { $match: { role: "user" } },
        {
          $group: {
            _id: "$isVerified",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({ success: true, customers });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 📌 Inventory Report
  getInventoryReport: async (req, res) => {
    try {
      const inventory = await Inventory.aggregate([
        {
          $group: {
            _id: "$status",
            totalItems: { $sum: 1 },
            totalStock: { $sum: "$quantity" },
          },
        },
      ]);

      res.json({ success: true, inventory });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 📌 Order Summary Report
  getOrderSummary: async (req, res) => {
    try {
      const orders = await Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({ success: true, orders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = ReportController;

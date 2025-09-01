const Order = require("../model/Order");
const Customer = require("../model/Customer");
const Delivery = require("../model/Delivery");

// ✅ Create new order
exports.createOrder = async (req, res) => {
  try {
    const { customerId, items, totalAmount, status, deliveryId } = req.body;

    const order = new Order({
      customerId,
      items,
      totalAmount,
      status: status || "pending",
      deliveryId,
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "name email")
      .populate("deliveryId", "deliveryPerson status");

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email")
      .populate("deliveryId", "deliveryPerson status");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Update order
exports.updateOrder = async (req, res) => {
  try {
    const { items, totalAmount, status, deliveryId } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { items, totalAmount, status, deliveryId },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, message: "Order updated successfully", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

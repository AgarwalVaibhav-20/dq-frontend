const Delivery = require("../model/DeliveryManagement");
const Order = require("../model/Order");

// 📌 Assign a delivery person to an order
exports.assignDelivery = async (req, res) => {
  try {
    const { orderId, deliveryId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return res.status(404).json({ message: "Delivery person not found" });

    // Update order with delivery person
    order.deliveryPerson = delivery._id;
    order.deliveryStatus = "Assigned";
    await order.save();

    res.json({ message: "Delivery person assigned successfully", data: order });
  } catch (err) {
    res.status(500).json({ message: "Error assigning delivery person", error: err.message });
  }
};

// 📌 Update delivery status (Picked, On The Way, Delivered, etc.)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.deliveryStatus = status;
    await order.save();

    res.json({ message: "Delivery status updated successfully", data: order });
  } catch (err) {
    res.status(500).json({ message: "Error updating delivery status", error: err.message });
  }
};

// 📌 Get all deliveries for an order
exports.getOrderDeliveryDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("deliveryPerson");
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ data: order });
  } catch (err) {
    res.status(500).json({ message: "Error fetching order delivery details", error: err.message });
  }
};

// 📌 Get all active deliveries (not yet delivered)
exports.getActiveDeliveries = async (req, res) => {
  try {
    const activeOrders = await Order.find({ deliveryStatus: { $ne: "Delivered" } })
      .populate("deliveryPerson")
      .sort({ createdAt: -1 });

    res.json({ data: activeOrders });
  } catch (err) {
    res.status(500).json({ message: "Error fetching active deliveries", error: err.message });
  }
};

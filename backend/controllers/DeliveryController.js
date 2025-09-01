const Delivery = require("../model/Delivery");

// 📌 Create a new Delivery Person
exports.createDelivery = async (req, res) => {
  try {
    const delivery = new Delivery(req.body);
    await delivery.save();
    res.status(201).json({ message: "Delivery person created successfully", data: delivery });
  } catch (err) {
    res.status(500).json({ message: "Error creating delivery person", error: err.message });
  }
};

// 📌 Get all Delivery Persons (with optional restaurant filter)
exports.getDeliveries = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const filter = restaurantId ? { restaurantId } : {};
    const deliveries = await Delivery.find(filter);
    res.json({ data: deliveries });
  } catch (err) {
    res.status(500).json({ message: "Error fetching deliveries", error: err.message });
  }
};

// 📌 Get Single Delivery Person by ID
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: "Delivery person not found" });
    res.json({ data: delivery });
  } catch (err) {
    res.status(500).json({ message: "Error fetching delivery", error: err.message });
  }
};

// 📌 Update Delivery Person
exports.updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!delivery) return res.status(404).json({ message: "Delivery person not found" });
    res.json({ message: "Delivery person updated successfully", data: delivery });
  } catch (err) {
    res.status(500).json({ message: "Error updating delivery", error: err.message });
  }
};

// 📌 Delete Delivery Person
exports.deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!delivery) return res.status(404).json({ message: "Delivery person not found" });
    res.json({ message: "Delivery person deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting delivery", error: err.message });
  }
};

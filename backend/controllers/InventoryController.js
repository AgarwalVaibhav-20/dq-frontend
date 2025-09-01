const Inventory = require("../model/Inventory");

// ➤ Add new inventory item
exports.addInventory = async (req, res) => {
  try {
    const { name, quantity, price, category, restaurantId } = req.body;

    const inventory = new Inventory({
      name,
      quantity,
      price,
      category,
      restaurantId,
    });

    await inventory.save();
    res.status(201).json({ message: "Inventory item added successfully", inventory });
  } catch (err) {
    res.status(500).json({ message: "Error adding inventory item", error: err.message });
  }
};

// ➤ Get all inventory items (by restaurantId)
exports.getInventory = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ message: "restaurantId is required" });

    const items = await Inventory.find({ restaurantId });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inventory", error: err.message });
  }
};

// ➤ Get single inventory item
exports.getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: "Error fetching item", error: err.message });
  }
};

// ➤ Update inventory item
exports.updateInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item updated successfully", item });
  } catch (err) {
    res.status(500).json({ message: "Error updating item", error: err.message });
  }
};

// ➤ Delete inventory item
exports.deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting item", error: err.message });
  }
};

// ➤ Update stock quantity
exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = quantity;
    await item.save();

    res.status(200).json({ message: "Stock updated successfully", item });
  } catch (err) {
    res.status(500).json({ message: "Error updating stock", error: err.message });
  }
};

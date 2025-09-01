const Supplier = require("../model/Supplier");

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().populate("inventories");
    res.json({ success: true, data: suppliers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get supplier by ID
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate("inventories");
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ success: true, data: supplier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { supplierName, email, phoneNumber, rawItem } = req.body;

    // Validation
    if (!supplierName || !phoneNumber) {
      return res.status(400).json({
        message: "Supplier name and phone number are required",
      });
    }
    if (email) {
      const existingSupplier = await Supplier.findOne({ email, restaurantId });
      if (existingSupplier) {
        return res
          .status(400)
          .json({ message: "Supplier already exists with this email" });
      }
    }
    const supplier = new Supplier({
      supplierName,
      email,
      phoneNumber,
      rawItem,
      restaurantId,
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (err) {
    console.log(err)
    console.error("❌ Error creating supplier:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};


// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ success: true, data: supplier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ success: true, message: "Supplier deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

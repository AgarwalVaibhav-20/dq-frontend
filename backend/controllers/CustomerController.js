// controllers/CustomerController.js
const User = require("../model/User");

// 📌 Create Customer (Signup as Customer)
exports.createCustomer = async (req, res) => {
  try {
    const { username, email, password, profilePhoto } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newCustomer = new User({
      username,
      email,
      password,
      profilePhoto,
      role: "user",
    });

    await newCustomer.save();
    res.status(201).json({ message: "Customer created successfully", customer: newCustomer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get All Customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "user" }).select("-password -verifyOTP -otpExpiry");
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get Single Customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: "user" }).select("-password -verifyOTP -otpExpiry");
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Update Customer
exports.updateCustomer = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.password) delete updates.password; // password should be updated separately

    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "user" },
      updates,
      { new: true }
    ).select("-password -verifyOTP -otpExpiry");

    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer updated successfully", customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Delete (Soft Delete) Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "user" },
      { status: 0 }, // mark inactive
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deactivated", customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Restore Customer
exports.restoreCustomer = async (req, res) => {
  try {
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "user" },
      { status: 1 }, // mark active again
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer restored", customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Permanently Delete Customer
exports.permanentDeleteCustomer = async (req, res) => {
  try {
    const customer = await User.findOneAndDelete({ _id: req.params.id, role: "user" });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

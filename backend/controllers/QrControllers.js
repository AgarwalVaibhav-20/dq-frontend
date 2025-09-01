const QRCode = require("qrcode");
const Qr = require("../model/QrCode"); // Make sure you create Qr model

// Generate QR Code for a URL/Text
exports.generateQr = async (req, res) => {
  try {
    const { text, restaurantId } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });

    // Generate QR image as Data URL
    const qrImage = await QRCode.toDataURL(text);

    // Save in DB
    const qr = await Qr.create({ text, qrImage, restaurantId });

    res.status(201).json({ message: "QR Code generated successfully", data: qr });
  } catch (err) {
    res.status(500).json({ message: "Error generating QR code", error: err.message });
  }
};

// Get all QR Codes
exports.getQrs = async (req, res) => {
  try {
    const qrs = await Qr.find().sort({ createdAt: -1 });
    res.json({ data: qrs });
  } catch (err) {
    res.status(500).json({ message: "Error fetching QR codes", error: err.message });
  }
};

// Get QR Code by ID
exports.getQrById = async (req, res) => {
  try {
    const qr = await Qr.findById(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR Code not found" });
    res.json({ data: qr });
  } catch (err) {
    res.status(500).json({ message: "Error fetching QR code", error: err.message });
  }
};

// Delete QR Code
exports.deleteQr = async (req, res) => {
  try {
    const qr = await Qr.findByIdAndDelete(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR Code not found" });
    res.json({ message: "QR Code deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting QR code", error: err.message });
  }
};

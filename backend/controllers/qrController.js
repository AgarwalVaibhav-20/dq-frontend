const QrCode = require('../model/Qrcode')
const normalize = (qr) => ({
  id: qr._id,
  restaurantId: qr.restaurantId,
  tableNumber: qr.tableNumber,
  qrCodeUrl: qr.qrCodeUrl,
  createdAt: qr.createdAt,
  updatedAt: qr.updatedAt,
});

 const getQrCodes = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const qrCodes = await QrCode.find({ restaurantId }).sort({ tableNumber: 1 });
    res.json(qrCodes.map(normalize));
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).json({ message: "Failed to fetch QR codes" });
  }
};

 const createQrCode = async (req, res) => {
  try {
    const { restaurantId, tableNo } = req.body;

    if (!restaurantId || tableNo == null) {
      return res
        .status(400)
        .json({ message: "Restaurant ID and table number are required" });
    }

    const newQr = new QrCode({
      restaurantId,
      tableNumber: tableNo,
    });

    const savedQr = await newQr.save();
    res.status(201).json(normalize(savedQr));
  } catch (error) {
    console.error("Error creating QR code:", error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "QR code for this table already exists" });
    }

    res.status(500).json({ message: "QR code creation failed" });
  }
};

// @desc Delete a QR code
 const deleteQrCode = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQr = await QrCode.findByIdAndDelete(id);

    if (!deletedQr) {
      return res.status(404).json({ message: "QR code not found" });
    }

    res.json({ message: "QR code deleted successfully", id });
  } catch (error) {
    console.error("Error deleting QR code:", error);
    res.status(500).json({ message: "Failed to delete QR code" });
  }
};
module.exports = {
  getQrCodes,
  createQrCode,
  deleteQrCode,
};
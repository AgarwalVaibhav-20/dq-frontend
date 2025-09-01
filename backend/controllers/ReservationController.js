const Reservation = require("../model/Reservation");

// 📌 Create Reservation
exports.createReservation = async (req, res) => {
  try {
    const { restaurantId, userId, date, time, guests, specialRequest } = req.body;

    const reservation = new Reservation({
      restaurantId,
      userId,
      date,
      time,
      guests,
      specialRequest,
    });

    await reservation.save();
    res.status(201).json({ message: "Reservation created successfully", reservation });
  } catch (err) {
    res.status(500).json({ message: "Error creating reservation", error: err.message });
  }
};

// 📌 Get all reservations (Admin/Manager)
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("restaurantId", "restName")
      .populate("userId", "username email");

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reservations", error: err.message });
  }
};

// 📌 Get reservations by Restaurant
exports.getReservationsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const reservations = await Reservation.find({ restaurantId })
      .populate("userId", "username email");

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Error fetching restaurant reservations", error: err.message });
  }
};

// 📌 Get reservations by User
exports.getReservationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reservations = await Reservation.find({ userId })
      .populate("restaurantId", "restName");

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user reservations", error: err.message });
  }
};

// 📌 Update reservation (change date/time/guests)
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndUpdate(id, req.body, { new: true });

    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    res.json({ message: "Reservation updated successfully", reservation });
  } catch (err) {
    res.status(500).json({ message: "Error updating reservation", error: err.message });
  }
};

// 📌 Cancel reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);

    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    res.json({ message: "Reservation cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error cancelling reservation", error: err.message });
  }
};

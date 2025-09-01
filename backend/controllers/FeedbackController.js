const Feedback = require("../model/Feedback");

// ✅ Create Feedback
exports.createFeedback = async (req, res) => {
  try {
    const { userId, restaurantId, deliveryId, rating, comments } = req.body;

    const feedback = new Feedback({
      userId,
      restaurantId,
      deliveryId,
      rating,
      comments,
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (err) {
    res.status(500).json({ message: "Error creating feedback", error: err.message });
  }
};

// ✅ Get All Feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("userId", "username email")
      .populate("restaurantId", "restName")
      .populate("deliveryId", "deliveryStatus");
    res.json({ feedbacks });
  } catch (err) {
    res.status(500).json({ message: "Error fetching feedbacks", error: err.message });
  }
};

// ✅ Get Feedback by Restaurant
exports.getFeedbackByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const feedbacks = await Feedback.find({ restaurantId })
      .populate("userId", "username email");
    res.json({ feedbacks });
  } catch (err) {
    res.status(500).json({ message: "Error fetching restaurant feedback", error: err.message });
  }
};

// ✅ Get Feedback by User
exports.getFeedbackByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ userId }).populate("restaurantId", "restName");
    res.json({ feedbacks });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user feedback", error: err.message });
  }
};

// ✅ Update Feedback
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndUpdate(id, req.body, { new: true });
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json({ message: "Feedback updated successfully", feedback });
  } catch (err) {
    res.status(500).json({ message: "Error updating feedback", error: err.message });
  }
};

// ✅ Delete Feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting feedback", error: err.message });
  }
};

const User = require("../model/User");

/**
 * @desc    Get profile by userId
 * @route   GET /api/profile/:userId
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    console.log(user)
    if (!user) {
      console.log("User not found" , error)
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console.log("User found:", user);
    res.json({ success: true, data: user });
  } catch (err) {
    console.log(err);
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Update profile
 * @route   PUT /api/profile/:userId
 */
exports.updateProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };
    // prevent email/username overwrite unless you allow it
    delete updateData.password;
    delete updateData.email;
    delete updateData.username;

    const updatedUser = await User.findOneAndUpdate(
      { userId: req.params.userId },
      updateData,
      { new: true, runValidators: true }
    ).select("-password -verifyOTP -otpExpiry");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    console.log(err)
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Delete profile
 * @route   DELETE /api/profile/:userId
 */
exports.deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const deletedUser = await User.findOneAndDelete({ userId });
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Profile deleted" });
  } catch (err) {
    console.error("Error deleting profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.checkRestaurantPermission = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const profile = await User.findOne({ userId });

    if (!profile) return res.status(403).json({ success: false, message: "No permission" });

    res.json({ success: true, message: "Permission granted", data: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

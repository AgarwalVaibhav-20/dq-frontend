const SocialMedia = require("../model/SocialMedia");

// Get all social media entries
exports.index = async (req, res) => {
  try {
    const socials = await SocialMedia.find().populate("restaurantId");
    res.json({ success: true, data: socials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single social media entry by ID
exports.show = async (req, res) => {
  try {
    const social = await SocialMedia.findById(req.params.id).populate("restaurantId");
    if (!social) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, data: social });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new social media entry
exports.store = async (req, res) => {
  try {
    const { restaurantId, influencer, details, insta, facebook, youtube, location, offers, price, available } = req.body;
    if (!restaurantId) return res.status(400).json({ message: "restaurantId is required" });

    const social = new SocialMedia({
      restaurantId,
      influencer,
      details,
      insta,
      facebook,
      youtube,
      location,
      offers,
      price,
      available
    });

    await social.save();
    res.status(201).json({ message: "Social media entry created", data: social });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a social media entry
exports.update = async (req, res) => {
  try {
    const social = await SocialMedia.findById(req.params.id);
    if (!social) return res.status(404).json({ message: "Not found" });

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      social[key] = updates[key];
    });

    await social.save();
    res.json({ message: "Social media entry updated", data: social });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a social media entry
exports.destroy = async (req, res) => {
  try {
    const social = await SocialMedia.findByIdAndDelete(req.params.id);
    if (!social) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Social media entry deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const express = require("express");
const router = express.Router();

const {checkRestaurantPermission,
  deleteProfile,
  getProfile,
  updateProfile
} = require('../controllers/UserProfile')
// ------------------- ROUTES -------------------

// router.post("/create", createProfile);
// router.get("/all", getAllProfiles);

router.get("/:userId", getProfile);

router.put("/user/update/:userId", updateProfile);

router.delete("/user/delete/:userId", deleteProfile);

router.get("/user-profile/check-permission/:userId", checkRestaurantPermission);


module.exports = router;

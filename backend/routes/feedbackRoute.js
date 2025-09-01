const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/FeedbackController");
router.post("/", feedbackController.createFeedback);
router.get("/", feedbackController.getAllFeedback); 
router.get("/restaurant/:restaurantId", feedbackController.getFeedbackByRestaurant); 
router.get("/user/:userId", feedbackController.getFeedbackByUser); 
router.put("/:id", feedbackController.updateFeedback); 
router.delete("/:id", feedbackController.deleteFeedback); 

module.exports = router;

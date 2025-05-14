// routes/buyRequestRoutes.js
const express = require("express");
const buyRequestController = require("../Controllers/buyRequestController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, buyRequestController.createBuyRequest); // Protected route for creating buy request
router.get("/owner", authMiddleware, buyRequestController.getBuyRequestsByOwner); // Protected route for owners to view requests
router.put("/status", authMiddleware, buyRequestController.updateBuyRequestStatus); // Protected route to approve/deny request

router.get("/buyer/:userId", authMiddleware, buyRequestController.getBuyRequestsByBuyer);
router.get("/check-status/:requestId", authMiddleware, buyRequestController.getBuyRequestStatus);


// 🚀 New Route for Real-time Notification
// Update your routes in the backend to use PUT instead of POST
router.put('/api/buy-requests/:requestId/approve', authMiddleware, buyRequestController.approveBuyRequestWithNotification);
router.put('/api/buy-requests/:requestId/deny', authMiddleware, buyRequestController.denyBuyRequestWithNotification);




module.exports = router;

// routes/buyRequestRoutes.js
const express = require("express");
const buyRequestController = require("../Controllers/buyRequestController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, buyRequestController.createBuyRequest); // use
router.get("/owner", authMiddleware, buyRequestController.getBuyRequestsByOwner); // use
router.put("/status", authMiddleware, buyRequestController.updateBuyRequestStatus); // use

router.get("/buyer/:userId", authMiddleware, buyRequestController.getBuyRequestsByBuyer);//use 
router.get("/check-status/:requestId", authMiddleware, buyRequestController.getBuyRequestStatus);// use

module.exports = router;

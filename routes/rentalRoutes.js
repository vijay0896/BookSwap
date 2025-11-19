
const express = require("express");
const router = express.Router();
const rentalController = require("../Controllers/rentalController");
const { uploadEbook } = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes for Rental Books
router.post("/", authMiddleware, ...uploadEbook, rentalController.addRentalBook);
router.get("/", authMiddleware, rentalController.getAllRentalsByOwner);
router.get("/:id", rentalController.getRentalById);
router.put("/:id", authMiddleware, ...uploadEbook, rentalController.updateRental);
router.delete("/:id", authMiddleware, rentalController.deleteRental);

module.exports = router;
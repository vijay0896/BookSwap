const express = require("express");
const router = express.Router();
const rentalController = require("../Controllers/rentalController");
const {uploadEbook} = require("../middlewares/upload"); // PDF Upload Middleware
const authMiddleware = require("../middlewares/authMiddleware");
// Routes for Rental Books
router.post("/", authMiddleware, uploadEbook.single("pdf"), rentalController.addRentalBook);
router.get("/", authMiddleware,rentalController.getAllRentalsByOwner);

router.get("/:id", rentalController.getRentalById);
router.put("/:id", authMiddleware, uploadEbook.single("pdf"), rentalController.updateRental);
router.delete("/:id", authMiddleware, rentalController.deleteRental);

module.exports = router;

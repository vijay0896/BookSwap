const rentalModel = require("../models/rentalModel");
exports.addRentalBook = async (req, res) => {
  try {
    // console.log("Received file:", req.file); // Debug uploaded file
    // console.log("Received body:", req.body); // Debug form-data
    const { book_id, rental_price, rental_duration } = req.body;
    const renter_id = req.user.id; // Assuming authentication middleware adds `req.user.id`

    if (!book_id || !rental_price || !rental_duration) {
      return res
        .status(400)
        .json({
          error: "Book ID, rental price, and rental duration are required",
        });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "PDF file is required for rental books" });
    }

    const pdf_url = req.file.location; // Assuming AWS S3 PDF URL

    const rentalId = await rentalModel.addRental({
      book_id,
      renter_id,
      rental_price,
      rental_duration,
      pdf_url,
    });

    res
      .status(201)
      .json({ message: "Rental book added successfully", rentalId });
  } catch (error) {
    console.error("Error in addRentalBook:", error);
    res
      .status(500)
      .json(error.error ? error : { error: "Internal Server Error" });
  }
};

exports.getAllRentals = async (req, res) => {
  try {
    const rentals = await rentalModel.getAllRentals();
    res.json(rentals);
  } catch (error) {
    console.error("Error in getAllRentals:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.getAllRentalsByOwner = async (req, res) => {
  const ownerId = req.user?.id || req.params.ownerId || req.body.ownerId;

  if (!ownerId) {
    return res.status(400).json({ error: "Owner ID is required" });
  }

  try {
    const rentals = await rentalModel.getAllRentalsByOwner(ownerId);
    res.json(rentals);
  } catch (error) {
    console.error("Error in getAllRentalsByOwner:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getRentalById = async (req, res) => {
  try {
    const rental = await rentalModel.getRentalById(req.params.id);
    if (!rental)
      return res.status(404).json({ error: "Rental book not found" });
    res.json(rental);
  } catch (error) {
    console.error("Error in getRentalById:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;

    // Check if rental exists before updating
    const existingRental = await rentalModel.getRentalById(id);
    if (!existingRental)
      return res.status(404).json({ error: "Rental book not found" });

    // Keep existing values if fields are skipped
    updates.rental_price = updates.rental_price || existingRental.rental_price;
    updates.rental_duration = updates.rental_duration || existingRental.rental_duration;
    updates.rental_status = updates.rental_status || existingRental.rental_status;

    // If a file is uploaded, update the pdf_url; otherwise, keep the existing one
    if (req.file) {
      updates.pdf_url = req.file.location; // S3 stores file URL in 'location'
    } else {
      updates.pdf_url = existingRental.pdf_url;
    }

    await rentalModel.updateRental(id, updates);
    res.json({ message: "Rental updated successfully" });
  } catch (error) {
    console.error("Error in updateRental:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.deleteRental = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rental exists before deleting
    const existingRental = await rentalModel.getRentalById(id);
    if (!existingRental)
      return res.status(404).json({ error: "Rental book not found" });

    await rentalModel.deleteRental(id);
    res.json({ message: "Rental deleted successfully" });
  } catch (error) {
    console.error("Error in deleteRental:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

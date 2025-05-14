const resaleBookModel = require("../models/resaleBookModel");

exports.getAllResaleBooks = (req, res) => {
  resaleBookModel.getAllResaleBooks()
    .then(books => res.json(books))
    .catch(error => {
      console.error("Error in getAllResaleBooks:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};
exports.getAllResaleBooksByOwner = (req, res) => {
  const ownerId = req.user?.id || req.params.ownerId || req.body.ownerId;

  if (!ownerId) {
    return res.status(400).json({ error: "Owner ID is required" });
  }

  resaleBookModel.getAllResaleBooksByOwner(ownerId)
    .then(books => res.json(books))
    .catch(error => {
      console.error("Error in getAllResaleBooksByOwner:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};



exports.getResaleBookById = (req, res) => {
  resaleBookModel.getResaleBookById(req.params.id)
    .then(book => {
      if (!book) return res.status(404).json({ error: "Resale book not found" });
      res.json(book);
    })
    .catch(error => {
      console.error("Error in getResaleBookById:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

exports.addResaleBook = async (req, res) => {
  try {
    const { book_id, price } = req.body;
    const seller_id = req.user.id; // Assuming authentication middleware adds `req.user.id`

    if (!book_id || !price) {
      return res.status(400).json({ error: "Book ID and Price are required" });
    }

    const resaleBookId = await resaleBookModel.addResaleBook({ book_id, seller_id, price });

    res.status(201).json({ message: "Resale book added successfully", resaleBookId });
  } catch (error) {
    console.error("Error in addResaleBook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.updateResaleBook = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      // Check if the resale book exists before updating
      const existingBook = await resaleBookModel.getResaleBookById(id);
      if (!existingBook) {
        return res.status(404).json({ error: "Resale book not found" });
      }
  
      // Validate price and status
      if (updates.price !== undefined && isNaN(updates.price)) {
        return res.status(400).json({ error: "Price must be a valid number" });
      }
      if (updates.status && !["available", "sold"].includes(updates.status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
  
      // Update the resale book
      await resaleBookModel.updateResaleBook(id, updates);
  
      res.json({ message: "Resale book updated successfully" });
    } catch (error) {
      console.error("Error in updateResaleBook:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

exports.deleteResaleBook = (req, res) => {
  const { id } = req.params;

  resaleBookModel.deleteResaleBook(id)
    .then(response => res.json(response))
    .catch(error => {
      console.error("Error in deleteResaleBook:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

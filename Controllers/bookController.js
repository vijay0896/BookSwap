const bookModel = require("../models/bookModel");

exports.getAllBooks = (req, res) => {
  bookModel
    .getAllBooks()
    .then((books) => res.json(books))
    .catch((error) => {
      console.error("Error in getAllBooks:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

exports.getBookById = (req, res) => {
  bookModel
    .getBookById(req.params.id)
    .then((book) => {
      if (!book) return res.status(404).json({ error: "Book not found" });
      res.json(book);
    })
    .catch((error) => {
      console.error("Error in getBookById:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

exports.addBook = async (req, res) => {
  try {
    const {
      title,
      author,
      genre,
      description,
      price,
      availability,
      service_type,
      rental_price,
      rental_duration,
    } = req.body;

    const owner_id = req.user.id; // Assuming authentication middleware adds `req.user.id`

    if (!title || !author || !service_type) {
      return res
        .status(400)
        .json({ error: "Title, Author, and Service Type are required" });
    }

    // Step 1: Insert book into the database
    const bookData = {
      title,
      author,
      genre,
      description,
      // cover_image_url: req.file ? req.file.location : null, // If image uploaded, get its S3 URL
      cover_image_url: null,
      price,
      availability,
      owner_id,
      service_type,
    };

    const { book_id } = await bookModel.addBook(bookData); // Insert into books table

    if (!book_id) {
      return res.status(500).json({ error: "Failed to add book" });
    }

    // Step 2: Handle Image Upload
    let cover_image_url = null;
    if (req.files && req.files.cover_image) {
      cover_image_url = req.files.cover_image[0].location; // Get uploaded image URL
      await bookModel.updateBook(book_id, { cover_image_url }); // Update DB
    }
    // Step 3: If the book is for rental, upload the PDF & add it to the rentals table
    let pdf_url = null;

    if (service_type === "rental") {
      if (!rental_price || !rental_duration) {
        return res
          .status(400)
          .json({
            error: "Rental books require rental_price and rental_duration",
          });
      }

      // Check if a PDF file is uploaded
      if (req.files && req.files.pdf) {
        pdf_url = req.files.pdf[0].location; // Get PDF URL from S3 upload
      } else {
        return res
          .status(400)
          .json({ error: "Rental books require a PDF file" });
      }

      await bookModel.addRentalBook({
        book_id,
        renter_id: owner_id,
        rental_price,
        rental_duration,
        pdf_url,
      });
    }

    res.status(201).json({
      message: "Book added successfully",
      bookId: book_id,
      cover_image_url,
      pdf_url,
    });
  } catch (error) {
    console.error("Error in addBook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if the book exists before updating
    const existingBook = await bookModel.getBookById(id);
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Prepare update object (only include fields provided in req.body)
    const updatedBook = {};

    if (updates.title) updatedBook.title = updates.title;
    if (updates.author) updatedBook.author = updates.author;
    if (updates.genre) updatedBook.genre = updates.genre;
    if (updates.description) updatedBook.description = updates.description;
    if (updates.price !== undefined) updatedBook.price = updates.price;
    if (updates.availability) updatedBook.availability = updates.availability;
    if (updates.service_type) updatedBook.service_type = updates.service_type;

    // If a new file is uploaded, update cover image URL
    if (req.file) {
      updatedBook.cover_image_url = req.file.location; // AWS S3 file URL
    }

    // If no updates are provided, return an error
    if (Object.keys(updatedBook).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    // Update the book in the database
    await bookModel.updateBook(id, updatedBook);

    res.json({ message: "Book updated successfully", updatedBook });
  } catch (error) {
    console.error("Error in updateBook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.deleteBook = (req, res) => {
  const { id } = req.params;

  bookModel
    .deleteBook(id)
    .then((response) => res.json(response))
    .catch((error) => {
      console.error("Error in deleteBook:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
};

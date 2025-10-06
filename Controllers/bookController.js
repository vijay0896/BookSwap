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

    const owner_id = req.user.id;

    if (!title || !author || !service_type) {
      return res
        .status(400)
        .json({ error: "Title, Author, and Service Type are required" });
    }

    // Get cover image URL from Cloudinary upload
    let cover_image_url = null;
    if (req.files && req.files.cover_image && req.files.cover_image[0]) {
      cover_image_url = req.files.cover_image[0].secure_url; // Use Cloudinary URL
      // console.log("📁 Cover image uploaded:", cover_image_url);
    }

    // Step 1: Insert book into the database with the image URL
    const bookData = {
      title,
      author,
      genre,
      description,
      cover_image_url, // Use the Cloudinary URL directly
      price,
      availability,
      owner_id,
      service_type,
    };

    const { book_id } = await bookModel.addBook(bookData);

    if (!book_id) {
      return res.status(500).json({ error: "Failed to add book" });
    }

    // Step 2: Handle PDF for rental books
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
      if (req.files && req.files.pdf && req.files.pdf[0]) {
        pdf_url = req.files.pdf[0].secure_url; // Use Cloudinary URL for PDF
        // console.log("📄 PDF uploaded:", pdf_url);
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

    const existingBook = await bookModel.getBookById(id);
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const updatedBook = {
      title: updates.title ?? existingBook.title,
      author: updates.author ?? existingBook.author,
      genre: updates.genre ?? existingBook.genre,
      description: updates.description ?? existingBook.description,
      price: updates.price ?? existingBook.price,
      rental_price: updates.rental_price ?? existingBook.rental_price,
      rental_duration: updates.rental_duration ?? existingBook.rental_duration,
      availability: updates.availability ?? existingBook.availability,
      service_type: updates.service_type ?? existingBook.service_type,
    };

    // Handle Cloudinary file upload
    if (req.file && req.file.secure_url) {
      updatedBook.cover_image_url = req.file.secure_url;
      // console.log("📁 Updated cover image:", req.file.secure_url);
    }

    // Remove undefined values
    Object.keys(updatedBook).forEach(
      (key) => updatedBook[key] === undefined && delete updatedBook[key]
    );

    if (Object.keys(updatedBook).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

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

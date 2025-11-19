

const express = require("express");
const bookController = require("../Controllers/bookController");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadBookImage, uploadBookFiles } = require("../middlewares/upload");
const router = express.Router();

// Public routes
router.get("/", bookController.getAllBooks);
router.get("/:id", authMiddleware, bookController.getBookById);

// Protected routes (Require Authentication)
router.post(
  "/",
  authMiddleware,
  ...uploadBookFiles, // Spread the middleware array
  bookController.addBook
);

router.put(
  "/:id", 
  authMiddleware,
  ...uploadBookImage, // Spread the middleware array
  bookController.updateBook
);

router.delete("/:id", authMiddleware, bookController.deleteBook);

module.exports = router;
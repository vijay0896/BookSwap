const express = require("express");
const bookController = require("../Controllers/bookController");
const authMiddleware = require("../middlewares/authMiddleware"); // Protect API with JWT authentication
const {uploadBookImage}=require("../middlewares/upload")
const router = express.Router();
const { uploadBookFiles } = require("../middlewares/upload");
// Public routes
router.get("/", bookController.getAllBooks);
router.get("/:id",authMiddleware, bookController.getBookById);

// Protected routes (Require Authentication)
// router.post("/", authMiddleware, uploadBookImage.single("cover_image"),bookController.addBook);
router.post(
    "/",
    authMiddleware,
    uploadBookFiles.fields([
      { name: "cover_image", maxCount: 1 }, // Cover image (optional)
      { name: "pdf", maxCount: 1 }, // PDF file for rental books (required)
    ]),
    bookController.addBook
  );
router.put("/:id", authMiddleware,uploadBookImage.single("cover_image"), bookController.updateBook);
router.delete("/:id", authMiddleware, bookController.deleteBook);

module.exports = router;

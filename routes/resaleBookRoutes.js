const express = require("express");
const resaleBookController = require("../Controllers/resaleBookController");
const authMiddleware = require("../middlewares/authMiddleware"); // Protect routes with JWT

const router = express.Router();



router.get("/public", resaleBookController.getAllResaleBooks);
router.get("/public/:id", resaleBookController.getResaleBookById);


////
router.get("/:id",authMiddleware, resaleBookController.getResaleBookById);
router.get("/",authMiddleware, resaleBookController.getAllResaleBooksByOwner); //get books by owner
router.post("/", authMiddleware, resaleBookController.addResaleBook); // Protected Route
router.put("/:id", authMiddleware, resaleBookController.updateResaleBook);// Protected Route
router.delete("/:id", authMiddleware, resaleBookController.deleteResaleBook);// Protected Route

module.exports = router;

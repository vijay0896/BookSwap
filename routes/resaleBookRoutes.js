const express = require("express");
const resaleBookController = require("../Controllers/resaleBookController");
const authMiddleware = require("../middlewares/authMiddleware"); 
const router = express.Router();
router.get("/:id",authMiddleware, resaleBookController.getResaleBookById);
router.get("/",authMiddleware, resaleBookController.getAllResaleBooksByOwner); 
router.post("/", authMiddleware, resaleBookController.addResaleBook); 
router.put("/:id", authMiddleware, resaleBookController.updateResaleBook);
router.delete("/:id", authMiddleware, resaleBookController.deleteResaleBook);

module.exports = router;

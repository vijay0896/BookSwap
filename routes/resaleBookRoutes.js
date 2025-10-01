// const express = require("express");
// const resaleBookController = require("../Controllers/resaleBookController");
// const authMiddleware = require("../middlewares/authMiddleware"); 
// const router = express.Router();
// router.get("/:id",authMiddleware, resaleBookController.getResaleBookById);
// router.get("/",authMiddleware, resaleBookController.getAllResaleBooksByOwner); 
// router.post("/", authMiddleware, resaleBookController.addResaleBook); 
// router.put("/:id", authMiddleware, resaleBookController.updateResaleBook);
// router.delete("/:id", authMiddleware, resaleBookController.deleteResaleBook);

// module.exports = router;
const express = require("express");
const resaleBookController = require("../Controllers/resaleBookController");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadBookImage } = require("../middlewares/upload"); // Add this import
const router = express.Router();

router.get("/:id", authMiddleware, resaleBookController.getResaleBookById);
router.get("/", authMiddleware, resaleBookController.getAllResaleBooksByOwner);
router.post("/", authMiddleware, resaleBookController.addResaleBook);

// Add upload middleware for updating books with cover images
router.put("/:id", authMiddleware, ...uploadBookImage, resaleBookController.updateResaleBook);

router.delete("/:id", authMiddleware, resaleBookController.deleteResaleBook);

module.exports = router;
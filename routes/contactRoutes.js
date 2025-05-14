const express = require("express");
const { validateContact } = require("../validators/contactValidator");
const { addContact, getContact } = require("../Controllers/contactController");
const authMiddleware = require("../middlewares/authMiddleware");


const router = express.Router();

// Route to Add Contact Info (Authenticated Users Only)
router.post("/add", authMiddleware, validateContact, addContact);

// Route to Get Contact Info of Logged-in User
router.get("/getContact", authMiddleware, getContact);

module.exports = router;

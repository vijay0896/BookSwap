const express = require("express");
// const upload = require("../config/multerConfig");
const { uploadUserImage } = require("../middlewares/upload");
const authController = require("../Controllers/authController");
const {
  validateSignup,
  validateLogin,
} = require("../validators/authValidator");
const {
  getUserDetails,
  updateUserDetails,
  getAllUsers,
  getUserById
} = require("../Controllers/userController"); // ✅ Correct Import
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.get("/userDetails", authMiddleware, getUserDetails);
router.get("/userDetails/:id", authMiddleware, getUserDetails);
router.get("/getAllusers", getAllUsers);
router.get("/getAllusers/:id",getUserById);
router.patch(
  "/updateUser",
  authMiddleware,
  uploadUserImage.single("profileImage"),
  updateUserDetails
);

module.exports = router;

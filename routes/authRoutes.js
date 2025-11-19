

const express = require("express");
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
  getUserById,
} = require("../Controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.get("/userDetails", authMiddleware, getUserDetails);
router.get("/userDetails/:id", authMiddleware, getUserDetails);
router.get("/getAllusers", getAllUsers);
router.get("/getAllusers/:id", getUserById);
router.post("/forgot-password", authController.ForgetPassword);
router.post("/reset-password",authController.resetPassword);
router.post("/verify-otp",authController.verifyOTP);

// Updated route - uploadUserImage is now an array of middleware
router.patch(
  "/updateUser",
  authMiddleware,
  ...uploadUserImage, // Spread the array of middleware
  updateUserDetails
);

module.exports = router;
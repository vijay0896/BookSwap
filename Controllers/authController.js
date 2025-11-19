const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

const sendEmail = require("../utils/sendEmail");
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUsers = await UserModel.findByEmail(email);
    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await UserModel.RegisterUser({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: result.insertId, name, email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required!",
      });
    }

    const data = await UserModel.findByEmail(email);
    if (!data.length) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = data[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    return res.status(200).json({
      msg: "Login successfully",
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const ForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "Email not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await UserModel.saveOTP(user.id, otp, expiry);

    await sendEmail(
      email,
      "Your Password Reset OTP",
      `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes only.</p>`
    );

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    console.error("ForgotPassword Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashed = await bcrypt.hash(password, 10);

    await UserModel.updatePassword(user.id, hashed);

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.error("resetPassword Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.reset_otp !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    if (new Date(user.reset_otp_exp) < new Date())
      return res.status(400).json({ error: "OTP expired" });

    res.json({ message: "OTP verified" });

  } catch (error) {
    console.error("verifyOTP Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};


module.exports = {
  signup,
  login,
  ForgetPassword,
  resetPassword,
  verifyOTP

};

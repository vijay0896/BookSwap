const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

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
      res.status(400).json({
        msg: "Email and password are required !",
      });
    }

    const data = await UserModel.findByEmail(email);
    const user = data[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        msg: "Invalid credentials",
      });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      // expiresIn: "4h",
    });
    res.status(200).json({
      msg: "Login succesfully",
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = {
  signup,
  login,
};

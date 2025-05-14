const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.signup = (req, res) => {
  const { name, email, password } = req.body;

  User.findByEmail(email, async (err, result) => {
    if (result.length > 0) {
      // console.log(`[SIGNUP] Email already exists: ${email}`);
      return res.status(400).json({ message: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(`[SIGNUP] New user registration: ${email}`);

    User.create({ name, email, password: hashedPassword }, (err, result) => {
      if (err) {
        console.error(`[SIGNUP] Error creating user: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }

      // console.log(`[SIGNUP] User registered successfully: ${email}`);
      res.json({ message: "User registered successfully!" });
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN] Login attempt: ${email}`);

  User.findByEmail(email, async (err, result) => {
    if (err) {
      console.error(`[LOGIN] Error finding user: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }

    if (result.length === 0) {
      console.log(`[LOGIN] User not found: ${email}`);
      return res.status(400).json({ message: "User not found!" });
    }

    console.log(`[LOGIN] User found: ${email}`);
    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`[LOGIN] Invalid credentials for: ${email}`);
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      // expiresIn: "4h",
    });

    console.log(`[LOGIN] Login successful: ${email}`);
    res.json({ message: "Login successful!", token });
  });
};

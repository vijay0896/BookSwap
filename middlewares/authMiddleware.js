
const jwt = require("jsonwebtoken");
const db = require("../config/dbConfig");
const authMiddleware = (req, res, next) => {
  // console.log("Headers Received:", req.headers); // Debugging

  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized, token missing" });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
  // console.log("Extracted Token:", token); // Debugging

  if (!token) {
    return res.status(401).json({ message: "Unauthorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    db.query("SELECT id, email FROM users WHERE id = ?", [decoded.id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = results[0]; // Attach user info to request
      next();
    });

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


module.exports = authMiddleware;

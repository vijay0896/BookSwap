const express = require("express");
const app = express();

// Home Route
app.get("/", (req, res) => {
  res.send("Welcome to the Book Swap API!");
});

module.exports = app;

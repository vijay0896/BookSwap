const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/authRoutes");
const contactRoutes=require("./routes/contactRoutes")
const bookRoutes = require("./routes/bookRoutes");
const resaleBookRoutes = require("./routes/resaleBookRoutes");
const rentalBooksRoutes=require("./routes/rentalRoutes")
const buyRequestRoutes=require("./routes/buyRequestRoutes")
const app = express();
app.use(morgan("dev"));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://192.168.255.113",
    "http://192.168.255.43",
  ],
  // origin: '*',

  methods: "GET,POST,PUT,PATCH,DELETE,HEAD",
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/books", bookRoutes); 
app.use("/api/resale-books", resaleBookRoutes);

app.use("/api/rentals-books", rentalBooksRoutes);
app.use("/api/buy-requests",buyRequestRoutes)



///
// Register route
module.exports = app;

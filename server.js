const app = require("./app");

const server = app;
const PORT = process.env.PORT;

// Home Route
app.get("/", (req, res) => {
  res.send("Welcome to the Book Swap API!");
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

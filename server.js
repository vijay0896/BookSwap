const app = require("./app");

const server = app;

// Start server
const PORT = process.env.PORT;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

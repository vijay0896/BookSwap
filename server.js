const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Worker ${process.pid} is running on port ${PORT}`);
});

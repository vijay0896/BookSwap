const app = require("./app");
const db = require("./config/dbConfig");
const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://192.168.255.113",
      "http://192.168.255.43",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// To store connected users
const connectedUsers = {};

// When a client connects
io.on("connection", (socket) => {
  // console.log("New client connected:", socket.id);

  // Client will send user ID after connecting
  socket.on("register", (userId) => {
    connectedUsers[userId] = socket.id;
    // console.log(`User ${userId} registered with socket ID: ${socket.id}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // console.log("Client disconnected:", socket.id);
    // Remove disconnected user
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

// Make io and connectedUsers globally available
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Start server
const PORT = process.env.PORT;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

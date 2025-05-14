const buyRequestModel = require("../models/buyRequestModel");

exports.createBuyRequest = async (req, res) => {
  try {
    const { book_id, buyer_name, buyer_phone, buyer_location } = req.body;
    const buyer_id = req.user.id; // Assuming buyer info is attached to req.user by auth middleware

    if (!book_id || !buyer_name || !buyer_phone || !buyer_location) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const buyRequestId = await buyRequestModel.createBuyRequest({
      book_id,
      buyer_id,
      buyer_name,
      buyer_phone,
      buyer_location,
    });

    res
      .status(201)
      .json({ message: "Buy request created successfully", buyRequestId });
  } catch (error) {
    console.error("Error in createBuyRequest:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBuyRequestsByOwner = async (req, res) => {
  const ownerId = req.user.id;

  try {
    const buyRequests = await buyRequestModel.getBuyRequestsByOwner(ownerId);
    res.json(buyRequests);
  } catch (error) {
    console.error("Error in getBuyRequestsByOwner:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateBuyRequestStatus = async (req, res) => {
  const { request_id, status } = req.body;

  try {
    await buyRequestModel.updateBuyRequestStatus(request_id, status);
    res.json({ message: "Buy request status updated successfully" });
  } catch (error) {
    console.error("Error in updateBuyRequestStatus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🚀 ADD THIS NEW CONTROLLER FOR APPROVAL + SOCKET NOTIFICATION
// Controller for approving buy request and notifying buyer
exports.approveBuyRequestWithNotification = async (req, res) => {
  const io = req.app.get("io"); // Get io instance
  const connectedUsers = req.app.get("connectedUsers"); // Get online users

  const { request_id } = req.body;

  try {
    // Find the buy request
    const [buyRequest] = await buyRequestModel.getBuyRequestById(request_id);

    if (!buyRequest) {
      return res.status(404).json({ message: "Buy request not found" });
    }

    // Update the buy request status to "approved"
    await buyRequestModel.updateBuyRequestStatus(request_id, "approved");

    // Send real-time notification to the buyer
    const buyerSocketId = connectedUsers[buyRequest.buyer_id];
    if (buyerSocketId) {
      io.to(buyerSocketId).emit("notification", {
        title: "Order Approved",
        message: `Your order for "${buyRequest.book_title}" has been approved!`,
      });
    }

    // Notify the owner about approval
    const ownerSocketId = connectedUsers[buyRequest.owner_id];
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("notification", {
        title: "Buy Request Approved",
        message: `The request for your book "${buyRequest.book_title}" has been approved!`,
      });
    }

    res
      .status(200)
      .json({ message: "Buy request approved and notification sent." });
  } catch (error) {
    console.error("Error in approveBuyRequestWithNotification:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.denyBuyRequestWithNotification = async (req, res) => {
  const io = req.app.get("io"); // Get io instance
  const connectedUsers = req.app.get("connectedUsers"); // Get online users

  const { request_id } = req.body;

  try {
    // Find the buy request
    const [buyRequest] = await buyRequestModel.getBuyRequestById(request_id);

    if (!buyRequest) {
      return res.status(404).json({ message: "Buy request not found" });
    }

    // Update the buy request status to "denied"
    await buyRequestModel.updateBuyRequestStatus(request_id, "denied");

    // Send real-time notification to the buyer
    const buyerSocketId = connectedUsers[buyRequest.buyer_id];
    if (buyerSocketId) {
      io.to(buyerSocketId).emit("notification", {
        title: "Order Denied",
        message: `Your order for "${buyRequest.book_title}" has been denied.`,
      });
    }

    // Notify the owner about denial
    const ownerSocketId = connectedUsers[buyRequest.owner_id];
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("notification", {
        title: "Buy Request Denied",
        message: `The request for your book "${buyRequest.book_title}" has been denied.`,
      });
    }

    res
      .status(200)
      .json({ message: "Buy request denied and notification sent." });
  } catch (error) {
    console.error("Error in denyBuyRequestWithNotification:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
exports.getBuyRequestsByBuyer = async (req, res) => {
  const buyerIdFromToken = req.user.id; // From auth middleware
  const buyerIdFromParams = parseInt(req.params.userId, 10);

  if (buyerIdFromToken !== buyerIdFromParams) {
    return res
      .status(403)
      .json({ error: "Unauthorized access to buy requests" });
  }

  try {
    const buyRequests = await buyRequestModel.getBuyRequestsByBuyer(
      buyerIdFromParams
    );
    res.json(buyRequests);
  } catch (error) {
    console.error("Error in getBuyRequestsByBuyer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// In your controller
exports.getBuyRequestStatus = async (req, res) => {
  const { requestId } = req.params; // coming from URL params

  try {
    const buyRequest = await buyRequestModel.getBuyRequestById(requestId);

    if (!buyRequest) {
      return res.status(404).json({ message: "Buy request not found" });
    }

    // Return the buy request with its status
    res.json({ status: buyRequest.status });
  } catch (error) {
    console.error("Error in getBuyRequestStatus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


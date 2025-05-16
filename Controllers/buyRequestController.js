const buyRequestModel = require("../models/buyRequestModel");

exports.createBuyRequest = async (req, res) => {
  try {
    const { book_id, buyer_name, buyer_phone, buyer_location } = req.body;
    const buyer_id = req.user.id; 

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


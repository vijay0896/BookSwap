
const db = require("../config/dbConfig");

const BuyRequest = {
  // CREATE BUY REQUEST
  createBuyRequest: async ({
    book_id,
    buyer_id,
    buyer_name,
    buyer_phone,
    buyer_location,
  }) => {
    const sql = `
      INSERT INTO buy_requests 
      (book_id, buyer_id, buyer_name, buyer_phone, buyer_location) 
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      book_id,
      buyer_id,
      buyer_name,
      buyer_phone,
      buyer_location,
    ]);

    return result.insertId;
  },

  // GET BUY REQUESTS FOR OWNER
  getBuyRequestsByOwner: async (owner_id) => {
    const sql = `
      SELECT 
        br.id, 
        b.title, 
        br.buyer_name, 
        br.buyer_phone, 
        br.buyer_location, 
        br.status
      FROM buy_requests br 
      JOIN books b ON br.book_id = b.id
      WHERE b.owner_id = ?
    `;

    const [rows] = await db.query(sql, [owner_id]);
    return rows;
  },

  // UPDATE BUY REQUEST STATUS
  updateBuyRequestStatus: async (request_id, status) => {
    const sql = `UPDATE buy_requests SET status = ? WHERE id = ?`;

    await db.query(sql, [status, request_id]);

    return { message: "Buy request status updated successfully" };
  },

  // GET BUY REQUESTS FOR BUYER
  getBuyRequestsByBuyer: async (buyer_id) => {
    const sql = `
      SELECT 
        br.id, 
        b.title, 
        b.price,
        b.service_type,
        br.status, 
        br.created_at,
        u.name AS seller_name,
        c.phone AS seller_phone,
        c.address AS seller_location,
        rentEbooks.rental_price
      FROM buy_requests br 
      JOIN books b ON br.book_id = b.id
      JOIN users u ON b.owner_id = u.id
      JOIN contacts c ON c.user_id = u.id
      LEFT JOIN rentEbooks ON rentEbooks.book_id = b.id
      WHERE br.buyer_id = ?
      ORDER BY br.created_at DESC
    `;

    const [rows] = await db.query(sql, [buyer_id]);
    return rows;
  },

  // GET BUY REQUEST BY ID
  getBuyRequestById: async (request_id) => {
    const sql = `
      SELECT 
        br.id,
        br.book_id,
        b.title AS book_title,
        br.buyer_id,
        br.buyer_name,
        br.buyer_phone,
        br.buyer_location,
        br.status,
        br.created_at
      FROM buy_requests br
      JOIN books b ON br.book_id = b.id
      WHERE br.id = ?
    `;

    const [rows] = await db.query(sql, [request_id]);
    return rows[0] || null;
  },
};

module.exports = BuyRequest;

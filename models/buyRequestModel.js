// models/buyRequestModel.js
const db = require("../config/dbConfig");

const BuyRequest = {
  createBuyRequest: ({
    book_id,
    buyer_id,
    buyer_name,
    buyer_phone,
    buyer_location,
  }) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO buy_requests (book_id, buyer_id, buyer_name, buyer_phone, buyer_location) 
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        sql,
        [book_id, buyer_id, buyer_name, buyer_phone, buyer_location],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });
  },

  getBuyRequestsByOwner: (owner_id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT br.id, b.title, br.buyer_name, br.buyer_phone, br.buyer_location, br.status
        FROM buy_requests br 
        JOIN books b ON br.book_id = b.id
        WHERE b.owner_id = ?
      `;
      db.query(sql, [owner_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  updateBuyRequestStatus: (request_id, status) => {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE buy_requests SET status = ? WHERE id = ?";
      db.query(sql, [status, request_id], (err, result) => {
        if (err) return reject(err);
        resolve({ message: "Buy request status updated successfully" });
      });
    });
  },
  getBuyRequestsByBuyer: (buyer_id) => {
    return new Promise((resolve, reject) => {
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
      db.query(sql, [buyer_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },
  getBuyRequestById: (request_id) => {
    return new Promise((resolve, reject) => {
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
      db.query(sql, [request_id], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]); // return single request object
      });
    });
  },
};

module.exports = BuyRequest;

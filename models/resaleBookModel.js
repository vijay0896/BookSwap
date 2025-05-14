const db = require("../config/dbConfig");

const ResaleBook = {
  getAllResaleBooks: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT rb.id, b.title, b.author,b.cover_image_url, rb.price, rb.status,b.genre,b.description,b.id as Book_id, rb.seller_id, rb.created_at 
        FROM resale_books rb 
        JOIN books b ON rb.book_id = b.id
        WHERE b.service_type = 'resale'
      `;
      db.query(sql, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  },
  
  getAllResaleBooksByOwner: (ownerId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          rb.id, b.title, b.author, b.cover_image_url, rb.price, rb.status, 
          b.genre, b.description, b.id AS Book_id, rb.seller_id, rb.created_at 
        FROM resale_books rb 
        JOIN books b ON rb.book_id = b.id
        WHERE b.service_type = 'resale' AND b.owner_id = ?
      `;
      db.query(sql, [ownerId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },
  


  getResaleBookById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT rb.id, b.title, b.author, rb.price, rb.status, rb.seller_id, rb.created_at 
        FROM resale_books rb 
        JOIN books b ON rb.book_id = b.id 
        WHERE rb.id = ?
      `;
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        resolve(result[0]); // Return single resale book
      });
    });
  },

  addResaleBook: ({ book_id, seller_id, price }) => {
    return new Promise((resolve, reject) => {
      const sqlCheck = "SELECT * FROM resale_books WHERE book_id = ?";
      db.query(sqlCheck, [book_id], (err, result) => {
        if (err) return reject(err);
        if (result.length > 0) return reject({ error: "Book is already listed for resale" });

        const sqlInsert = "INSERT INTO resale_books (book_id, seller_id, price) VALUES (?, ?, ?)";
        db.query(sqlInsert, [book_id, seller_id, price], (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        });
      });
    });
  },

  updateResaleBook: (id, updates) => {
    return new Promise((resolve, reject) => {
      const { price, status } = updates;
      const sql = "UPDATE resale_books SET price=?, status=? WHERE id=?";
      db.query(sql, [price, status, id], (err, result) => {
        if (err) return reject(err);
        resolve({ message: "Resale book updated successfully" });
      });
    });
  },

  deleteResaleBook: (id) => {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM resale_books WHERE id = ?";
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        resolve({ message: "Resale book deleted successfully" });
      });
    });
  }
};

module.exports = ResaleBook;

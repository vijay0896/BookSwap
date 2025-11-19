
const db = require("../config/dbConfig");

const ResaleBook = {
  // Get all resale books
  getAllResaleBooks: async () => {
    const sql = `
      SELECT rb.id, b.title, b.author, b.cover_image_url, rb.price, rb.status, 
             b.genre, b.description, b.id AS Book_id, rb.seller_id, rb.created_at 
      FROM resale_books rb 
      JOIN books b ON rb.book_id = b.id
      WHERE b.service_type = 'resale'
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  // Get resale books for specific owner
  getAllResaleBooksByOwner: async (ownerId) => {
    const sql = `
      SELECT rb.id, b.title, b.author, b.cover_image_url, rb.price, rb.status, 
             b.genre, b.description, b.id AS Book_id, rb.seller_id, rb.created_at 
      FROM resale_books rb 
      JOIN books b ON rb.book_id = b.id
      WHERE b.service_type = 'resale' AND b.owner_id = ?
    `;
    const [rows] = await db.query(sql, [ownerId]);
    return rows;
  },

  // Get single resale book
  getResaleBookById: async (id) => {
    const sql = `
      SELECT rb.id, b.title, b.author, rb.price, rb.status, rb.seller_id, rb.created_at 
      FROM resale_books rb 
      JOIN books b ON rb.book_id = b.id 
      WHERE rb.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  // Add new resale listing
  addResaleBook: async ({ book_id, seller_id, price }) => {
    // Check if already listed
    const [existing] = await db.query(
      "SELECT * FROM resale_books WHERE book_id = ?",
      [book_id]
    );

    if (existing.length > 0) {
      throw { error: "Book is already listed for resale" };
    }

    const sqlInsert = `
      INSERT INTO resale_books (book_id, seller_id, price) 
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sqlInsert, [
      book_id,
      seller_id,
      price,
    ]);

    return result.insertId;
  },

  // Update resale book
  updateResaleBook: async (id, updates) => {
    const { price, status } = updates;

    const sql = `
      UPDATE resale_books 
      SET price = ?, status = ?
      WHERE id = ?
    `;

    await db.query(sql, [price, status, id]);

    return { message: "Resale book updated successfully" };
  },

  // Delete resale listing
  deleteResaleBook: async (id) => {
    const sql = "DELETE FROM resale_books WHERE id = ?";
    await db.query(sql, [id]);

    return { message: "Resale book deleted successfully" };
  },
};

module.exports = ResaleBook;

const db = require("../config/dbConfig");

const Rental = {
  // Add rental ebook
  addRental: async ({ book_id, renter_id, rental_price, rental_duration, pdf_url }) => {

    // Check if book already rented
    const [existing] = await db.query(
      "SELECT * FROM rentEbooks WHERE book_id = ?",
      [book_id]
    );

    if (existing.length > 0) {
      throw { error: "This book is already listed for rental" };
    }

    // Insert rental row
    const insertSql = `
      INSERT INTO rentEbooks (book_id, renter_id, rental_price, rental_duration, pdf_url)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [insertResult] = await db.query(insertSql, [
      book_id,
      renter_id,
      rental_price,
      rental_duration,
      pdf_url,
    ]);

    // Update book service_type
    await db.query(
      `UPDATE books SET service_type = 'rental' WHERE id = ?`,
      [book_id]
    );

    return insertResult.insertId;
  },

  // Get all rentals
  getAllRentals: async () => {
    const sql = `
      SELECT rentEbooks.*, books.title, books.cover_image_url, books.genre, books.description, books.author,
             users.name AS renter_name
      FROM rentEbooks
      JOIN books ON rentEbooks.book_id = books.id
      JOIN users ON rentEbooks.renter_id = users.id
      WHERE books.service_type = 'rental'
    `;
    const [rows] = await db.query(sql);
    return rows;
  },

  // Get all rentals by owner
  getAllRentalsByOwner: async (ownerId) => {
    const sql = `
      SELECT rentEbooks.*, books.title, books.cover_image_url, books.genre, books.description, books.author,
             users.name AS renter_name
      FROM rentEbooks
      JOIN books ON rentEbooks.book_id = books.id
      JOIN users ON rentEbooks.renter_id = users.id
      WHERE books.service_type = 'rental' AND books.owner_id = ?
    `;
    const [rows] = await db.query(sql, [ownerId]);
    return rows;
  },

  // Get rental by id
  getRentalById: async (id) => {
    const sql = `
      SELECT rentEbooks.*, books.title AS book_title, users.name AS renter_name 
      FROM rentEbooks 
      JOIN books ON rentEbooks.book_id = books.id 
      JOIN users ON rentEbooks.renter_id = users.id
      WHERE rentEbooks.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    return rows[0] || null;
  },

  // Update rental
  updateRental: async (id, updates) => {
    const { rental_price, rental_duration, rental_status, pdf_url } = updates;

    if (rental_status && !["active", "completed"].includes(rental_status)) {
      throw { error: "Invalid rental status" };
    }

    const sql = `
      UPDATE rentEbooks 
      SET rental_price = ?, rental_duration = ?, rental_status = ?, pdf_url = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      rental_price,
      rental_duration,
      rental_status,
      pdf_url,
      id,
    ]);

    return { message: "Rental updated successfully" };
  },

  // Delete rental
  deleteRental: async (id) => {
    await db.query("DELETE FROM rentEbooks WHERE id = ?", [id]);
    return { message: "Rental deleted successfully" };
  },
};

module.exports = Rental;

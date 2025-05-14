const db = require("../config/dbConfig");

const Rental = {
  // Add a new rental (E-Book)
  addRental: ({
    book_id,
    renter_id,
    rental_price,
    rental_duration,
    pdf_url,
  }) => {
    return new Promise((resolve, reject) => {
      // Check if the book is already rented
      const sqlCheck = "SELECT * FROM rentEbooks WHERE book_id = ?";
      db.query(sqlCheck, [book_id], (err, result) => {
        if (err) return reject(err);
        if (result.length > 0)
          return reject({ error: "This book is already listed for rental" });

        // Insert rental if book is not already rented
        const sqlInsert = `
          INSERT INTO rentEbooks (book_id, renter_id, rental_price, rental_duration, pdf_url)
          VALUES (?, ?, ?, ?, ?)
        `;
        db.query(
          sqlInsert,
          [book_id, renter_id, rental_price, rental_duration, pdf_url],
          (err, result) => {
            if (err) return reject(err);

            // After inserting into rentEbooks, update service_type in books table
            const sqlUpdate = `
            UPDATE books 
            SET service_type = 'rental' 
            WHERE id = ? AND service_type = 'resale'
          `;
            db.query(sqlUpdate, [book_id], (err, updateResult) => {
              if (err) return reject(err);

              resolve(result.insertId);
            });
          }
        );
      });
    });
  },

  // Get all rental books
  getAllRentals: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT rentEbooks.*, books.title,books.cover_image_url,books.genre,books.description,books.author, users.name AS renter_name 
        FROM rentEbooks 
        JOIN books ON rentEbooks.book_id = books.id 
        JOIN users ON rentEbooks.renter_id = users.id
         WHERE books.service_type = 'rental'
      `;
      db.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },
  
  getAllRentalsByOwner: (ownerId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          rentEbooks.*, 
          books.title, books.cover_image_url, books.genre, books.description, books.author, 
          users.name AS renter_name 
        FROM rentEbooks 
        JOIN books ON rentEbooks.book_id = books.id 
        JOIN users ON rentEbooks.renter_id = users.id
        WHERE books.service_type = 'rental' AND books.owner_id = ?
      `;
      db.query(sql, [ownerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  },
  

  // Get rental by ID
  getRentalById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT rentEbooks.*, books.title AS book_title, users.name AS renter_name 
        FROM rentEbooks 
        JOIN books ON rentEbooks.book_id = books.id 
        JOIN users ON rentEbooks.renter_id = users.id
        WHERE rentEbooks.id = ?
      `;
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        resolve(result[0]);
      });
    });
  },

  // Update rental details
  // Update rental details, including the PDF URL
  updateRental: (id, updates) => {
    return new Promise((resolve, reject) => {
      const { rental_price, rental_duration, rental_status, pdf_url } = updates;

      // Ensure rental_status is valid
      if (rental_status && !["active", "completed"].includes(rental_status)) {
        return reject({ error: "Invalid rental status" });
      }

      let sql =
        "UPDATE rentEbooks SET rental_price = ?, rental_duration = ?, rental_status = ?";
      let values = [rental_price, rental_duration, rental_status];

      // If a new PDF is provided, update the `pdf_url` field as well
      if (pdf_url) {
        sql += ", pdf_url = ?";
        values.push(pdf_url);
      }

      sql += " WHERE id = ?";
      values.push(id);

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        resolve({ message: "Rental updated successfully" });
      });
    });
  },

  // Delete a rental record
  deleteRental: (id) => {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM rentEbooks WHERE id = ?";
      db.query(sql, [id], (err, result) => {
        if (err) return reject(err);
        resolve({ message: "Rental deleted successfully" });
      });
    });
  },
};

module.exports = Rental;

const db = require("../config/dbConfig");

const s3 = require("../config/awsS3Config"); // ✅ S3 instance
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const Book = {
  getAllBooks: (serviceType = null) => {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
        books.*, 
        users.name AS owner_name,
        rentEbooks.rental_price,
        rentEbooks.pdf_url
      FROM books
      JOIN users ON books.owner_id = users.id
      LEFT JOIN rentEbooks ON rentEbooks.book_id = books.id
      `;
      const params = [];

      if (serviceType) {
        sql += " WHERE books.service_type = ?";
        params.push(serviceType);
      }

      db.query(sql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  getBooksByOwnerId: (owner_id) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM books WHERE owner_id = ?";
      db.query(sql, [owner_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },
  getBookById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM books WHERE id = ?";
      db.query(sql, [id], (err, result) => {
        if (err) reject(err);
        resolve(result[0] || null);
      });
    });
  },

  addBook: ({
    title,
    author,
    genre,
    description,
    cover_image_url,
    price,
    availability,
    owner_id,
    service_type,
  }) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO books 
          (title, author, genre, description, cover_image_url, price, availability, owner_id, service_type) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(
        sql,
        [
          title,
          author,
          genre,
          description,
          cover_image_url,
          price,
          availability,
          owner_id,
          service_type,
        ],
        (err, result) => {
          if (err) return reject(err);

          const book_id = result.insertId; // Get the inserted book's ID

          // If the book is for resale, insert it into the resale_books table
          if (service_type === "resale") {
            const resaleSql = `INSERT INTO resale_books (book_id, seller_id, price, status) VALUES (?, ?, ?, ?)`;

            db.query(
              resaleSql,
              [book_id, owner_id, price, "available"],
              (err, resaleResult) => {
                if (err) return reject(err);
                resolve({ book_id, resale_id: resaleResult.insertId });
              }
            );
          } else {
            resolve({ book_id });
          }
        }
      );
    });
  },

  updateBook: (id, updates) => {
    return new Promise((resolve, reject) => {
      const sqlFetch = "SELECT * FROM books WHERE id = ?";

      db.query(sqlFetch, [id], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return reject({ error: "Book not found" });

        const existingBook = results[0];

        const {
          title = existingBook.title,
          author = existingBook.author,
          genre = existingBook.genre,
          description = existingBook.description,
          cover_image_url = existingBook.cover_image_url,
          price = existingBook.price,
          availability = updates.availability ?? existingBook.availability, // Handle NULL properly
          service_type = updates.service_type ?? existingBook.service_type,
        } = updates;

        const sqlUpdate = `UPDATE books 
          SET title=?, author=?, genre=?, description=?, cover_image_url=?, price=?, availability=?, service_type=? 
          WHERE id=?`;

        db.query(
          sqlUpdate,
          [
            title,
            author,
            genre,
            description,
            cover_image_url,
            price,
            availability,
            service_type,
            id,
          ],
          (err) => {
            if (err) return reject(err);

            // Handle resale_books insertion or deletion
            if (service_type === "resale") {
              // Check if the book already exists in resale_books
              const checkResaleSql = `SELECT * FROM resale_books WHERE book_id = ?`;
              db.query(checkResaleSql, [id], (err, resaleResults) => {
                if (err) return reject(err);

                if (resaleResults.length === 0) {
                  // If the book is not in resale_books, insert it
                  const insertResaleSql = `INSERT INTO resale_books (book_id, seller_id, price, status) VALUES (?, ?, ?, ?)`;
                  db.query(
                    insertResaleSql,
                    [id, existingBook.owner_id, price, "available"],
                    (err) => {
                      if (err) return reject(err);
                      resolve({
                        message:
                          "Book updated successfully and added to resale_books",
                      });
                    }
                  );
                } else {
                  // If the book already exists in resale_books, update price and status
                  const updateResaleSql = `UPDATE resale_books SET price=?, status=? WHERE book_id=?`;
                  db.query(updateResaleSql, [price, "available", id], (err) => {
                    if (err) return reject(err);
                    resolve({
                      message:
                        "Book updated successfully and resale details updated",
                    });
                  });
                }
              });
            } else {
              // If the service_type is changed from 'resale' to something else, remove it from resale_books
              const deleteResaleSql = `DELETE FROM resale_books WHERE book_id = ?`;
              db.query(deleteResaleSql, [id], (err) => {
                if (err) return reject(err);
                resolve({
                  message:
                    "Book updated successfully and removed from resale_books",
                });
              });
            }
          }
        );
      });
    });
  },

  deleteBook: (id) => {
    return new Promise((resolve, reject) => {
      // Step 1: Get the book title from DB
      const getTitleSql = "SELECT title FROM books WHERE id = ?";
      db.query(getTitleSql, [id], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return reject(new Error("Book not found"));

        const title = results[0].title;
        const sanitizedTitle = title.replace(/\s+/g, "-").toLowerCase();
        const key = `uploads/books/${sanitizedTitle}.jpg`;

        // Step 2: Delete from rentebooks
        const deleteRentebooksSql = "DELETE FROM rentEbooks WHERE book_id = ?";
        db.query(deleteRentebooksSql, [id], (err) => {
          if (err) return reject(err);

          // Step 3: Delete from resale_books
          const deleteResaleBooksSql =
            "DELETE FROM resale_books WHERE book_id = ?";
          db.query(deleteResaleBooksSql, [id], async (err) => {
            if (err) return reject(err);

            // Step 4: Delete image from S3
            try {
              await s3.send(
                new DeleteObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET_NAME,
                  Key: key,
                })
              );
              // console.log("S3 image deleted:", key);
            } catch (s3Err) {
              // console.error("Failed to delete image from S3:", s3Err);
            }

            // Step 5: Delete book
            const deleteBookSql = "DELETE FROM books WHERE id = ?";
            db.query(deleteBookSql, [id], (err) => {
              if (err) return reject(err);
              resolve({ message: "Book and image deleted successfully" });
            });
          });
        });
      });
    });
  },

  addRentalBook: ({
    book_id,
    renter_id,
    rental_price,
    rental_duration,
    pdf_url,
  }) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO rentEbooks 
                     (book_id, renter_id, rental_price, rental_duration, pdf_url, rental_status) 
                     VALUES (?, ?, ?, ?, ?, 'active')`;

      db.query(
        sql,
        [book_id, renter_id, rental_price, rental_duration, pdf_url],
        (err, result) => {
          if (err) return reject(err);
          resolve({ rental_id: result.insertId });
        }
      );
    });
  },
};

module.exports = Book;



const db = require("../config/dbConfig");

// =======================
// GET ALL BOOKS
// =======================
const getAllBooks = async (serviceType = null) => {
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

  const [rows] = await db.query(sql, params);
  return rows;
};

// =======================
// GET BY OWNER
// =======================
const getBooksByOwnerId = async (owner_id) => {
  const [rows] = await db.query(
    "SELECT * FROM books WHERE owner_id = ?",
    [owner_id]
  );
  return rows;
};

// =======================
// GET BOOK BY ID
// =======================
const getBookById = async (id) => {
  const [rows] = await db.query("SELECT * FROM books WHERE id = ?", [id]);
  return rows[0] || null;
};

// =======================
// ADD BOOK
// =======================
const addBook = async ({
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
  const sql = `
    INSERT INTO books 
    (title, author, genre, description, cover_image_url, price, availability, owner_id, service_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    title,
    author,
    genre,
    description,
    cover_image_url,
    price,
    availability,
    owner_id,
    service_type,
  ]);

  const book_id = result.insertId;

  if (service_type === "resale") {
    const [resale] = await db.query(
      `INSERT INTO resale_books (book_id, seller_id, price, status)
       VALUES (?, ?, ?, 'available')`,
      [book_id, owner_id, price]
    );
    return { book_id, resale_id: resale.insertId };
  }

  return { book_id };
};

// =======================
// UPDATE BOOK (FIXED)
// =======================
const updateBook = async (id, updates) => {
  const existingBook = await getBookById(id);
  if (!existingBook) throw new Error("Book not found");

  // Merge incoming updates with existing DB record
  const merged = { ...existingBook, ...updates };

  // 🛑 Clean invalid / empty / undefined values for "price"
  merged.price =
    merged.price === undefined ||
    merged.price === null ||
    merged.price === "" ||
    isNaN(Number(merged.price))
      ? existingBook.price
      : Number(merged.price);

  merged.availability = merged.availability ?? existingBook.availability;
  merged.service_type = merged.service_type ?? existingBook.service_type;
  merged.cover_image_url =
    merged.cover_image_url || existingBook.cover_image_url;

  // ===========================
  // UPDATE MAIN TABLE
  // ===========================
  await db.query(
    `
    UPDATE books
    SET title=?, author=?, genre=?, description=?, cover_image_url=?, 
        price=?, availability=?, service_type=?
    WHERE id=?
    `,
    [
      merged.title,
      merged.author,
      merged.genre,
      merged.description,
      merged.cover_image_url,
      merged.price,
      merged.availability,
      merged.service_type,
      id,
    ]
  );

  // ===================================
  // IF RESALE BOOK
  // ===================================
  if (merged.service_type === "resale") {
    const [existingResale] = await db.query(
      "SELECT * FROM resale_books WHERE book_id=?",
      [id]
    );

    if (existingResale.length === 0) {
      await db.query(
        `INSERT INTO resale_books (book_id, seller_id, price, status)
         VALUES (?, ?, ?, 'available')`,
        [id, existingBook.owner_id, merged.price]
      );
    } else {
      await db.query(
        `UPDATE resale_books 
         SET price=?, status='available' 
         WHERE book_id=?`,
        [merged.price, id]
      );
    }

    // Remove rental record
    await db.query("DELETE FROM rentEbooks WHERE book_id=?", [id]);

    return { message: "Resale book updated", updated: merged };
  }

  // ===================================
  // IF RENTAL BOOK
  // ===================================
  if (merged.service_type === "rental") {
    const [existingRental] = await db.query(
      "SELECT * FROM rentEbooks WHERE book_id=?",
      [id]
    );

    const rental_price =
      updates.rental_price ??
      existingRental[0]?.rental_price ??
      null;

    const rental_duration =
      updates.rental_duration ??
      existingRental[0]?.rental_duration ??
      7;

    const pdf_url =
      updates.pdf_url ??
      existingRental[0]?.pdf_url ??
      null;

    if (!rental_price)
      throw new Error("Rental price required for rental books");

    if (existingRental.length === 0) {
      await db.query(
        `INSERT INTO rentEbooks 
        (book_id, renter_id, rental_price, rental_duration, pdf_url, rental_status)
        VALUES (?, ?, ?, ?, ?, 'active')`,
        [
          id,
          existingBook.owner_id,
          rental_price,
          rental_duration,
          pdf_url,
        ]
      );
    } else {
      await db.query(
        `UPDATE rentEbooks 
         SET rental_price=?, rental_duration=?, pdf_url=?, rental_status='active'
         WHERE book_id=?`,
        [
          rental_price,
          rental_duration,
          pdf_url,
          id,
        ]
      );
    }

    // Delete resale info
    await db.query("DELETE FROM resale_books WHERE book_id=?", [id]);

    return { message: "Rental book updated", updated: merged };
  }

  // ===================================
  // NEITHER resale nor rental
  // ===================================
  await db.query("DELETE FROM resale_books WHERE book_id=?", [id]);
  await db.query("DELETE FROM rentEbooks WHERE book_id=?", [id]);

  return { message: "Book updated", updated: merged };
};

// =======================
// DELETE BOOK
// =======================
const deleteBook = async (id) => {
  await db.query("DELETE FROM rentEbooks WHERE book_id=?", [id]);
  await db.query("DELETE FROM resale_books WHERE book_id=?", [id]);
  await db.query("DELETE FROM books WHERE id=?", [id]);

  return { message: "Book deleted successfully" };
};

// =======================
// ADD RENTAL BOOK
// =======================
const addRentalBook = async ({
  book_id,
  renter_id,
  rental_price,
  rental_duration,
  pdf_url,
}) => {
  const sql = `
    INSERT INTO rentEbooks 
    (book_id, renter_id, rental_price, rental_duration, pdf_url, rental_status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `;

  const [result] = await db.query(sql, [
    book_id,
    renter_id,
    rental_price,
    rental_duration,
    pdf_url,
  ]);

  return { rental_id: result.insertId };
};

module.exports = {
  getAllBooks,
  getBooksByOwnerId,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  addRentalBook,
};

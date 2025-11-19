
const db = require("../config/dbConfig");

// FIND BY EMAIL
const findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows; // array
};

const RegisterUser = async ({ name, email, password }) => {
  const [result] = await db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password]
  );
  return result;
};

// USER DETAILS
const getUserDetails = async (userId) => {
  const [result] = await db.query(
    `
      SELECT 
        users.id, users.name, users.email, users.profile_image AS profileImage,
        contacts.phone, contacts.address, contacts.latitude, contacts.longitude,
        (
          SELECT COUNT(*) FROM books WHERE books.owner_id = users.id
        ) AS totalBooks
      FROM users
      LEFT JOIN contacts ON users.id = contacts.user_id
      WHERE users.id = ?
    `,
    [userId]
  );

  return result;
};

const getAllUsers = async () => {
  const [result] = await db.query(
    `
      SELECT 
        users.id, users.name, users.email, users.profile_image AS profileImage,
        contacts.phone, contacts.address, contacts.latitude, contacts.longitude,
        (
          SELECT COUNT(*) FROM books WHERE books.owner_id = users.id
        ) AS totalBooks
      FROM users
      LEFT JOIN contacts ON users.id = contacts.user_id
    `
  );

  return result;
};

const getUserDetailsById = async (userId) => {
  const [result] = await db.query(
    `
      SELECT u.name, u.email, c.phone, c.address, c.latitude, c.longitude, u.profile_image 
      FROM users u 
      LEFT JOIN contacts c ON u.id = c.user_id 
      WHERE u.id = ?
    `,
    [userId]
  );

  return result[0];
};

const updateUser = async (userId, name, email, profileImageUrl) => {
  const [result] = await db.query(
    `
      UPDATE users SET name = ?, email = ?, profile_image = ? WHERE id = ?
    `,
    [name, email, profileImageUrl, userId]
  );

  return result;
};

const upsertContact = async (userId, phone, address, email, latitude, longitude) => {
  const [result] = await db.query(
    `
      INSERT INTO contacts (user_id, phone, address, email, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        phone = VALUES(phone),
        address = VALUES(address),
        email = VALUES(email),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude)
    `,
    [userId, phone, address, email, latitude, longitude]
  );

  return result;
};

// OTP FUNCTIONS
const saveOTP = async (userId, otp, expiry) => {
  const [result] = await db.query(
    "UPDATE users SET reset_otp=?, reset_otp_exp=? WHERE id=?",
    [otp, expiry, userId]
  );
  return result;
};

const getUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);
  return rows[0];
};

const updatePassword = async (userId, password) => {
  const [result] = await db.query(
    `UPDATE users SET password=?, reset_otp=NULL, reset_otp_exp=NULL WHERE id=?`,
    [password, userId]
  );
  return result;
};

module.exports = {
  findByEmail,
  RegisterUser,
  getUserDetails,
  getAllUsers,
  getUserDetailsById,
  updateUser,
  upsertContact,
  getUserByEmail,
  updatePassword,
  saveOTP
};

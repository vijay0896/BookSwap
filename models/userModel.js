const { promise } = require("zod");
const db = require("../config/dbConfig");

const findByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const RegisterUser = ({ name, email, password }) => {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const getUserDetails = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
     SELECT 
        users.id, users.name, users.email, users.profile_image AS profileImage,
        contacts.phone, contacts.address, contacts.latitude, contacts.longitude,
        (
          SELECT COUNT(*) FROM books WHERE books.owner_id = users.id
        ) AS totalBooks
      FROM users
      LEFT JOIN contacts ON users.id = contacts.user_id
      WHERE users.id = ?
    `;

    db.query(query, [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT 
        users.id, users.name, users.email, users.profile_image AS profileImage,
        contacts.phone, contacts.address, contacts.latitude, contacts.longitude,
        (
          SELECT COUNT(*) FROM books WHERE books.owner_id = users.id
        ) AS totalBooks
      FROM users
      LEFT JOIN contacts ON users.id = contacts.user_id`;
    db.query(query, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getUserDetailsById = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT u.name, u.email, c.phone, c.address, c.latitude, c.longitude, u.profile_image 
      FROM users u 
      LEFT JOIN contacts c ON u.id = c.user_id 
      WHERE u.id = ?
    `;
    db.query(query, [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result[0]);
    });
  });
};
const updateUser = (userId, name, email, profileImageUrl) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE users SET name = ?, email = ?, profile_image = ? WHERE id = ?
    `;
    db.query(query, [name, email, profileImageUrl, userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
const upsertContact = (userId, phone, address, email, latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO contacts (user_id, phone, address, email, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        phone = VALUES(phone),
        address = VALUES(address),
        email = VALUES(email),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude)
    `;
    db.query(
      query,
      [userId, phone, address, email, latitude, longitude],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

module.exports = {
  findByEmail,
  RegisterUser,
  getUserDetails,
  getAllUsers,
  getUserDetailsById,
  updateUser,
  upsertContact,
};

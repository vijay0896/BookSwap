const db = require("../config/dbConfig");

const User = {
  findByEmail: (email, callback) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], callback);
  },

  create: (user, callback) => {
    const { name, email, password } = user;
    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
      callback
    );
  },
  findById: (id, callback) => {
    db.query("SELECT id, name, email FROM users WHERE id = ?", [id], callback);
  },
};

module.exports = User;
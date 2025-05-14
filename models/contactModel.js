const db = require("../config/dbConfig");

const Contact = {
  addContact: (user_id, email, phone, address) => {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO contacts (user_id, email, phone, address) VALUES (?, ?, ?, ?)";
      db.query(sql, [user_id, email, phone, address], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  },

  getContactByUserId: (user_id) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT email, phone, address FROM contacts WHERE user_id = ?";
      db.query(sql, [user_id], (err, result) => {
        if (err) reject(err);
        resolve(result[0]); // Return single contact
      });
    });
  }
};

module.exports = Contact;

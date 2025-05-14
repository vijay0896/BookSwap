const db = require("../config/dbConfig"); // Ensure your db instance is imported if using raw queries

exports.addContact = async (req, res) => {
  const userId = req.user.id;
  const { phone, address, latitude, longitude } = req.body;

  try {
    const [existing] = await db.query("SELECT * FROM contacts WHERE user_id = ?", [userId]);

    if (existing.length > 0) {
      await db.query(
        "UPDATE contacts SET phone = ?, address = ?, latitude = ?, longitude = ? WHERE user_id = ?",
        [phone, address, latitude, longitude, userId]
      );
    } else {
      await db.query(
        "INSERT INTO contacts (user_id, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
        [userId, phone, address, latitude, longitude]
      );
    }

    res.status(200).json({ message: "Contact updated successfully" });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
};

exports.getContact = async (req, res) => {
  try {
    const user_id = req.user.id;
    const [contact] = await db.query("SELECT * FROM contacts WHERE user_id = ?", [user_id]);

    if (!contact || contact.length === 0)
      return res.status(404).json({ message: "No contact information found" });

    res.json(contact[0]);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
};

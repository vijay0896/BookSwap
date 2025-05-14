const db = require("../config/dbConfig");

exports.getUserDetails = (req, res) => {
  const userId = req.user.id; // Extract user ID from token

  const query = `
    SELECT 
      users.id, users.name, users.email, users.profile_image AS profileImage,
      contacts.phone, contacts.address ,contacts.latitude,contacts.longitude
    FROM users 
    LEFT JOIN contacts ON users.id = contacts.user_id 
    WHERE users.id = ?
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let userData = result[0];

    // Check if profileImage already contains full Cloudinary URL
    // if (userData.profileImage && !userData.profileImage.startsWith("http")) {
    //   userData.profileImage = `https://res.cloudinary.com/dq0nttryr/image/upload/${userData.profileImage}`;
    // }
    if (userData.profileImage && !userData.profileImage.startsWith("http")) {
      userData.profileImage = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userData.profileImage}`;
    }

    res.json(userData);
  });
};

exports.updateUserDetails = async (req, res) => {
  // console.log("updateUserDetails function called");

  const userId = req.user.id;
  let { name, email, phone, address, latitude, longitude } = req.body;
  let profileImageUrl = null;

  try {
    // console.log("Received file:", req.file); // ✅ LOGGING FILE DATA
    // console.log("Received body data:", req.body); // ✅ LOGGING BODY DATA

    if (req.file) {
      // profileImageUrl = req.file.path;
      profileImageUrl = req.file.location; // ✅ FIX: Use `location` for S3 URL
      // console.log("Using uploaded image URL:", profileImageUrl);
    } else {
      // console.log("No file uploaded, keeping existing image.");
    }

    // ✅ Fetch user details with LEFT JOIN to get phone & address from contacts
    db.query(
      `SELECT u.name, u.email, c.phone, c.address, c.latitude, c.longitude
       FROM users u 
       LEFT JOIN contacts c ON u.id = c.user_id 
       WHERE u.id = ?`,
      [userId],
      (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to retrieve user details" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const existingUser = results[0];
        name = name !== undefined ? name : existingUser.name || "N/A";
        email = email !== undefined ? email : existingUser.email || "N/A";
        phone = phone !== undefined ? phone : existingUser.phone || "N/A";
        address =
          address !== undefined ? address : existingUser.address || "N/A";
        latitude =
          latitude !== undefined ? latitude : existingUser.latitude || null;
        longitude =
          longitude !== undefined ? longitude : existingUser.longitude || null;
        profileImageUrl =
          profileImageUrl !== undefined
            ? profileImageUrl
            : existingUser.profile_image || null;

        db.beginTransaction((err) => {
          if (err) {
            console.error("Transaction Error:", err);
            return res.status(500).json({ error: "Transaction failed" });
          }

          const userQuery = `
            UPDATE users 
            SET name = ?, email = ?, profile_image = ?
            WHERE id = ?
          `;

          db.query(
            userQuery,
            [name, email, profileImageUrl, userId],
            (err, userResult) => {
              if (err) {
                console.error("User Update SQL Error:", err.sqlMessage);
                return db.rollback(() => {
                  console.error("User Update Error:", err);
                  res.status(500).json({ error: "User update failed" });
                });
              }

              const contactQuery = `
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
                contactQuery,
                [userId, phone, address, email, latitude, longitude],
                (err, contactResult) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error("Contact Update Error:", err);
                      res.status(500).json({ error: "Contact update failed" });
                    });
                  }

                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        console.error("Transaction Commit Error:", err);
                        res
                          .status(500)
                          .json({ error: "Transaction commit failed" });
                      });
                    }

                    res.json({
                      message: "User and contact details updated successfully",
                      profileImageUrl,
                    });
                  });
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getAllUsers = (req, res) => {
  const query = `
     SELECT 
      users.id, 
      users.name, 
      users.email, 
      users.profile_image AS profileImage,
      contacts.phone, 
      contacts.address,
      contacts.latitude,
      contacts.longitude,
      (
        SELECT COUNT(*) 
        FROM books 
        WHERE books.owner_id = users.id
      ) AS totalBooks
    FROM users 
    LEFT JOIN contacts ON users.id = contacts.user_id 
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const formattedUsers = results.map((user) => {
      if (user.profileImage && !user.profileImage.startsWith("http")) {
        user.profileImage = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${user.profileImage}`;
      }
      return user;
    });

    res.json(formattedUsers);
  });
};
exports.getUserById = (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT 
      users.id, 
      users.name, 
      users.email, 
      users.profile_image AS profileImage,
      contacts.phone, 
      contacts.address,
      contacts.latitude,
      contacts.longitude,
      (
        SELECT COUNT(*) 
        FROM books 
        WHERE books.owner_id = users.id
      ) AS totalBooks
    FROM users 
    LEFT JOIN contacts ON users.id = contacts.user_id 
    WHERE users.id = ?
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let userData = result[0];

    if (userData.profileImage && !userData.profileImage.startsWith("http")) {
      userData.profileImage = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userData.profileImage}`;
    }

    res.json(userData);
  });
};
// exports.getAllUsers = async (req, res) => {
//   const userId = req.query.userId;

//   if (!userId) {
//     return res.status(400).json({ error: "User ID is required" });
//   }

//   const getUserAddressQuery = `
//     SELECT address
//     FROM contacts
//     WHERE user_id = ?
//   `;

//   db.query(getUserAddressQuery, [userId], (err, addressResults) => {
//     if (err) {
//       console.error("Address Fetch Error:", err);
//       return res.status(500).json({ error: "Failed to get user address" });
//     }

//     if (addressResults.length === 0 || !addressResults[0].address) {
//       return res.status(404).json({ error: "User address not found" });
//     }

//     const userAddress = addressResults[0].address;

//     const query = `
//       SELECT
//         users.id,
//         users.name,
//         users.email,
//         users.profile_image AS profileImage,
//         contacts.phone,
//         contacts.address,
//         (
//           SELECT COUNT(*)
//           FROM books
//           WHERE books.owner_id = users.id
//         ) AS totalBooks
//       FROM users
//       LEFT JOIN contacts ON users.id = contacts.user_id
//       WHERE contacts.address = ? AND users.id != ?
//     `;

//     db.query(query, [userAddress, userId], (err, results) => {
//       if (err) {
//         console.error("Database Error:", err);
//         return res.status(500).json({ error: "Internal server error" });
//       }

//       const formattedUsers = results.map((user) => {
//         if (user.profileImage && !user.profileImage.startsWith("http")) {
//           user.profileImage = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${user.profileImage}`;
//         }
//         return user;
//       });

//       res.json(formattedUsers);
//     });
//   });
// };

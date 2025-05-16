const db = require("../config/dbConfig");


const userModel = require("../models/userModel");


function formatUserData(userData) {
  if (userData.profileImage && !userData.profileImage.startsWith("http")) {
    userData.profileImage = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userData.profileImage}`;
  }
  return userData;
}
// Get user details by logged-in user ID


// Get logged-in user's details
exports.getUserDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await userModel.getUserDetails(userId);
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const formatted = formatUserData(result[0]);
    res.json(formatted);
  } catch (error) {
    console.error("❌ GetUserDetails Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get any user by ID (public)
exports.getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await userModel.getUserDetails(userId);
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const formatted = formatUserData(result[0]);
    res.json(formatted);
  } catch (error) {
    console.error("❌ GetUserById Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All user 
exports.getAllUsers = async (req, res) => {
  try {
    const results = await userModel.getAllUsers();

    const formatted = results.map((user) => {
      if (user.profileImage && !user.profileImage.startsWith("http")) {
        user.profileImage = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${user.profileImage}`;
      }
      return user;
    });

    
    res.json(formatted);
  } catch (error) {
    console.error("❌ Redis Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.updateUserDetails = async (req, res) => {
  const userId = req.user.id;
  let { name, email, phone, address, latitude, longitude } = req.body;
  let profileImageUrl = req.file?.location || null;

  try {
    const existingUser = await userModel.getUserDetailsById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    name = name ?? existingUser.name;
    email = email ?? existingUser.email;
    phone = phone ?? existingUser.phone;
    address = address ?? existingUser.address;
    latitude = latitude ?? existingUser.latitude;
    longitude = longitude ?? existingUser.longitude;
    profileImageUrl = profileImageUrl ?? existingUser.profile_image;

    db.beginTransaction(async (err) => {
      if (err) return res.status(500).json({ error: "Transaction failed" });

      try {
        await userModel.updateUser(userId, name, email, profileImageUrl);
        await userModel.upsertContact(userId, phone, address, email, latitude, longitude);

        db.commit(async (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Commit failed:", err);
              res.status(500).json({ error: "Commit failed" });
            });
          }

         

          res.json({
            message: "User and contact details updated successfully",
            profileImageUrl,
          });
        });
      } catch (err) {
        db.rollback(() => {
          console.error("Transaction failed:", err);
          res.status(500).json({ error: "Update failed" });
        });
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};




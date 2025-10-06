// const multer = require("multer");
// const { S3Client } = require("@aws-sdk/client-s3");
// const multerS3 = require("multer-s3");
// const s3 = require("../config/awsS3Config");

// const uploadUserImage = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET_NAME,
//     key: (req, file, cb) => {
//       if (!req.user || !req.user.id) {
//         return cb(new Error("User ID is required for file naming"));
//       }

//       // Overwrite old image by using userId as filename
//     //   const fileExtension = file.mimetype.split("/")[1]; // Get file extension (jpeg, png, etc.)
//       const fileName = `uploads/usersImg/${req.user.id}.jpg`; 

//       cb(null, fileName);
//     },
//   }),
//   limits: { fileSize: 10 * 1024 * 1024 }, // 5MB max file size
// });
// const uploadBookImage = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET_NAME,
//     key: (req, file, cb) => {
//       let fileName;

//       // If title exists (for new books), use it
//       if (req.body.title) {
//         const sanitizedTitle = req.body.title.replace(/\s+/g, "-").toLowerCase();
//         fileName = `uploads/books/${sanitizedTitle}.jpg`;
//       } 
//       // If updating, fallback to book ID if available
//       else if (req.params && req.params.id) {
//         fileName = `uploads/books/book-${req.params.id}.jpg`;
//       } 
//       // If no title or book ID, reject the upload
//       else {
//         return cb(new Error("Book ID or Title is required before uploading the image"));
//       }

//       cb(null, fileName);
//     },
//   }),
//   // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
// });
// const uploadEbook = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET_NAME,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: (req, file, cb) => {
//       const fileName = `uploads/ebooks/${file.originalname}`;
//       cb(null, fileName);
//     }
//   }),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== "application/pdf") {
//       return cb(new Error("Only PDF files are allowed!"), false);
//     }
//     cb(null, true);
//   },
//   // limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
// });
// const uploadBookFiles = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET_NAME,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: (req, file, cb) => {
//       const ext = file.mimetype.split("/")[1];

//       if (file.mimetype === "application/pdf") {
//         const fileName = `uploads/ebooks/${Date.now()}-${file.originalname}`;
//         cb(null, fileName);
//       } else if (file.mimetype.startsWith("image/")) {
//         if (!req.body.title) {
//           return cb(new Error("Book title is required before uploading the image"));
//         }
//         const sanitizedTitle = req.body.title.replace(/\s+/g, "-").toLowerCase();
//         const fileName = `uploads/books/${sanitizedTitle}.jpg`;
//         cb(null, fileName);
//       } else {
//         return cb(new Error("Invalid file type"), false);
//       }
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== "application/pdf" && !file.mimetype.startsWith("image/")) {
//       return cb(new Error("Only image and PDF files are allowed!"), false);
//     }
//     cb(null, true);
//   },
//   limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
// });

// module.exports ={uploadUserImage,uploadBookImage,uploadEbook,uploadBookFiles };

const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");
const { Readable } = require("stream");
// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { ...options, resource_type: options.resource_type || "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};




// User Image Upload
const uploadUserImage = [
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
  }).single('profileImage'),
  async (req, res, next) => {
    if (!req.file) return next();

    try {
      if (!req.user || !req.user.id) {
        throw new Error("User ID is required for file naming");
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        public_id: `uploads/usersImg/${req.user.id}`, // Include folder in public_id
        transformation: [{ width: 500, height: 500, crop: "limit" }],
        format: 'jpg',
        use_filename: false,
        unique_filename: false,
        overwrite: true // Ensure it overwrites existing files
      });

      // Debug logs
      // console.log("📁 Upload options sent to Cloudinary:", {
      //   public_id: `uploads/usersImg/${req.user.id}`,
      // });
      // console.log("📁 Cloudinary result:", {
      //   secure_url: result.secure_url,
      //   public_id: result.public_id,
      //   folder: result.folder,
      // });

      req.file.secure_url = result.secure_url;
      req.file.public_id = result.public_id;
      req.file.cloudinary = result;
      next();
    } catch (error) {
      console.error('User image upload error:', error);
      res.status(500).json({ error: 'Profile image upload failed' });
    }
  }
];

// Book Image Upload
const uploadBookImage = [
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
  }).single('cover_image'), // Changed from 'file' to 'cover_image'
  async (req, res, next) => {
    if (!req.file) return next();

    try {
      let publicId;
      if (req.body.title) {
        publicId = req.body.title.replace(/\s+/g, "-").toLowerCase();
      } else if (req.params && req.params.id) {
        publicId = `book-${req.params.id}`;
      } else {
        throw new Error("Book ID or Title is required before uploading the image");
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        public_id: `uploads/books/${publicId}`,
        transformation: [{ width: 800, height: 600, crop: "limit" }],
        format: 'jpg',
        overwrite: true
      });

      req.file.secure_url = result.secure_url;
      req.file.public_id = result.public_id;
      req.file.cloudinary = result;
      next();
    } catch (error) {
      console.error('Book image upload error:', error);
      res.status(500).json({ error: 'Book image upload failed' });
    }
  }
];




// ================= Single E-book PDF Upload =================
const uploadEbook = [
  multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== "application/pdf") {
        return cb(new Error("Only PDF files are allowed!"), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
  }).single('file'),
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'uploads/ebooks',
        public_id: `${Date.now()}-${req.file.originalname.replace(/\.[^/.]+$/, "")}`,
        resource_type: 'auto', // 👈 important
        access_mode: "public",
        format: 'pdf'           // 👈 ensures PDF opens in browser
      });

      req.file.secure_url = result.secure_url; // This URL works in browser/mobile
      req.file.public_id = result.public_id;
      req.file.cloudinary = result;

      next();
    } catch (error) {
      console.error('PDF upload error:', error);
      res.status(500).json({ error: 'PDF upload failed' });
    }
  }
];

// ================= Multiple Book Files Upload =================
const uploadBookFiles = [
  multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== "application/pdf" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image and PDF files are allowed!"), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
  }).fields([
    { name: "cover_image", maxCount: 1 },
    { name: "pdf", maxCount: 1 }
  ]),
  async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) return next();

    try {
      const uploadPromises = [];

      // Cover Image
      if (req.files.cover_image && req.files.cover_image[0]) {
        const imageFile = req.files.cover_image[0];
        if (!req.body.title) throw new Error("Book title is required before uploading the image");
        const sanitizedTitle = req.body.title.replace(/\s+/g, "-").toLowerCase();

        const imagePromise = uploadToCloudinary(imageFile.buffer, {
          folder: 'uploads/books',
          public_id: sanitizedTitle,
          transformation: [{ width: 800, height: 600, crop: "limit" }],
          format: 'jpg'
        }).then(result => {
          req.files.cover_image[0].secure_url = result.secure_url;
          req.files.cover_image[0].public_id = result.public_id;
          req.files.cover_image[0].cloudinary = result;
        });
        uploadPromises.push(imagePromise);
      }

      // PDF
      if (req.files.pdf && req.files.pdf[0]) {
        const pdfFile = req.files.pdf[0];
        const pdfPromise = uploadToCloudinary(pdfFile.buffer, {
          folder: 'uploads/ebooks',
          public_id: `${Date.now()}-${pdfFile.originalname.replace(/\.[^/.]+$/, "")}`,
          resource_type: 'auto', // important for browser/mobile viewing
          format: 'pdf'
        }).then(result => {
          req.files.pdf[0].secure_url = result.secure_url;
          req.files.pdf[0].public_id = result.public_id;
          req.files.pdf[0].cloudinary = result;
        });
        uploadPromises.push(pdfPromise);
      }

      await Promise.all(uploadPromises);
      next();
    } catch (error) {
      console.error('Multiple file upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  }
];



module.exports = { uploadUserImage, uploadBookImage, uploadEbook, uploadBookFiles };
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const s3 = require("../config/awsS3Config");

const uploadUserImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: (req, file, cb) => {
      if (!req.user || !req.user.id) {
        return cb(new Error("User ID is required for file naming"));
      }
      
      // Overwrite old image by using userId as filename
    //   const fileExtension = file.mimetype.split("/")[1]; // Get file extension (jpeg, png, etc.)
      const fileName = `uploads/usersImg/${req.user.id}.jpg`; 
      
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB max file size
});
const uploadBookImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: (req, file, cb) => {
      let fileName;

      // If title exists (for new books), use it
      if (req.body.title) {
        const sanitizedTitle = req.body.title.replace(/\s+/g, "-").toLowerCase();
        fileName = `uploads/books/${sanitizedTitle}.jpg`;
      } 
      // If updating, fallback to book ID if available
      else if (req.params && req.params.id) {
        fileName = `uploads/books/book-${req.params.id}.jpg`;
      } 
      // If no title or book ID, reject the upload
      else {
        return cb(new Error("Book ID or Title is required before uploading the image"));
      }

      cb(null, fileName);
    },
  }),
  // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});
const uploadEbook = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `uploads/ebooks/${file.originalname}`;
      cb(null, fileName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed!"), false);
    }
    cb(null, true);
  },
  // limits: { fileSize: 10 * 1024 * 1024 }, // Max file size: 10MB
});
const uploadBookFiles = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      
      if (file.mimetype === "application/pdf") {
        const fileName = `uploads/ebooks/${Date.now()}-${file.originalname}`;
        cb(null, fileName);
      } else if (file.mimetype.startsWith("image/")) {
        if (!req.body.title) {
          return cb(new Error("Book title is required before uploading the image"));
        }
        const sanitizedTitle = req.body.title.replace(/\s+/g, "-").toLowerCase();
        const fileName = `uploads/books/${sanitizedTitle}.jpg`;
        cb(null, fileName);
      } else {
        return cb(new Error("Invalid file type"), false);
      }
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf" && !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image and PDF files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
});

module.exports ={uploadUserImage,uploadBookImage,uploadEbook,uploadBookFiles };

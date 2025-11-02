import multer from "multer";
import path from "path";
import fs from "fs";

// Make sure the uploads folder exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage strategy: save files to /uploads with unique names
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // e.g. 1730548459384_bako.jpg
    const unique = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

// Optional: basic file filter (images only)
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"), false);
  }
  cb(null, true);
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
}).single("imageFile"); // IMPORTANT: must match formData.append("imageFile", ...)

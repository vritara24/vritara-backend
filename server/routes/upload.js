const express = require("express");
const multer = require("multer");
const path = require("path");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|ogg|webm|mp4|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image and audio files are allowed"));
  },
});

router.post("/", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.status(201).json({
    message: "File uploaded successfully",
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

module.exports = router;

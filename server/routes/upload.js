const express = require("express");
const multer = require("multer");
const path = require("path");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

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

router.post("/", authenticateToken, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const incidentId = req.body.incident_id || null;

    const result = await pool.query(
      "INSERT INTO media_storage (user_id, incident_id, filename, original_name, mimetype, file_size, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        req.user.id,
        incidentId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.path,
      ]
    );

    res.status(201).json({
      message: "File uploaded successfully",
      file: result.rows[0],
    });
  } catch (err) {
    console.error("Upload save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

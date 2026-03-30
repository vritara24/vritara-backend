const express = require("express");
const fs = require("fs");
const path = require("path");
const { pool } = require("../db");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

// LINK DEVICE TO USER
const LINKED_EMAIL = "swasthikshetty547@gmail.com";
const LINKED_DEVICE_ID = "VRITARA001";

// ==========================
// SOS ROUTE (already working)
// ==========================
router.post("/sos", validateApiKey, async (req, res) => {
  const client = await pool.connect();

  try {
    const { device_id, latitude, longitude } = req.body;

    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({ error: "Unknown device" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO incident_logs (user_id, type, latitude, longitude, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        1,
        "device",
        latitude || null,
        longitude || null,
        "Device SOS Triggered",
        "active"
      ]
    );

    await client.query("COMMIT");

    res.json({ success: true, incident: result.rows[0] });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});


// ==========================
// 🔥 IMAGE UPLOAD ROUTE
// ==========================
router.post("/upload-image", validateApiKey, async (req, res) => {
  try {

    const imageBuffer = req.body;

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({ error: "No image received" });
    }

    // create filename
    const fileName = `image_${Date.now()}.jpg`;

    const uploadPath = path.join(__dirname, "../uploads", fileName);

    // save file
    fs.writeFileSync(uploadPath, imageBuffer);

    console.log("Image saved:", fileName);

    // OPTIONAL: Save into DB (basic)
    await pool.query(
      `INSERT INTO media_storage (incident_id, filename, original_name, mimetype, file_size, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        1, // for demo link
        fileName,
        fileName,
        "image/jpeg",
        imageBuffer.length
      ]
    );

    res.json({ success: true, file: fileName });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});


// ==========================
router.post("/heartbeat", validateApiKey, (req, res) => {
  res.json({ status: "Device alive" });
});

module.exports = router;

const express = require("express");
const fs = require("fs");
const path = require("path");
const { pool } = require("../db");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

// ==============================
// DEVICE ↔ USER LINK
// ==============================
// Keep this same if your device code uses:
// #define DEVICE_ID "VRITARA001"
const LINKED_DEVICE_ID = "VRITARA001";

// IMPORTANT:
// This must match the user_id of the account
// where you want incidents to appear in app history.
//
// If history was showing before with user_id = 1,
// keep this as 1.
const LINKED_USER_ID = 1;

// uploads folder
const uploadsDir = path.join(__dirname, "../uploads");

// create uploads folder if missing
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==============================
// 1) DEVICE SOS
// ==============================
router.post("/sos", validateApiKey, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      device_id,
      trigger_type,
      latitude,
      longitude,
      sound_level,
      motion_level
    } = req.body || {};

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({ error: "Device not linked to any user" });
    }

    await client.query("BEGIN");

    const incidentResult = await client.query(
      `INSERT INTO incident_logs (
        user_id,
        type,
        latitude,
        longitude,
        message,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [
        LINKED_USER_ID,
        "device",
        latitude || null,
        longitude || null,
        `Device SOS Triggered (${trigger_type || "unknown"}) | Sound: ${sound_level || 0} | Motion: ${motion_level || 0}`,
        "active"
      ]
    );

    const incident = incidentResult.rows[0];

    await client.query("COMMIT");

    console.log("Device SOS saved successfully:", incident.id);

    res.json({
      success: true,
      message: "Device SOS saved successfully",
      incident
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Device SOS error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ==============================
// 2) DEVICE HEARTBEAT
// ==============================
router.post("/heartbeat", validateApiKey, async (req, res) => {
  try {
    const { device_id } = req.body || {};

    res.json({
      success: true,
      status: "Device alive",
      device_id: device_id || "unknown"
    });
  } catch (err) {
    console.error("Heartbeat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==============================
// 3) IMAGE UPLOAD (FOR LATER / CAMERA)
// ==============================
router.post(
  "/upload-image",
  validateApiKey,
  express.raw({ type: "*/*", limit: "10mb" }),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const imageBuffer = req.body;

      if (!imageBuffer || !imageBuffer.length) {
        return res.status(400).json({ error: "No image received" });
      }

      // get latest incident for linked user
      const incidentResult = await client.query(
        `SELECT id
         FROM incident_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [LINKED_USER_ID]
      );

      if (incidentResult.rows.length === 0) {
        return res.status(404).json({ error: "No incident found to attach image" });
      }

      const incidentId = incidentResult.rows[0].id;

      // create filename
      const fileName = `incident_${incidentId}_${Date.now()}.jpg`;
      const filePath = path.join(uploadsDir, fileName);

      // save image file
      fs.writeFileSync(filePath, imageBuffer);

      // save DB record
      const mediaResult = await client.query(
        `INSERT INTO media_storage (
          incident_id,
          filename,
          original_name,
          mimetype,
          file_size,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *`,
        [
          incidentId,
          fileName,
          fileName,
          "image/jpeg",
          imageBuffer.length
        ]
      );

      console.log("Image uploaded successfully for incident:", incidentId);

      res.json({
        success: true,
        message: "Image uploaded successfully",
        media: mediaResult.rows[0]
      });

    } catch (err) {
      console.error("Upload image error:", err);
      res.status(500).json({ error: "Upload failed" });
    } finally {
      client.release();
    }
  }
);

module.exports = router;

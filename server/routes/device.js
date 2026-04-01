const express = require("express");
const { pool } = require("../db");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

/*
  DEMO LINK:
  Device VRITARA001 -> linked to this email
*/
const LINKED_EMAIL = "swasthikshetty547@gmail.com";
const LINKED_DEVICE_ID = "VRITARA001";

// ==========================
// DEVICE SOS ROUTE
// ==========================
router.post("/sos", validateApiKey, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      device_id,
      triggerType,
      trigger_type,
      latitude,
      longitude,
      soundLevel,
      sound_level,
      motionLevel,
      motion_level,
      image,
      audio
    } = req.body;

    const finalTriggerType = triggerType || trigger_type || "manual_sos";
    const finalSoundLevel = soundLevel ?? sound_level ?? 0;
    const finalMotionLevel = motionLevel ?? motion_level ?? 0;
    const finalImage = image || "";
    const finalAudio = audio || "";

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    // Check if correct device
    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({
        success: false,
        error: "Device not linked"
      });
    }

    // Insert incident into PostgreSQL
    const result = await client.query(
      `
      INSERT INTO incidents
      (device_id, linked_email, trigger_type, latitude, longitude, sound_level, motion_level, image, audio, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING *
      `,
      [
        device_id,
        LINKED_EMAIL,
        finalTriggerType,
        latitude || 0,
        longitude || 0,
        finalSoundLevel,
        finalMotionLevel,
        finalImage,
        finalAudio
      ]
    );

    console.log("🔥 SOS RECEIVED:", result.rows[0]);

    res.status(200).json({
      success: true,
      message: "SOS saved successfully",
      incident: result.rows[0]
    });
  } catch (error) {
    console.error("SOS ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==========================
// HEARTBEAT
// ==========================
router.post("/heartbeat", validateApiKey, async (req, res) => {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        error: "device_id required"
      });
    }

    res.status(200).json({
      success: true,
      status: "Device alive",
      device_id: device_id,
      linked_email: LINKED_EMAIL,
      linked_device_id: LINKED_DEVICE_ID
    });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================
// HISTORY
// ==========================
router.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM incidents
      ORDER BY created_at DESC
      `
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================
// MEDIA
// ==========================
router.get("/media", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM incidents
      WHERE image IS NOT NULL OR audio IS NOT NULL
      ORDER BY created_at DESC
      `
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Media Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;        error: "Unknown device",
        received_device_id: device_id,
        expected_device_id: LINKED_DEVICE_ID
      });
    }

    // Find linked user from email
    const userResult = await client.query(
      "SELECT id, username, email FROM users WHERE email = $1 LIMIT 1",
      [LINKED_EMAIL]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "Linked user not found in database",
        linked_email: LINKED_EMAIL
      });
    }

    const linkedUser = userResult.rows[0];
    const user_id = linkedUser.id;

    await client.query("BEGIN");

    const incidentResult = await client.query(
      `INSERT INTO incident_logs (user_id, type, latitude, longitude, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        user_id,
        "device",
        latitude || null,
        longitude || null,
        `Device SOS Triggered (${trigger_type || "unknown"}) | Sound: ${sound_level || 0} | Motion: ${motion_level || 0}`,
        "active"
      ]
    );

    const incident = incidentResult.rows[0];

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Device SOS saved successfully",
      linked_user: linkedUser,
      incident
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Device SOS error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
});

// ==========================
// DEVICE HEARTBEAT ROUTE
// ==========================
router.post("/heartbeat", validateApiKey, async (req, res) => {
  try {
    const { device_id } = req.body || {};

    res.json({
      success: true,
      status: "Device alive",
      device_id: device_id || "unknown",
      linked_email: LINKED_EMAIL,
      linked_device_id: LINKED_DEVICE_ID
    });
  } catch (err) {
    console.error("Heartbeat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;sw

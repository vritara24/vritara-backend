const express = require("express");
const { pool } = require("../db");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

// DEVICE SOS TRIGGER
router.post("/sos", validateApiKey, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      device_id,
      trigger_type,
      latitude,
      longitude,
      sound_level,
      motion_level
    } = req.body;

    // IMPORTANT:
    // Replace this with the user ID of your demo account if needed
    const DEMO_USER_ID = 1;

    const incidentResult = await client.query(
      `INSERT INTO incident_logs
      (user_id, type, latitude, longitude, message, sound_level, motion_level, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        DEMO_USER_ID,
        trigger_type || "device",
        latitude || null,
        longitude || null,
        "SOS from wearable device",
        sound_level || null,
        motion_level || null,
        "active"
      ]
    );

    const incident = incidentResult.rows[0];

    await client.query(
      "UPDATE users SET emergency_state='emergency', active_incident_id=$1 WHERE id=$2",
      [incident.id, DEMO_USER_ID]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      incident_id: incident.id,
      message: "Device SOS stored successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Device SOS error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// DEVICE HEARTBEAT
router.post("/heartbeat", validateApiKey, async (req, res) => {
  try {
    res.json({
      success: true,
      status: "Device alive",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Heartbeat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

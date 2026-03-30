const express = require("express");
const { pool } = require("../db");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

/*
  DEMO MODE:
  VRITARA001 -> user_id = 1
*/

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
    } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    // DEMO HARD-CODED USER LINK
    let user_id = null;

    if (device_id === "VRITARA001") {
      user_id = 1;
    }

    if (!user_id) {
      return res.status(404).json({ error: "Device not linked to any user" });
    }

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

module.exports = router;

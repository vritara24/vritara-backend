const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.post("/manual", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;

    const result = await pool.query(
      "INSERT INTO incident_logs (user_id, type, latitude, longitude, message) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, "manual", latitude || null, longitude || null, message || "Manual SOS triggered"]
    );

    console.log("MANUAL SOS TRIGGERED:", result.rows[0]);

    res.status(201).json({
      emergency: true,
      message: "SOS signal sent successfully",
      incident: result.rows[0],
    });
  } catch (err) {
    console.error("Manual SOS error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/automatic", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, sound_level, motion_level } = req.body;

    const result = await pool.query(
      "INSERT INTO incident_logs (user_id, type, latitude, longitude, sound_level, motion_level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [req.user.id, "automatic", latitude || null, longitude || null, sound_level, motion_level]
    );

    console.log("AUTOMATIC SOS TRIGGERED:", result.rows[0]);

    res.status(201).json({
      emergency: true,
      message: "Automatic SOS triggered",
      incident: result.rows[0],
    });
  } catch (err) {
    console.error("Auto SOS error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/incidents", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM incident_logs WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ incidents: result.rows });
  } catch (err) {
    console.error("Get incidents error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

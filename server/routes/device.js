const express = require("express");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

// Temporary in-memory storage
let incidents = [];

/*
  Demo linked account
*/
const LINKED_EMAIL = "swasthikshetty547@gmail.com";
const LINKED_DEVICE_ID = "VRITARA001";

// ==========================
// DEVICE SOS ROUTE
// ==========================
router.post("/sos", validateApiKey, async (req, res) => {
  try {
    const {
      device_id,
      trigger_type,
      latitude,
      longitude,
      sound_level,
      motion_level,
      image,
      audio
    } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({
        success: false,
        message: "Device not linked"
      });
    }

    const newIncident = {
      id: incidents.length + 1,
      device_id,
      linked_email: LINKED_EMAIL,
      trigger_type: trigger_type || "unknown",
      latitude: latitude || null,
      longitude: longitude || null,
      sound_level: sound_level || 0,
      motion_level: motion_level || 0,
      image: image || "",
      audio: audio || "",
      status: "active",
      created_at: new Date().toISOString()
    };

    incidents.unshift(newIncident);

    console.log("🔥 SOS RECEIVED:");
    console.log(newIncident);

    return res.status(200).json({
      success: true,
      message: "SOS received successfully",
      incident: newIncident
    });
  } catch (error) {
    console.error("SOS Route Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// ==========================
// DEVICE HEARTBEAT
// ==========================
router.post("/heartbeat", validateApiKey, async (req, res) => {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    return res.status(200).json({
      success: true,
      status: "Device alive",
      device_id,
      linked_email: LINKED_EMAIL,
      linked_device_id: LINKED_DEVICE_ID
    });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// ==========================
// GET INCIDENT HISTORY
// ==========================
router.get("/history", async (req, res) => {
  try {
    return res.status(200).json(incidents);
  } catch (error) {
    console.error("History Route Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;

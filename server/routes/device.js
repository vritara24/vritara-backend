const express = require("express");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

let incidents = [];

const LINKED_EMAIL = "swasthikshetty547@gmail.com";
const LINKED_DEVICE_ID = "VRITARA001";

// ==========================
// RECEIVE SOS
// ==========================
router.post("/sos", validateApiKey, (req, res) => {
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
    trigger_type: trigger_type || "manual_sos",
    latitude: latitude || null,
    longitude: longitude || null,
    sound_level: sound_level || 0,
    motion_level: motion_level || 0,
    status: "active",
    created_at: new Date().toISOString()
  };

  incidents.unshift(newIncident);

  console.log("SOS RECEIVED:", newIncident);

  res.status(200).json({
    success: true,
    message: "SOS received successfully",
    incident: newIncident
  });
});

// ==========================
// HEARTBEAT
// ==========================
router.post("/heartbeat", validateApiKey, (req, res) => {
  const { device_id } = req.body;

  res.status(200).json({
    success: true,
    status: "Device alive",
    device_id,
    linked_email: LINKED_EMAIL,
    linked_device_id: LINKED_DEVICE_ID
  });
});

// ==========================
// HISTORY
// ==========================
router.get("/history", (req, res) => {
  res.status(200).json(incidents);
});

module.exports = router;

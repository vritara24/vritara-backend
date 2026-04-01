const express = require("express");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

/*
  DEMO LINK:
  Device VRITARA001 -> linked to this email
*/
const LINKED_EMAIL = "swasthikshetty547@gmail.com";
const LINKED_DEVICE_ID = "VRITARA001";

// TEMP MEMORY STORAGE (no DB needed)
let incidents = [];

// ==========================
// DEVICE SOS ROUTE
// ==========================
router.post("/sos", validateApiKey, async (req, res) => {
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

    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({
        success: false,
        error: "Device not linked"
      });
    }

    const incident = {
      id: Date.now(),
      device_id,
      linked_email: LINKED_EMAIL,
      trigger_type: finalTriggerType,
      latitude: latitude || 0,
      longitude: longitude || 0,
      sound_level: finalSoundLevel,
      motion_level: finalMotionLevel,
      image: finalImage,
      audio: finalAudio,
      created_at: new Date()
    };

    incidents.unshift(incident);

    console.log("🔥 SOS RECEIVED:", incident);

    res.status(200).json({
      success: true,
      message: "SOS saved successfully",
      incident
    });
  } catch (error) {
    console.error("SOS ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
    res.status(200).json(incidents);
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
    const mediaOnly = incidents.filter(item => item.image || item.audio);
    res.status(200).json(mediaOnly);
  } catch (error) {
    console.error("Media Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

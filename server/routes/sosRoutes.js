const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Incident = require("../models/Incident");

// uploads folder path
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// IMAGE UPLOAD
router.post("/upload-image", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const filename = Date.now() + ".jpg";
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, req.body);
    res.send(`/uploads/${filename}`);
  } catch (err) {
    console.error("Image Upload Error:", err);
    res.status(500).send("");
  }
});

// AUDIO UPLOAD
router.post("/upload-audio", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const filename = Date.now() + ".wav";
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, req.body);
    res.send(`/uploads/${filename}`);
  } catch (err) {
    console.error("Audio Upload Error:", err);
    res.status(500).send("");
  }
});

// SAVE SOS
router.post("/sos", async (req, res) => {
  try {
    const { triggerType, soundLevel, motionLevel, image, audio } = req.body;

    const newIncident = new Incident({
      triggerType,
      soundLevel,
      motionLevel,
      image,
      audio,
      location: "No location",
      status: "active"
    });

    await newIncident.save();

    res.json({ success: true, incident: newIncident });
  } catch (err) {
    console.error("SOS Save Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET HISTORY
router.get("/history", async (req, res) => {
  try {
    const data = await Incident.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET MEDIA
router.get("/media", async (req, res) => {
  try {
    const data = await Incident.find({
      $or: [{ image: { $ne: "" } }, { audio: { $ne: "" } }]
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

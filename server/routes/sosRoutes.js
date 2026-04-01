const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Incident = require("../models/Incident");

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ---------------- IMAGE UPLOAD ----------------
router.post("/upload-image", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const filename = Date.now() + ".jpg";
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, req.body);

    res.send(`/uploads/${filename}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("");
  }
});

// ---------------- AUDIO UPLOAD ----------------
router.post("/upload-audio", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const filename = Date.now() + ".wav";
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, req.body);

    res.send(`/uploads/${filename}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("");
  }
});

// ---------------- SAVE SOS ----------------
router.post("/sos", async (req, res) => {
  try {
    const { triggerType, soundLevel, motionLevel, image, audio } = req.body;

    const incident = new Incident({
      triggerType,
      soundLevel,
      motionLevel,
      image,
      audio,
      location: "No location",
      status: "active"
    });

    await incident.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HISTORY ----------------
router.get("/history", async (req, res) => {
  const data = await Incident.find().sort({ createdAt: -1 });
  res.json(data);
});

// ---------------- MEDIA ----------------
router.get("/media", async (req, res) => {
  const data = await Incident.find({
    $or: [{ image: { $ne: "" } }, { audio: { $ne: "" } }]
  }).sort({ createdAt: -1 });

  res.json(data);
});

module.exports = router;

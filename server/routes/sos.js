const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const incidents = [];

router.post("/manual", authenticateToken, (req, res) => {
  const { latitude, longitude, message } = req.body;

  const incident = {
    id: Date.now().toString(),
    userId: req.user.id,
    type: "manual",
    latitude: latitude || null,
    longitude: longitude || null,
    message: message || "Manual SOS triggered",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  incidents.push(incident);

  console.log("MANUAL SOS TRIGGERED:", incident);

  res.status(201).json({
    emergency: true,
    message: "SOS signal sent successfully",
    incident,
  });
});

router.post("/automatic", authenticateToken, (req, res) => {
  const { latitude, longitude, sound_level, motion_level } = req.body;

  const incident = {
    id: Date.now().toString(),
    userId: req.user.id,
    type: "automatic",
    latitude: latitude || null,
    longitude: longitude || null,
    sound_level,
    motion_level,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  incidents.push(incident);

  console.log("AUTOMATIC SOS TRIGGERED:", incident);

  res.status(201).json({
    emergency: true,
    message: "Automatic SOS triggered",
    incident,
  });
});

router.get("/incidents", authenticateToken, (req, res) => {
  const userIncidents = incidents
    .filter((i) => i.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ incidents: userIncidents });
});

router.getIncidents = () => incidents;

module.exports = router;

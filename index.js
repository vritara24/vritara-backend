const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// API Key
const API_KEY = "vritara-safety-device-key-2024";

// Middleware to validate API Key
function validateApiKey(req, res, next) {
  const clientKey = req.headers["x-api-key"];
  if (clientKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Test route
app.get("/", (req, res) => {
  res.json({ status: "VRITARA Backend Running" });
});

// Status route
app.get("/status", (req, res) => {
  res.json({ status: "API is live" });
});

// Sensor data route
app.post("/api/sensor-data", validateApiKey, (req, res) => {
  console.log("Sensor Data Received:", req.body);

  const { sound_level, motion_level } = req.body;

  let emergency = false;

  if (sound_level > 80 && motion_level > 1.5) {
    emergency = true;
  }

  res.json({
    emergency: emergency,
    message: emergency ? "Emergency detected" : "Normal condition",
  });
});

// Manual emergency route
app.post("/api/emergency/manual", validateApiKey, (req, res) => {
  console.log("Manual Emergency Triggered");

  res.json({
    emergency: true,
    message: "Manual SOS Triggered",
  });
});

// Heartbeat route
app.post("/api/heartbeat", validateApiKey, (req, res) => {
  res.json({ status: "Device alive" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

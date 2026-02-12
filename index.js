const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeDatabase } = require("./server/db");

const validateApiKey = require("./server/middleware/apiKey");
const authRoutes = require("./server/routes/auth");
const userRoutes = require("./server/routes/user");
const contactRoutes = require("./server/routes/contacts");
const sosRoutes = require("./server/routes/sos");
const uploadRoutes = require("./server/routes/upload");
const locationRoutes = require("./server/routes/location");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

app.use(express.static(path.join(__dirname, "public")));

const PORT = 5000;

app.get("/status", (req, res) => {
  res.json({ status: "API is live" });
});

app.use("/api", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/location", locationRoutes);

app.post("/api/sensor-data", validateApiKey, (req, res) => {
  console.log("Sensor Data Received:", req.body);
  const { sound_level, motion_level } = req.body;
  let emergency = false;
  if (sound_level > 80 && motion_level > 1.5) {
    emergency = true;
  }
  res.json({
    emergency,
    message: emergency ? "Emergency detected" : "Normal condition",
  });
});

app.post("/api/emergency/manual", validateApiKey, (req, res) => {
  console.log("Manual Emergency Triggered");
  res.json({ emergency: true, message: "Manual SOS Triggered" });
});

app.post("/api/heartbeat", validateApiKey, (req, res) => {
  res.json({ status: "Device alive" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`VRITARA Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

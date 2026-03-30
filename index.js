require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeDatabase, pool } = require("./server/db");

const authRoutes = require("./server/routes/auth");
const userRoutes = require("./server/routes/user");
const contactRoutes = require("./server/routes/contacts");
const sosRoutes = require("./server/routes/sos");
const uploadRoutes = require("./server/routes/upload");
const locationRoutes = require("./server/routes/location");
const deviceRoutes = require("./server/routes/device");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// ==============================
// STATIC FILES
// ==============================
app.use(express.static(path.join(__dirname, "public")));

// General uploads
app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));

// Device media uploads
app.use("/uploads/device-media", express.static(path.join(__dirname, "server/uploads/device-media")));

// ==============================
// PORT
// ==============================
const PORT = parseInt(process.env.PORT || "5000", 10);

// ==============================
// BASIC STATUS
// ==============================
app.get("/status", (req, res) => {
  res.json({ status: "API is live" });
});

// ==============================
// ROUTES
// ==============================
app.use("/api", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/device", deviceRoutes);

// ==============================
// INCIDENT HISTORY
// ==============================
// This version is more robust:
// 1) If app sends valid token -> use logged in user
// 2) If token missing / broken -> fallback to linked email
app.get("/api/incidents", async (req, res) => {
  try {
    let userId = null;

    // Try token first
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.log("Token invalid or expired, using fallback linked user");
      }
    }

    // Fallback: linked device email
    if (!userId) {
      const linkedEmail = "swasthikshetty547@gmail.com";

      const userResult = await pool.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [linkedEmail]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Linked user not found" });
      }

      userId = userResult.rows[0].id;
    }

    const incidentsResult = await pool.query(
      "SELECT * FROM incident_logs WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const incidents = [];

    for (const incident of incidentsResult.rows) {
      const smsResult = await pool.query(
        "SELECT contact_name, contact_phone, status, created_at FROM sms_logs WHERE incident_id = $1",
        [incident.id]
      );

      const broadcastResult = await pool.query(
        `SELECT nb.distance_meters, nb.status, nb.created_at, u.username as receiver_name
         FROM nearby_broadcasts nb
         LEFT JOIN users u ON nb.receiver_id = u.id
         WHERE nb.incident_id = $1`,
        [incident.id]
      );

      const mediaResult = await pool.query(
        "SELECT id, filename, original_name, mimetype, file_size, file_path, created_at FROM media_storage WHERE incident_id = $1 ORDER BY created_at DESC",
        [incident.id]
      );

      incidents.push({
        ...incident,
        sms_notifications: smsResult.rows,
        nearby_broadcasts: broadcastResult.rows,
        media_files: mediaResult.rows,
      });
    }

    res.json({ incidents });
  } catch (err) {
    console.error("Get incidents error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ==============================
// ROOT
// ==============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==============================
// START SERVER
// ==============================
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

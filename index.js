const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const deviceRoutes = require("./server/routes/device");
const uploadRoutes = require("./server/routes/upload");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));

// Routes
app.use("/device", deviceRoutes);
app.use("/upload", uploadRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("VRITARA Backend Running Successfully");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

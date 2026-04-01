const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const uploadRoutes = require("./server/routes/upload");
const deviceRoutes = require("./server/routes/device");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));

app.use("/upload", uploadRoutes);
app.use("/device", deviceRoutes);

app.get("/", (req, res) => {
  res.send("VRITARA Backend Running");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

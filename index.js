require("dotenv").config();



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

const deviceRoutes = require("./server/routes/device");



const app = express();

app.use(cors());

app.use(express.json());



app.use((req, res, next) => {

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  next();

});



app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));



const PORT = parseInt(process.env.PORT || "5000", 10);



app.get("/status", (req, res) => {

  res.json({ status: "API is live" });

});



app.use("/api", authRoutes);

app.use("/api/user", userRoutes);

app.use("/api/contacts", contactRoutes);

app.use("/api/sos", sosRoutes);

app.use("/api/upload", uploadRoutes);

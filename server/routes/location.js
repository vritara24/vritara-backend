const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const locations = [];

router.post("/", authenticateToken, (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  const location = {
    userId: req.user.id,
    latitude,
    longitude,
    timestamp: new Date().toISOString(),
  };

  locations.push(location);

  res.json({ message: "Location updated", location });
});

module.exports = router;

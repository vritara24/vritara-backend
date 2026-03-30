const express = require("express");
const { pool } = require("../db");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

router.post("/sos", validateApiKey, async (req, res) => {
const client = await pool.connect();

try {
await client.query("BEGIN");

```
const {
  device_id,
  trigger_type,
  latitude,
  longitude,
  sound_level,
  motion_level
} = req.body;

if (!device_id) {
  await client.query("ROLLBACK");
  return res.status(400).json({ error: "device_id required" });
}

const deviceResult = await client.query(
  "SELECT * FROM devices WHERE device_id = $1",
  [device_id]
);

if (deviceResult.rows.length === 0) {
  await client.query("ROLLBACK");
  return res.status(404).json({ error: "Device not registered" });
}

const userId = deviceResult.rows[0].user_id;

await client.query(
  "INSERT INTO location_logs (user_id, latitude, longitude) VALUES ($1, $2, $3)",
  [userId, latitude, longitude]
);

const incidentResult = await client.query(
  `INSERT INTO incident_logs 
  (user_id, type, latitude, longitude, message, sound_level, motion_level, status)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
  [
    userId,
    trigger_type,
    latitude,
    longitude,
    "SOS from wearable device",
    sound_level,
    motion_level,
    "active"
  ]
);

const incident = incidentResult.rows[0];

await client.query(
  "UPDATE users SET emergency_state='emergency', active_incident_id=$1 WHERE id=$2",
  [incident.id, userId]
);

await client.query("COMMIT");

res.json({
  success: true,
  incident_id: incident.id
});
```

} catch (err) {
await client.query("ROLLBACK");
console.error(err);
res.status(500).json({ error: "Server error" });
} finally {
client.release();
}
});

module.exports = router;

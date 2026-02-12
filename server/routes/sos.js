const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function saveLocationLog(client, userId, latitude, longitude) {
  if (latitude != null && longitude != null) {
    await client.query(
      "INSERT INTO location_logs (user_id, latitude, longitude) VALUES ($1, $2, $3)",
      [userId, latitude, longitude]
    );
  }
}

async function simulateSmsToContacts(userId, incidentId, incidentType, latitude, longitude) {
  const contactsResult = await pool.query(
    "SELECT * FROM emergency_contacts WHERE user_id = $1",
    [userId]
  );

  const userResult = await pool.query("SELECT username, phone FROM users WHERE id = $1", [userId]);
  const userName = userResult.rows[0]?.username || "User";

  const smsLogs = [];
  const locationStr = latitude != null && longitude != null
    ? `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : "Location unavailable";

  for (const contact of contactsResult.rows) {
    const message = `VRITARA EMERGENCY ALERT: ${userName} triggered a ${incidentType} SOS! ${locationStr}. Please respond immediately.`;

    const smsResult = await pool.query(
      "INSERT INTO sms_logs (incident_id, user_id, contact_name, contact_phone, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [incidentId, userId, contact.name, contact.phone, message, "sent"]
    );

    smsLogs.push(smsResult.rows[0]);
    console.log(`[SMS SIMULATED] To: ${contact.name} (${contact.phone}) - ${message}`);
  }

  return smsLogs;
}

async function broadcastToNearbyUsers(userId, incidentId, latitude, longitude) {
  if (!latitude || !longitude) return [];

  const recentLocations = await pool.query(
    `SELECT DISTINCT ON (user_id) user_id, latitude, longitude
     FROM location_logs
     WHERE user_id != $1 AND created_at > NOW() - INTERVAL '1 hour'
     ORDER BY user_id, created_at DESC`,
    [userId]
  );

  const nearbyBroadcasts = [];
  const RADIUS_METERS = 200;

  for (const loc of recentLocations.rows) {
    const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);

    if (distance <= RADIUS_METERS) {
      const receiverResult = await pool.query("SELECT username FROM users WHERE id = $1", [loc.user_id]);
      const receiverName = receiverResult.rows[0]?.username || "Unknown";

      const broadcastResult = await pool.query(
        "INSERT INTO nearby_broadcasts (incident_id, broadcaster_id, receiver_id, distance_meters, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          incidentId,
          userId,
          loc.user_id,
          Math.round(distance),
          `Emergency SOS alert from a nearby VRITARA user (${Math.round(distance)}m away). Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          "sent",
        ]
      );

      nearbyBroadcasts.push({
        ...broadcastResult.rows[0],
        receiver_name: receiverName,
      });

      console.log(`[NEARBY BROADCAST] To user ${receiverName} (${Math.round(distance)}m away)`);
    }
  }

  if (nearbyBroadcasts.length === 0) {
    console.log("[NEARBY BROADCAST] No users found within 200m radius");
  }

  return nearbyBroadcasts;
}

async function getMediaForIncident(incidentId) {
  const result = await pool.query(
    "SELECT id, filename, original_name, mimetype, file_size, created_at FROM media_storage WHERE incident_id = $1",
    [incidentId]
  );
  return result.rows;
}

router.post("/manual", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { latitude, longitude, message, media_ids } = req.body;

    await saveLocationLog(client, req.user.id, latitude, longitude);

    const incidentResult = await client.query(
      "INSERT INTO incident_logs (user_id, type, latitude, longitude, message) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, "manual", latitude != null ? latitude : null, longitude != null ? longitude : null, message || "Manual SOS triggered"]
    );
    const incident = incidentResult.rows[0];

    if (media_ids && media_ids.length > 0) {
      for (const mediaId of media_ids) {
        await client.query(
          "UPDATE media_storage SET incident_id = $1 WHERE id = $2 AND user_id = $3",
          [incident.id, mediaId, req.user.id]
        );
      }
    }

    await client.query("COMMIT");

    const smsLogs = await simulateSmsToContacts(req.user.id, incident.id, "manual", latitude, longitude);
    const nearbyBroadcasts = await broadcastToNearbyUsers(req.user.id, incident.id, latitude, longitude);
    const media = await getMediaForIncident(incident.id);

    console.log("MANUAL SOS TRIGGERED:", {
      incident: incident.id,
      sms_sent: smsLogs.length,
      nearby_alerts: nearbyBroadcasts.length,
      media_attached: media.length,
    });

    res.status(201).json({
      emergency: true,
      message: "SOS signal sent successfully",
      incident,
      notifications: {
        sms_sent: smsLogs.length,
        sms_details: smsLogs.map((s) => ({
          contact: s.contact_name,
          phone: s.contact_phone,
          status: s.status,
        })),
        nearby_broadcasts: nearbyBroadcasts.length,
        nearby_details: nearbyBroadcasts.map((b) => ({
          receiver: b.receiver_name,
          distance: b.distance_meters + "m",
          status: b.status,
        })),
      },
      media,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Manual SOS error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.post("/automatic", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { latitude, longitude, sound_level, motion_level, media_ids } = req.body;

    await saveLocationLog(client, req.user.id, latitude, longitude);

    const incidentResult = await client.query(
      "INSERT INTO incident_logs (user_id, type, latitude, longitude, message, sound_level, motion_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        req.user.id,
        "automatic",
        latitude != null ? latitude : null,
        longitude != null ? longitude : null,
        `Auto-detected: sound=${sound_level || 0}dB, motion=${motion_level || 0}g`,
        sound_level,
        motion_level,
      ]
    );
    const incident = incidentResult.rows[0];

    if (media_ids && media_ids.length > 0) {
      for (const mediaId of media_ids) {
        await client.query(
          "UPDATE media_storage SET incident_id = $1 WHERE id = $2 AND user_id = $3",
          [incident.id, mediaId, req.user.id]
        );
      }
    }

    await client.query("COMMIT");

    const smsLogs = await simulateSmsToContacts(req.user.id, incident.id, "automatic", latitude, longitude);
    const nearbyBroadcasts = await broadcastToNearbyUsers(req.user.id, incident.id, latitude, longitude);
    const media = await getMediaForIncident(incident.id);

    console.log("AUTOMATIC SOS TRIGGERED:", {
      incident: incident.id,
      sound_level,
      motion_level,
      sms_sent: smsLogs.length,
      nearby_alerts: nearbyBroadcasts.length,
    });

    res.status(201).json({
      emergency: true,
      message: "Automatic SOS triggered",
      incident,
      notifications: {
        sms_sent: smsLogs.length,
        sms_details: smsLogs.map((s) => ({
          contact: s.contact_name,
          phone: s.contact_phone,
          status: s.status,
        })),
        nearby_broadcasts: nearbyBroadcasts.length,
        nearby_details: nearbyBroadcasts.map((b) => ({
          receiver: b.receiver_name,
          distance: b.distance_meters + "m",
          status: b.status,
        })),
      },
      media,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Auto SOS error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.get("/incidents", authenticateToken, async (req, res) => {
  try {
    const incidentsResult = await pool.query(
      "SELECT * FROM incident_logs WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
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
        "SELECT id, filename, original_name, mimetype, file_size, created_at FROM media_storage WHERE incident_id = $1",
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
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

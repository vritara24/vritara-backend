module.exports = function validateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "API key missing" });
  }

  if (apiKey !== "vritara-safety-device-key-2024") {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
};

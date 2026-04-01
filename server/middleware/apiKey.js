module.exports = function validateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API key missing"
    });
  }

  if (apiKey !== "vritara-safety-device-key-2024") {
    return res.status(403).json({
      success: false,
      error: "Invalid API key"
    });
  }

  next();
};

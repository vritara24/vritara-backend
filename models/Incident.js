const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  triggerType: String,
  soundLevel: Number,
  motionLevel: Number,
  image: String,
  audio: String,
  location: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Incident", incidentSchema);

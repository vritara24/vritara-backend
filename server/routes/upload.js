const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// IMAGE UPLOAD
router.post("/image", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const filename = Date.now() + ".jpg";
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, req.body);

    res.json({ path: `/uploads/${filename}` });
  } catch (err) {
    console.error("Image Upload Error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

// AUDIO UPLOAD
router.post("/audio", express.raw({ type: "*/*", limit: "10mb" }), (req, res) => {
  try {
    const filename = Date.now() + ".wav";
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, req.body);

    res.json({ path: `/uploads/${filename}` });
  } catch (err) {
    console.error("Audio Upload Error:", err);
    res.status(500).json({ error: "Audio upload failed" });
  }
});

module.exports = router;    console.error("Audio Upload Error:", err);
    res.status(500).json({ error: "Audio upload failed" });
  }
});

module.exports = router;

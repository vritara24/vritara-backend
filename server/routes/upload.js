const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ==========================
// IMAGE UPLOAD
// ==========================
router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No image uploaded" });
  }

  res.status(200).json({
    success: true,
    filePath: `/uploads/${req.file.filename}`
  });
});

// ==========================
// AUDIO UPLOAD
// ==========================
router.post("/audio", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No audio uploaded" });
  }

  res.status(200).json({
    success: true,
    filePath: `/uploads/${req.file.filename}`
  });
});

module.exports = router;    console.error("Audio Upload Error:", err);
    res.status(500).json({ error: "Audio upload failed" });
  }
});

module.exports = router;    console.error("Audio Upload Error:", err);
    res.status(500).json({ error: "Audio upload failed" });
  }
});

module.exports = router;

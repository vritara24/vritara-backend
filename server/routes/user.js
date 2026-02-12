const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const authRouter = require("./auth");

const router = express.Router();

router.get("/profile", authenticateToken, (req, res) => {
  const users = authRouter.getUsers();
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  });
});

router.put("/profile", authenticateToken, (req, res) => {
  const users = authRouter.getUsers();
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { username, phone } = req.body;
  if (username) user.username = username;
  if (phone) user.phone = phone;

  res.json({
    message: "Profile updated",
    user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
  });
});

module.exports = router;

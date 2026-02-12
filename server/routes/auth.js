const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

const users = [];

router.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      username,
      email,
      phone,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ error: "Email not found" });
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  user.password = bcrypt.hashSync(tempPassword, 10);

  res.json({
    message: "Password reset successful",
    tempPassword: tempPassword,
  });
});

router.getUsers = () => users;

module.exports = router;

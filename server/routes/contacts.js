const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const contacts = [];

router.post("/", authenticateToken, (req, res) => {
  const { name, phone, relationship } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  const userContacts = contacts.filter((c) => c.userId === req.user.id);
  if (userContacts.length >= 3) {
    return res.status(400).json({ error: "Maximum 3 emergency contacts allowed" });
  }

  const contact = {
    id: Date.now().toString(),
    userId: req.user.id,
    name,
    phone,
    relationship: relationship || "Other",
    createdAt: new Date().toISOString(),
  };

  contacts.push(contact);

  res.status(201).json({ message: "Contact added", contact });
});

router.get("/", authenticateToken, (req, res) => {
  const userContacts = contacts.filter((c) => c.userId === req.user.id);
  res.json({ contacts: userContacts });
});

router.delete("/:id", authenticateToken, (req, res) => {
  const index = contacts.findIndex(
    (c) => c.id === req.params.id && c.userId === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({ error: "Contact not found" });
  }

  contacts.splice(index, 1);
  res.json({ message: "Contact deleted" });
});

module.exports = router;

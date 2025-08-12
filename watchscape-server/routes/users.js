// routes/users.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Register/save user data
router.post("/", async (req, res) => {
  try {
    const { uid, email, name, country, age } = req.body;
    const userExists = await User.findOne({ uid });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ uid, email, name, country, age });
    await newUser.save();
    res.status(201).json({ message: 'User saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user data by uid
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

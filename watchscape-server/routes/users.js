import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import mongoose from "mongoose";

const PinSchema = new mongoose.Schema({
  userUid: String,
  tmdbId: String,
  title: String,
  posterPath: String, // Added posterPath field
});
const Pin = mongoose.models.Pin || mongoose.model("Pin", PinSchema);

const router = express.Router();

// REGISTER / SAVE USER
router.post("/", async (req, res) => {
  try {
    const { uid, email, name, country, age } = req.body;
    const userExists = await User.findOne({ uid });
    if (userExists) return res.status(400).json({ message: "User already exists" });
    const newUser = new User({ uid, email, name, country, age });
    await newUser.save();
    res.status(201).json({ message: "User saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET USER BY UID
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// SEARCH USERS
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const rex = new RegExp(q, "i");
    const users = await User.find({ $or: [{ name: rex }, { email: rex }] })
      .select("uid name email")
      .limit(20);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// FOLLOW TOGGLE
router.post("/:uid/follow", async (req, res) => {
  try {
    const targetUid = req.params.uid;
    const { followerUid } = req.body;
    if (!followerUid) return res.status(400).json({ message: "followerUid required" });
    if (targetUid === followerUid) return res.status(400).json({ message: "Cannot follow yourself" });

    const follower = await User.findOne({ uid: followerUid });
    const target = await User.findOne({ uid: targetUid });
    if (!follower || !target) return res.status(404).json({ message: "User not found" });

    const isFollowing = follower.following.includes(targetUid);

    if (isFollowing) {
      follower.following = follower.following.filter(u => u !== targetUid);
      target.followers = target.followers.filter(u => u !== followerUid);
    } else {
      follower.following.push(targetUid);
      target.followers.push(followerUid);
    }

    await follower.save();
    await target.save();
    res.json({ following: !isFollowing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET PROFILE
router.get("/:uid/profile", async (req, res) => {
  try {
    const { uid } = req.params;
    const viewerUid = req.query.viewerUid || null;

    const user = await User.findOne({ uid }).select("uid name email followers following");
    if (!user) return res.status(404).json({ message: "User not found" });

    const pins = await Pin.find({ userUid: uid }).lean();
    const posts = await Post.find({ userId: uid }).sort({ createdAt: -1 }).lean();

    res.json({
      user: { uid: user.uid, name: user.name, email: user.email },
      followersCount: user.followers.length,
      followingCount: user.following.length,
      followedByViewer: viewerUid ? user.followers.includes(viewerUid) : false,
      pinnedFilms: pins.map(p => ({ 
        tmdbId: p.tmdbId, 
        title: p.title, 
        posterPath: p.posterPath || '' // Include posterPath
      })),
      posts: posts.map(p => ({ 
        _id: p._id, 
        text: p.text, 
        share: p.share, 
        createdAt: p.createdAt,
        type: p.type,
        movie: p.movie,
        movieActivity: p.movieActivity
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PIN / UNPIN FILMS - Fixed to handle posterPath
router.patch("/:uid/pin-film", async (req, res) => {
  try {
    const { tmdbId, title, posterPath } = req.body;
    if (!tmdbId || !title) {
      return res.status(400).json({ message: "tmdbId and title required" });
    }

    // Check if already pinned
    const existing = await Pin.findOne({ userUid: req.params.uid, tmdbId });
    if (existing) {
      return res.status(400).json({ message: "Movie already pinned" });
    }

    // Check pin limit (optional - limit to 6 pins)
    const pinCount = await Pin.countDocuments({ userUid: req.params.uid });
    if (pinCount >= 6) {
      return res.status(400).json({ message: "Maximum 6 films can be pinned" });
    }

    await Pin.create({
      userUid: req.params.uid,
      tmdbId: tmdbId.toString(),
      title,
      posterPath: posterPath || ''
    });

    res.json({ message: "Movie pinned successfully" });
  } catch (err) {
    console.error("Pin film error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Unpin film
router.delete("/:uid/pin-film/:tmdbId", async (req, res) => {
  try {
    const result = await Pin.deleteOne({ 
      userUid: req.params.uid, 
      tmdbId: req.params.tmdbId 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Pinned movie not found" });
    }
    
    res.json({ message: "Movie unpinned successfully" });
  } catch (err) {
    console.error("Unpin film error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of following
router.get("/:uid/following", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const followingUsers = await User.find({ uid: { $in: user.following } }).select("uid name email");
    res.json(followingUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of followers
router.get("/:uid/followers", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const followerUsers = await User.find({ uid: { $in: user.followers } }).select("uid name email");
    res.json(followerUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = express.Router();

// --- GET UNREAD COUNT ---
// Specific route must come first
router.get("/:uid/unread-count", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ message: "User ID is required" });

    const unreadCount = await Notification.countDocuments({
      recipientUid: uid,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- GET ALL NOTIFICATIONS WITH PAGINATION ---
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ message: "User ID is required" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientUid: uid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ notifications: notifications || [] });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- MARK SINGLE AS READ ---
router.patch("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- MARK ALL AS READ ---
router.patch("/:uid/read-all", async (req, res) => {
  try {
    const { uid } = req.params;
    await Notification.updateMany({ recipientUid: uid, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- HELPER FUNCTION TO CREATE NOTIFICATIONS ---
export async function createNotification({ recipientUid, senderUid, type, message, postId = null, movieTitle = null, movieAction = null }) {
  try {
    if (recipientUid === senderUid) return;

    const sender = await User.findOne({ uid: senderUid });
    if (!sender) {
      console.error(`Notification error: Sender with uid ${senderUid} not found`);
      return;
    }

    const senderName = sender.name || sender.username || sender.email || "Someone";

    const notification = new Notification({
      recipientUid,
      senderUid,
      senderName,
      type,
      message,
      postId,
      movieTitle,
      movieAction
    });

    await notification.save();
    console.log("Notification created:", notification);
  } catch (err) {
    console.error("Create notification error:", err);
  }
}

export default router;

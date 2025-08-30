// models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipientUid: { type: String, required: true }, // Who receives the notification
  senderUid: { type: String, required: true },    // Who triggered the notification
  senderName: { type: String, required: true },   // Sender's display name
  type: { 
    type: String, 
    required: true,
    enum: ['like', 'comment', 'share', 'follow', 'post', 'movie_activity']
  },
  message: { type: String, required: true },      // Notification message
  isRead: { type: Boolean, default: false },      // Read status
  postId: { type: String },                       // Related post ID (for likes, comments, shares)
  movieTitle: { type: String },                   // Movie title (for movie activities)
  movieAction: { type: String },                  // 'watched' or 'watchlist' (for movie activities)
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
NotificationSchema.index({ recipientUid: 1, createdAt: -1 });
NotificationSchema.index({ recipientUid: 1, isRead: 1 });

export default mongoose.model("Notification", NotificationSchema);

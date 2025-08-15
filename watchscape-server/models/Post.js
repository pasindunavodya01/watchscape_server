import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, }, // ✅ add this
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});


const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  movie: {
    title: String,
    posterPath: String,
    tmdbId: String,
  },
  likes: { type: [String], default: [] },
  comments: { type: [commentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Post", postSchema);
 
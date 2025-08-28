import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, default: "" },
  type: { 
    type: String, 
    enum: ['text', 'movie_activity'], 
    default: 'text' 
  },
  movieActivity: {
    action: { type: String, enum: ['watchlist', 'watched'] },
    movie: {
      tmdbId: String,
      title: String,
      posterPath: String,
      releaseDate: String,
      overview: String
    }
  },
  movie: {
    tmdbId: String,
    title: String,
    posterPath: String,
    releaseDate: String,
    overview: String
  },
  likes: [String],
  comments: [{
    userId: String,
    userName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
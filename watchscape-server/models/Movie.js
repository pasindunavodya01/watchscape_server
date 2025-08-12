// models/Movie.js
import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  title: String,
  posterPath: String,
  releaseDate: String,
  userId: { type: String, required: true },
  status: { type: String, enum: ['watchlist', 'watched'], required: true },
}, { timestamps: true });  // <-- Add this line


export default mongoose.model("Movie", movieSchema);

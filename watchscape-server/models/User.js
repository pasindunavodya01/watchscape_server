import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: String,
  name: String,
  country: String,
  age: Number,
  followers: { type: [String], default: [] }, // uids of followers
  following: { type: [String], default: [] }, // uids of followed users
});

export default mongoose.model("User", userSchema);

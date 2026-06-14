import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: String,
  name: String,
  profilePic: { type: String, default: "" },
  coverPic: { type: String, default: "" },
  country: String,
  age: Number,
  followers: { type: [String], default: [] }, // uids of followers
  following: { type: [String], default: [] }, // uids of followed users
  bio: { type: String, default: "" },
  socialLinks: {
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    github: { type: String, default: "" },
    website: { type: String, default: "" },
    custom: [{ 
      name: { type: String, default: "" }, 
      url: { type: String, default: "" } 
    }]
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);

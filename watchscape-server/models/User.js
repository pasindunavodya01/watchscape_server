// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  name: String,
  country: String,
  age: Number,
});

export default mongoose.model("User", userSchema);

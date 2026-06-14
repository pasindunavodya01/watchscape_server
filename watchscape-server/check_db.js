import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Movie from "./models/Movie.js";
import User from "./models/User.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const users = await User.find().limit(5);
    console.log("Users in DB:", users.map(u => ({ uid: u.uid, name: u.name, username: u.username })));

    for (const u of users) {
      const watchedCount = await Movie.countDocuments({ userId: u.uid, status: "watched" });
      const watchlistCount = await Movie.countDocuments({ userId: u.uid, status: "watchlist" });
      console.log(`User: ${u.name || u.username} (${u.uid})`);
      console.log(`- Watched Count: ${watchedCount}`);
      console.log(`- Watchlist Count: ${watchlistCount}`);

      const watchedMovies = await Movie.find({ userId: u.uid, status: "watched" });
      console.log(`  Watched Movie titles:`, watchedMovies.map(m => m.title));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();

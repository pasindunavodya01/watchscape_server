import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import userRoutes from "./routes/users.js";
import movieRoutes from "./routes/movies.js";
import postRoutes from "./routes/posts.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/posts", postRoutes);

import notificationRoutes from "./routes/notifications.js";

// Add this with your other route declarations
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

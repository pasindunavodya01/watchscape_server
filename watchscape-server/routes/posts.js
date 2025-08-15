import express from "express";
import axios from "axios";
import Post from "../models/Post.js";
import User from "../models/User.js";

const router = express.Router();

// CREATE POST
router.post("/", async (req, res) => {
  try {
    const { userId, text, movie } = req.body;
    if (!userId || !text) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only save minimal movie info when creating a post
    const movieData = movie
      ? {
          title: movie.title || "",
          posterPath: movie.posterPath || "",
          tmdbId: movie.tmdbId?.toString() || "",
        }
      : undefined;

    const newPost = new Post({
      userId,
      username: user.username || user.name || user.email,
      text,
      movie: movieData,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL POSTS (fetch full movie details if tmdbId exists)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();

    const detailedPosts = await Promise.all(
      posts.map(async (post) => {
        // fetch movie overview & releaseDate if tmdbId exists
        if (post.movie && post.movie.tmdbId) {
          try {
            const tmdbRes = await axios.get(
              `https://api.themoviedb.org/3/movie/${post.movie.tmdbId}`,
              { params: { api_key: process.env.TMDB_API_KEY, language: "en-US" } }
            );
            post.movie.overview = tmdbRes.data.overview;
            post.movie.releaseDate = tmdbRes.data.release_date;
          } catch {
            // ignore, show minimal saved info
          }
        }

        post.comments = post.comments || [];
        for (const comment of post.comments) {
          if (!comment.userName) {
            const user = await User.findOne({ uid: comment.userId }).lean();
            comment.userName = user ? user.username || user.name || user.email : comment.userId;
          }
        }
        post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return post;
      })
    );

    res.json(detailedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// TOGGLE LIKE
router.put("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD COMMENT
router.post("/:id/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const newComment = {
      userId,
      userName: user.username || user.name || user.email || userId,
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    await post.save();

    res.json({ comments: post.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// SHARE POST
router.post("/:id/share", async (req, res) => {
  try {
    const { userId } = req.body;
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: "Post not found" });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const sharedPost = new Post({
      userId,
      username: user.username || user.name || user.email,
      text: originalPost.text,
      movie: originalPost.movie,
      createdAt: new Date(),
    });

    await sharedPost.save();
    res.status(201).json(sharedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

import express from "express";
import axios from "axios";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import { createNotification } from "./notifications.js";

const router = express.Router();

// CREATE POST (regular text)
router.post("/", async (req, res) => {
  try {
    const { userId, text, movie } = req.body;
    if (!userId || !text) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

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

// CREATE MOVIE ACTIVITY POST
router.post("/movie-activity", async (req, res) => {
  try {
    const { tmdbId, title, posterPath, releaseDate, userId, status, overview } = req.body;
    if (!tmdbId || !userId || !status) return res.status(400).json({ message: 'Missing required fields' });

    const existing = await Movie.findOne({ tmdbId, userId, status });
    if (existing) return res.status(400).json({ message: 'Movie already in this list' });

    const movie = new Movie({ tmdbId, title, posterPath, releaseDate, userId, status });
    const savedMovie = await movie.save();

    const user = await User.findOne({ uid: userId });
    if (user) {
      const activityPost = new Post({
        userId,
        username: user.username || user.name || user.email,
        type: 'movie_activity',
        movieActivity: {
          action: status,
          movie: {
            tmdbId: tmdbId.toString(),
            title,
            posterPath,
            releaseDate,
            overview: overview || ""
          }
        }
      });
      await activityPost.save();
    }

    res.status(201).json(savedMovie);
  } catch (err) {
    console.error('Movie activity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();

    const detailedPosts = await Promise.all(
      posts.map(async (post) => {
        if (!post.userName && post.username) post.userName = post.username;

        if (post.type === 'movie_activity' && post.movieActivity?.movie.tmdbId) {
          try {
            const tmdbRes = await axios.get(
              `https://api.themoviedb.org/3/movie/${post.movieActivity.movie.tmdbId}`,
              { params: { api_key: process.env.TMDB_API_KEY, language: "en-US" } }
            );
            if (!post.movieActivity.movie.overview) post.movieActivity.movie.overview = tmdbRes.data.overview;
            if (!post.movieActivity.movie.releaseDate) post.movieActivity.movie.releaseDate = tmdbRes.data.release_date;
          } catch (error) {
            console.log('TMDB fetch error for activity post:', error.message);
          }
        }

        if (post.movie?.tmdbId) {
          try {
            const tmdbRes = await axios.get(
              `https://api.themoviedb.org/3/movie/${post.movie.tmdbId}`,
              { params: { api_key: process.env.TMDB_API_KEY, language: "en-US" } }
            );
            if (!post.movie.overview) post.movie.overview = tmdbRes.data.overview;
            if (!post.movie.releaseDate) post.movie.releaseDate = tmdbRes.data.release_date;
          } catch (error) {
            console.log('TMDB fetch error for movie post:', error.message);
          }
        }

        post.comments = post.comments || [];
        for (const comment of post.comments) {
          if (!comment.userName) {
            try {
              const user = await User.findOne({ uid: comment.userId }).lean();
              comment.userName = user ? user.username || user.name || user.email : comment.userId;
            } catch (error) {
              comment.userName = comment.userId;
            }
          }
        }
        post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return post;
      })
    );

    res.json(detailedPosts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// TOGGLE LIKE WITH NOTIFICATION
router.put("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    let liked = false;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      post.likes.push(userId);
      liked = true;

      await createNotification({
        recipientUid: post.userId,
        senderUid: userId,
        type: "like",
        message: "liked your post",
        postId: post._id.toString()
      });
    }

    await post.save();
    res.json({ likes: post.likes, liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD COMMENT WITH NOTIFICATION
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

    await createNotification({
      recipientUid: post.userId,
      senderUid: userId,
      type: "comment",
      message: "commented on your post",
      postId: post._id.toString()
    });

    res.json({ comments: post.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// SHARE POST WITH NOTIFICATION
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
      type: originalPost.type,
      movieActivity: originalPost.movieActivity,
      createdAt: new Date(),
    });

    await sharedPost.save();

    await createNotification({
      recipientUid: originalPost.userId,
      senderUid: userId,
      type: "share",
      message: "shared your post",
      postId: originalPost._id.toString()
    });

    res.status(201).json(sharedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

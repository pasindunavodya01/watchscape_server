// routes/movies.js
import express from "express";
import axios from "axios";
import Movie from "../models/Movie.js";

const router = express.Router();

// TMDb movie search
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: 'Query missing' });

    const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query,
        language: 'en-US',
        page: 1,
        include_adult: false,
      },
    });

    res.json(response.data.results);
  } catch (error) {
    console.error('TMDb search error:', error.message);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
});

// Add movie
router.post("/", async (req, res) => {
  try {
    const { tmdbId, title, posterPath, releaseDate, userId, status } = req.body;
    if (!tmdbId || !userId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Movie.findOne({ tmdbId, userId, status });
    if (existing) {
      return res.status(400).json({ message: 'Movie already in this list' });
    }

    const movie = new Movie({ tmdbId, title, posterPath, releaseDate, userId, status });
    const savedMovie = await movie.save();
    res.status(201).json(savedMovie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get movies with details
router.get("/", async (req, res) => {
  try {
    const { userId, status } = req.query;
    if (!userId || !status) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const movies = await Movie.find({ userId, status });
    const detailedMovies = await Promise.all(
      movies.map(async (m) => {
        try {
          const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${m.tmdbId}`, {
            params: { api_key: process.env.TMDB_API_KEY, language: 'en-US' }
          });
          return { 
            _id: m._id,
            userId: m.userId,
            status: m.status,
            tmdbId: m.tmdbId,
            title: tmdbRes.data.title,
            posterPath: tmdbRes.data.poster_path,
            releaseDate: tmdbRes.data.release_date,
            overview: tmdbRes.data.overview,
            tmdbDetails: tmdbRes.data,
          };
        } catch {
          return m.toObject();
        }
      })
    );
    res.json(detailedMovies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete movie
router.delete("/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update movie status
router.put("/:id", async (req, res) => {
  try {
    const updated = await Movie.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating movie' });
  }
});

export default router;

// Get popular movies
router.get("/popular", async (req, res) => {
  try {
    const response = await axios.get("https://api.themoviedb.org/3/movie/popular", {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: "en-US",
        page: 1,
      },
    });
    res.json(response.data.results);
  } catch (error) {
    console.error("TMDb popular error:", error.message);
    res.status(500).json({ message: "Failed to fetch popular movies" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      console.error("Missing userId in query");
      return res.status(400).json({ message: "Missing userId" });
    }

    console.log(`Stats request for userId: ${userId}`);

    // Double-check type and format of userId
    console.log("Type of userId:", typeof userId);
    console.log("userId length:", userId.length);

    // Find some example movies for this user (any status)
    const exampleMovies = await Movie.find({ userId }).limit(5);
    console.log(`Example movies found for userId=${userId}: ${exampleMovies.length}`);
    exampleMovies.forEach((movie, idx) => {
      console.log(`Example movie #${idx + 1}: tmdbId=${movie.tmdbId}, status=${movie.status}, updatedAt=${movie.updatedAt}`);
    });

    // Get total watchlist count
    const watchlistCount = await Movie.countDocuments({ userId, status: "watchlist" });
    console.log("Watchlist count:", watchlistCount);

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log("30 days ago:", thirtyDaysAgo);

    // Get watched count in last 30 days (based on updatedAt)
    const watchedRecentCount = await Movie.countDocuments({
      userId,
      status: "watched",
      updatedAt: { $gte: thirtyDaysAgo },
    });
    console.log("Watched recent count:", watchedRecentCount);

    res.json({ watchlistCount, watchedRecentCount });
  } catch (err) {
    console.error("Error in /stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});


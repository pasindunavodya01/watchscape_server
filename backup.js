import React, { useState, useEffect } from 'react';

export default function Dashboard({ user, onLogout }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [activeTab, setActiveTab] = useState('watchlist');

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState(null);


  useEffect(() => {
    if (!user) return;

    fetch(`https://patient-determination-production.up.railway.app/api/movies?userId=${user.uid}&status=watchlist`)
      .then(res => res.json())
      .then(data => setWatchlist(data))
      .catch(console.error);

    fetch(`https://patient-determination-production.up.railway.app/api/movies?userId=${user.uid}&status=watched`)
      .then(res => res.json())
      .then(data => setWatched(data))
      .catch(console.error);
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await fetch(`https://patient-determination-production.up.railway.app/api/movies/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
      setActiveTab('search');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
  if (!user) return;

  fetch(`https://patient-determination-production.up.railway.app/api/users/${user.uid}`)
    .then(res => res.json())
    .then(data => setUserData(data))  // userData will have the name, email, etc.
    .catch(console.error);
}, [user]);


  const addMovie = async (movie, status) => {
  try {
    const res = await fetch('https://patient-determination-production.up.railway.app/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        userId: user.uid,
        status,
      }),
    });

    if (res.ok) {
      const savedMovie = await res.json(); // Get saved movie with _id from backend
      
      if (status === 'watchlist') setWatchlist([...watchlist, savedMovie]);
      else setWatched([...watched, savedMovie]);

      alert('Movie added!');
    } else {
      const error = await res.json();
      alert(error.message || 'Failed to add movie');
    }
  } catch (error) {
    console.error(error);
    alert('Error adding movie');
  }
};




const markAsWatched = async (movie) => {
  try {
    const res = await fetch(`https://patient-determination-production.up.railway.app/api/movies/${movie._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'watched' }),
    });

    if (res.ok) {
      const updatedMovie = await res.json();

      // Remove from watchlist and add to watched
      setWatchlist(prev => prev.filter(m => m._id !== movie._id));
      setWatched(prev => [...prev, updatedMovie]);
    } else {
      alert('Failed to update movie status');
    }
  } catch (error) {
    console.error(error);
    alert('Error updating movie status');
  }
};









  const removeMovie = async (movieId) => {
  const confirmed = window.confirm('Are you sure you want to remove this movie?');
  if (!confirmed) return;

  try {
    const res = await fetch(`https://patient-determination-production.up.railway.app/api/movies/${movieId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setWatchlist(watchlist.filter(m => m._id !== movieId));
      setWatched(watched.filter(m => m._id !== movieId));
    } else {
      alert('Failed to remove movie');
    }
  } catch (error) {
    console.error(error);
    alert('Error removing movie');
  }
};


  const viewDetails = (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setShowModal(false);
  };

 const renderMovieCard = (movie, isFromSearch = false) => (
  <div key={movie._id || movie.id} className="border rounded p-2 relative">
    {(movie.posterPath || movie.poster_path) ? (
      <img
        src={`https://image.tmdb.org/t/p/w200${movie.posterPath || movie.poster_path}`}
        alt={movie.title}
        className="mb-2 rounded"
      />
    ) : (
      <div className="mb-2 h-28 bg-gray-300 flex items-center justify-center text-gray-600">
        No Image
      </div>
    )}

    <h3 className="font-semibold">{movie.title}</h3>
    <p className="text-sm text-gray-600">{movie.releaseDate || movie.release_date || 'N/A'}</p>

    <div className="mt-2 flex gap-2 flex-wrap">
      <button
        onClick={() => viewDetails(movie)}
        className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
      >
        View Details
      </button>

      {isFromSearch ? (
        <>
          <button
            onClick={() => addMovie(movie, 'watchlist')}
            className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
          >
            Add to Wishlist
          </button>
          <button
            onClick={() => addMovie(movie, 'watched')}
            className="bg-green-600 text-white px-2 py-1 rounded text-sm"
          >
            Add to Watched
          </button>
        </>
      ) : activeTab === 'watchlist' ? (
        <>
          <button
            onClick={() => markAsWatched(movie)}
            className="bg-green-600 text-white px-2 py-1 rounded text-sm"
          >
            Mark as Watched
          </button>
          <button
            onClick={() => removeMovie(movie._id)}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm"
          >
            Remove
          </button>
        </>
      ) : (
        <button
          onClick={() => removeMovie(movie._id)}
          className="bg-red-500 text-white px-2 py-1 rounded text-sm"
        >
          Remove
        </button>
      )}
    </div>
  </div>
);


  return (
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
           Welcome, {userData?.name || userData?.displayName || user?.email || 'User'}
        </h1>
        <div>
          <button
            onClick={() => alert('Profile coming soon!')}
            className="mr-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Profile
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <form onSubmit={handleSearch} className="mb-6 flex">
        <input
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-grow p-2 border rounded-l border-gray-400"
        />
        <button type="submit" className="bg-yellow-500 px-4 rounded-r hover:bg-yellow-600 text-white font-semibold">
          Search
        </button>
      </form>

      <div className="mb-4">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`mr-4 px-4 py-2 rounded ${activeTab === 'watchlist' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
        >
          Wishlist ({watchlist.length})
        </button>
        <button
          onClick={() => setActiveTab('watched')}
          className={`px-4 py-2 rounded ${activeTab === 'watched' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
        >
          Watched ({watched.length})
        </button>
      </div>

      {activeTab === 'search' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Search Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {searchResults.map(movie => renderMovieCard(movie, true))}
          </div>
        </div>
      )}

      {activeTab !== 'search' && (
        <div>
          <h2 className="text-xl font-semibold mb-2 capitalize">{activeTab}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {// When rendering watchlist or watched, just do this:

(activeTab === 'watchlist' ? [...watchlist].reverse() : [...watched].reverse()).map(movie => renderMovieCard(movie))}

          </div>
        </div>
      )}

      {showModal && selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={closeModal}>
          <div className="bg-white p-4 rounded max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">{selectedMovie.title}</h2>
           {(selectedMovie.posterPath || selectedMovie.poster_path) ? (
  <div className="mb-2 flex justify-center">
    <img
      src={`https://image.tmdb.org/t/p/w300${selectedMovie.posterPath || selectedMovie.poster_path}`}
      alt={selectedMovie.title}
      className="rounded"
    />
  </div>
) : (
  <div className="mb-2 h-48 bg-gray-300 flex items-center justify-center text-gray-600">
    No Image
  </div>
)}

          <p><strong>Release Date:</strong> {selectedMovie.releaseDate || selectedMovie.release_date || 'N/A'}</p>

            {selectedMovie.overview && <p className="mt-2">{selectedMovie.overview}</p>}
            <div className="mt-4 text-right">
              <button onClick={closeModal} className="bg-red-500 text-white px-4 py-2 rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}











































import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = process.env.MONGO_URI ;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// User Schema & Model
const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  name: String,
  country: String,
  age: Number,
});

const User = mongoose.model('User', userSchema);


// Get user data by uid
app.get('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send user data except maybe exclude sensitive info if any
    res.json({
      uid: user.uid,
      email: user.email,
      name: user.name,
      country: user.country,
      age: user.age,
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




// Movie Schema & Model
const movieSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  title: String,
  posterPath: String,
  releaseDate: String,
  userId: { type: String, required: true },
  status: { type: String, enum: ['watchlist', 'watched'], required: true },
});

const Movie = mongoose.model('Movie', movieSchema);


// Routes

// Register/save user data
app.post('/api/users', async (req, res) => {
  try {
    const { uid, email, name, country, age } = req.body;

    const userExists = await User.findOne({ uid });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ uid, email, name, country, age });
    await newUser.save();

    res.status(201).json({ message: 'User saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// TMDb movie search
app.get('/api/movies/search', async (req, res) => {
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

// Add movie to watchlist/watched
app.post('/api/movies', async (req, res) => {
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

// Get movies by user and status (watchlist or watched) with full TMDb details
app.get('/api/movies', async (req, res) => {
  try {
    const { userId, status } = req.query;
    if (!userId || !status) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const movies = await Movie.find({ userId, status });

    // Fetch full details from TMDb for each movie
    const detailedMovies = await Promise.all(
      movies.map(async (m) => {
        try {
          const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${m.tmdbId}`, {
            params: { api_key: process.env.TMDB_API_KEY, language: 'en-US' }
          });
          // Merge stored data with fresh TMDb data for frontend ease
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
        } catch (err) {
          console.error(`Failed to fetch TMDb details for ${m.tmdbId}:`, err.message);
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

// Delete movie from list
app.delete('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Movie.findByIdAndDelete(id);
    res.json({ message: 'Movie removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});




app.put('/api/movies/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const updated = await Movie.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating movie' });
  }
});


















// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});



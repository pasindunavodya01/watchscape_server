import React, { useEffect, useState } from "react";

// Genre mapping for TMDB (same as in Search.jsx)
const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

export default function Watchlist({ user, onMovieChange }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchMovies = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`https://patient-determination-production.up.railway.app/api/movies?userId=${user.uid}&status=watchlist`);
      const data = await res.json();
      setMovies([...data].reverse());
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, [user]);

  const removeMovie = async (id) => {
    try {
      const res = await fetch(`https://patient-determination-production.up.railway.app/api/movies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMovies(movies.filter((m) => m._id !== id));
        if (onMovieChange) onMovieChange();
      } else {
        alert("Failed to remove movie");
      }
    } catch {
      alert("Error removing movie");
    }
  };

  const markAsWatched = async (movie) => {
    try {
      const res = await fetch("https://patient-determination-production.up.railway.app/api/posts/movie-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseDate: movie.releaseDate,
          overview: movie.overview || '',
          userId: user.uid,
          status: "watched",
        }),
      });
      
      if (res.ok) {
        await fetch(`https://patient-determination-production.up.railway.app/api/movies/${movie._id}`, {
          method: "DELETE",
        });
        
        setMovies(movies.filter((m) => m._id !== movie._id));
        if (onMovieChange) onMovieChange();
        
        alert("Movie marked as watched!");
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to mark as watched");
      }
    } catch (error) {
      console.error("Error marking as watched:", error);
      alert("Error updating movie");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Watchlist</h1>
        <p className="text-gray-600">Movies you want to watch later</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading watchlist...</p>
          </div>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-20">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h3>
          <p className="text-gray-600">Movies you add to your watchlist will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-200 group"
            >
              {/* Movie Poster */}
              <div className="relative aspect-[2/3] bg-gray-100">
                {movie.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w400${movie.posterPath}`}
                    alt={movie.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  />
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7Z" />
                    </svg>
                  </div>
                )}

                {/* Info Button */}
                <button
                  onClick={() => setSelectedMovie(movie)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black bg-opacity-60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-opacity-80"
                  title="View Details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Rating Badge */}
                {movie.vote_average > 0 && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {movie.vote_average.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Movie Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {movie.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "N/A"}
                </p>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => markAsWatched(movie)}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Watched
                  </button>
                  <button
                    onClick={() => removeMovie(movie._id)}
                    className="w-full bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Movie Details Modal (same style as Search.jsx) */}
      {selectedMovie && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50"
          onClick={() => setSelectedMovie(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative">
              {selectedMovie.backdropPath ? (
                <div className="relative h-48 bg-gradient-to-t from-black/60 to-transparent">
                  <img
                    src={`https://image.tmdb.org/t/p/w780${selectedMovie.backdropPath}`}
                    alt={selectedMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-purple-600 to-blue-600"></div>
              )}
              
              <button
                onClick={() => setSelectedMovie(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              <div className="flex gap-6 mb-6">
                {/* Poster */}
                {selectedMovie.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedMovie.posterPath}`}
                    alt={selectedMovie.title}
                    className="w-32 h-48 object-cover rounded-xl shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-32 h-48 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7Z" />
                    </svg>
                  </div>
                )}

                {/* Movie Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{selectedMovie.title}</h3>
                  <p className="text-gray-600 mb-2">
                    {selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).toDateString() : "N/A"}
                  </p>
                  {selectedMovie.genre_ids && selectedMovie.genre_ids.length > 0 && (
                    <p className="text-gray-600 mb-2">
                      Genres: {selectedMovie.genre_ids.map(id => genreMap[id]).join(", ") || "N/A"}
                    </p>
                  )}
                  <p className="text-gray-700">{selectedMovie.overview || "No description available."}</p>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        markAsWatched(selectedMovie);
                        setSelectedMovie(null);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Watched
                    </button>
                    <button
                      onClick={() => {
                        removeMovie(selectedMovie._id);
                        setSelectedMovie(null);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
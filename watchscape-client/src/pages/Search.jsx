import React, { useState, useEffect } from "react";

// Genre mapping for TMDB
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

export default function Search({ user, onMovieChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch popular movies
  const fetchPopular = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://patient-determination-production.up.railway.app/api/movies/popular");
      const data = await res.json();
      setResults(data);
      setIsSearching(false);
    } catch (err) {
      console.error("Failed to fetch popular movies:", err);
      alert("Failed to load popular movies");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPopular();
  }, []);

  const searchMovies = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setLoading(true);
    try {
      const res = await fetch(`https://patient-determination-production.up.railway.app/api/movies/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      alert("Failed to fetch movies");
    }
    setLoading(false);
  };

  const addMovie = async (movie, status) => {
    try {
      const res = await fetch("https://patient-determination-production.up.railway.app/api/posts/movie-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          releaseDate: movie.release_date,
          overview: movie.overview || '',
          userId: user.uid,
          status,
        }),
      });
      if (res.ok) {
        alert(`Movie added to your ${status}!`);
        onMovieChange?.();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to add movie");
      }
    } catch (error) {
      console.error(error);
      alert("Error adding movie");
    }
  };

  const clearSearch = () => {
    setQuery("");
    setIsSearching(false);
    fetchPopular();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Movies</h1>
        <p className="text-gray-600">Search for movies and add them to your watchlist or mark as watched</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-3 max-w-2xl">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search for movies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMovies(e)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-lg"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={searchMovies}
            disabled={loading || !query.trim()}
            className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isSearching ? "Searching..." : "Loading..."}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isSearching ? `Search Results for "${query}"` : "Popular Movies"}
          </h2>
          <p className="text-gray-600 mt-1">
            {isSearching ? `Found ${results.length} movies` : "Currently trending movies"}
          </p>
        </div>
        {isSearching && (
          <button
            onClick={clearSearch}
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Popular
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{isSearching ? "Searching movies..." : "Loading popular movies..."}</p>
          </div>
        </div>
      ) : (
        /* Movie Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {results.map((movie) => (
            <div
              key={movie.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-200 group"
            >
              {/* Movie Poster */}
              <div className="relative aspect-[2/3] bg-gray-100">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w400${movie.poster_path}`}
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
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                </p>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => addMovie(movie, "watchlist")}
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to Watchlist
                  </button>
                  <button
                    onClick={() => addMovie(movie, "watched")}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Watched
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && isSearching && (
        <div className="text-center py-20">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No movies found</h3>
          <p className="text-gray-600 mb-4">Try searching with different keywords</p>
          <button
            onClick={clearSearch}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Browse popular movies instead
          </button>
        </div>
      )}

      {/* Movie Details Modal */}
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
              {selectedMovie.backdrop_path ? (
                <div className="relative h-48 bg-gradient-to-t from-black/60 to-transparent">
                  <img
                    src={`https://image.tmdb.org/t/p/w780${selectedMovie.backdrop_path}`}
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
                {selectedMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
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
                    {selectedMovie.release_date ? new Date(selectedMovie.release_date).toDateString() : "N/A"}
                  </p>
                  <p className="text-gray-600 mb-2">
                    Genres: {selectedMovie.genre_ids?.map(id => genreMap[id]).join(", ") || "N/A"}
                  </p>
                  <p className="text-gray-700">{selectedMovie.overview || "No description available."}</p>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => addMovie(selectedMovie, "watchlist")}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all"
                    >
                      Add to Watchlist
                    </button>
                    <button
                      onClick={() => addMovie(selectedMovie, "watched")}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all"
                    >
                      Mark as Watched
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

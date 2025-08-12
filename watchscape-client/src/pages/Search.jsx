import React, { useState, useEffect } from "react";

export default function Search({ user, onMovieChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPopular = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://spectacular-solace-watchscape.up.railway.app/api/movies/popular");
        const data = await res.json();
        setResults(data);
        setIsSearching(false);
      } catch (err) {
        console.error("Failed to fetch popular movies:", err);
        alert("Failed to load popular movies");
      }
      setLoading(false);
    };
    fetchPopular();
  }, []);

  const searchMovies = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setLoading(true);
    try {
      const res = await fetch(`https://spectacular-solace-watchscape.up.railway.app/api/movies/search?q=${encodeURIComponent(query)}`);
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
      const res = await fetch("https://spectacular-solace-watchscape.up.railway.app/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        alert(`Movie added to your ${status}!`);
        if (onMovieChange) onMovieChange();  // <== Notify parent here
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to add movie");
      }
    } catch (error) {
      console.error(error);
      alert("Error adding movie");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <form onSubmit={searchMovies} className="mb-6 flex">
        <input
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow p-2 border rounded-l border-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-700 px-4 rounded-r hover:bg-purple-800 text-white font-semibold"
        >
          {loading ? "Loading..." : isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      <h2 className="text-xl font-bold mb-4">
        {isSearching ? `Search Results for "${query}"` : "Popular Movies"}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.map((movie) => (
          <div
            key={movie.id}
            className="border rounded p-2 relative bg-white shadow hover:shadow-md transition-shadow"
          >
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                alt={movie.title}
                className="mb-2 rounded cursor-pointer"
                onClick={() => setSelectedMovie(movie)}
              />
            ) : (
              <div
                className="mb-2 h-28 bg-gray-300 flex items-center justify-center text-gray-600 cursor-pointer"
                onClick={() => setSelectedMovie(movie)}
              >
                No Image
              </div>
            )}

            <button
              onClick={() => setSelectedMovie(movie)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-lg hover:bg-purple-800"
              title="View Details"
            >
              i
            </button>

            <h3 className="font-semibold">{movie.title}</h3>
            <p className="text-sm text-gray-600">{movie.release_date || "N/A"}</p>

  <div className="mt-2 flex flex-wrap gap-3 w-full">
  <button
    onClick={() => addMovie(movie, "watchlist")}
    className="flex-1 bg-purple-700 text-white px-3 py-1 rounded text-sm text-center"
  >
    Add to Watchlist
  </button>
  <button
    onClick={() => addMovie(movie, "watched")}
    className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm text-center"
  >
    Mark as Watched
  </button>
</div>

          </div>
        ))}
      </div>

      {/* Modal for movie details */}
      {selectedMovie && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
          onClick={() => setSelectedMovie(null)}
        >
          <div
            className="bg-white rounded max-w-lg w-full p-6 overflow-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">{selectedMovie.title}</h2>
            {selectedMovie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                className="mb-4 rounded mx-auto"
              />
            )}
            <p>
              <strong>Release Date:</strong> {selectedMovie.release_date || "N/A"}
            </p>
            {selectedMovie.overview && <p className="mt-4">{selectedMovie.overview}</p>}

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedMovie(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

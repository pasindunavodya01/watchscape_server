import React, { useEffect, useState } from "react";

export default function Watched({ user, onMovieChange }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchMovies = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`https://spectacular-solace-watchscape.up.railway.app/api/movies?userId=${user.uid}&status=watched`);
      const data = await res.json();
      setMovies([...data].reverse());
    } catch (err) {
      console.error("Failed to fetch watched movies:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, [user]);

  const removeMovie = async (id) => {
    try {
      const res = await fetch(`https://spectacular-solace-watchscape.up.railway.app/api/movies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMovies(movies.filter((m) => m._id !== id));
        if (onMovieChange) onMovieChange();  // Notify parent about update
      } else {
        alert("Failed to remove movie");
      }
    } catch {
      alert("Error removing movie");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Watched Movies</h2>
      {loading ? (
        <p>Loading...</p>
      ) : movies.length === 0 ? (
        <p>You haven't marked any movies as watched yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <div key={movie._id} className="border rounded p-2 bg-white shadow relative">
              {movie.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w200${movie.posterPath}`}
                  alt={movie.title}
                  className="mb-2 rounded"
                />
              ) : (
                <div className="mb-2 h-28 bg-gray-300 flex items-center justify-center text-gray-600">
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
              <p className="text-sm text-gray-600">{movie.releaseDate || "N/A"}</p>

              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => removeMovie(movie._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            {selectedMovie.posterPath && (
              <img
                src={`https://image.tmdb.org/t/p/w300${selectedMovie.posterPath}`}
                alt={selectedMovie.title}
                className="mb-4 rounded mx-auto"
              />
            )}
            <p><strong>Release Date:</strong> {selectedMovie.releaseDate || "N/A"}</p>
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

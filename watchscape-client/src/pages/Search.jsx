import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { API } from "../config";
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon, XMarkIcon, FireIcon, FilmIcon,
  BookmarkIcon, EyeIcon, StarIcon, InformationCircleIcon
} from "@heroicons/react/24/outline";

const genreMap = {
  28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",
  18:"Drama",10751:"Family",14:"Fantasy",36:"History",27:"Horror",
  10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",
  10770:"TV Movie",53:"Thriller",10752:"War",37:"Western"
};

// Skeleton card
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-200 animate-pulse">
      <div className="aspect-[2/3] bg-slate-200 skeleton-light" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-slate-200 rounded skeleton-light" />
        <div className="h-3 bg-slate-200 rounded w-2/3 skeleton-light" />
        <div className="h-7 bg-slate-200 rounded-lg skeleton-light" />
        <div className="h-7 bg-slate-200 rounded-lg skeleton-light" />
      </div>
    </div>
  );
}

// Movie Details Modal
function MovieModal({ movie, onClose, onAdd, fieldMap = {} }) {
  if (!movie) return null;
  const posterPath = movie.poster_path || movie.posterPath;
  const backdropPath = movie.backdrop_path || movie.backdropPath;
  const releaseDate = movie.release_date || movie.releaseDate;
  const genreIds = movie.genre_ids;
  const overview = movie.overview;
  const title = movie.title;
  const rating = movie.vote_average;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-dark-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop */}
        <div className="relative h-40 sm:h-52 bg-slate-950 flex-shrink-0">
          {backdropPath ? (
            <img src={`https://image.tmdb.org/t/p/w780${backdropPath}`} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-br from-violet-900 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          {rating > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <StarIcon className="w-3.5 h-3.5 fill-white stroke-none" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="flex gap-4 sm:gap-5">
            {/* Poster */}
            {posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${posterPath}`}
                alt={title}
                className="w-20 sm:w-28 aspect-[2/3] object-contain bg-slate-800 rounded-xl shadow-dark flex-shrink-0 relative z-10 -mt-12 sm:-mt-16 ring-2 ring-slate-800"
              />
            ) : (
              <div className="w-20 sm:w-28 aspect-[2/3] bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 -mt-12 sm:-mt-16 ring-2 ring-slate-800">
                <FilmIcon className="w-8 h-8 text-slate-600" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1">{title}</h2>
              {releaseDate && (
                <p className="text-slate-400 text-sm">{new Date(releaseDate).getFullYear()}</p>
              )}
              {genreIds && genreIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {genreIds.slice(0, 3).map(id => genreMap[id] && (
                    <span key={id} className="px-2 py-0.5 bg-violet-600/20 text-violet-300 text-xs rounded-full border border-violet-600/30">
                      {genreMap[id]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {overview && (
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">{overview}</p>
          )}

          {/* Actions */}
          {onAdd && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => onAdd(movie, 'watchlist')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-brand"
              >
                <BookmarkIcon className="w-4 h-4" />
                Watchlist
              </button>
              <button
                onClick={() => onAdd(movie, 'watched')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all duration-200"
              >
                <EyeIcon className="w-4 h-4" />
                Watched
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Movie card
function MovieCard({ movie, onDetails, onAdd, posterKey = 'poster_path' }) {
  const posterPath = movie[posterKey] || movie.poster_path || movie.posterPath;
  const rating = movie.vote_average;
  const year = (movie.release_date || movie.releaseDate)
    ? new Date(movie.release_date || movie.releaseDate).getFullYear() : null;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onDetails(movie)}>
        {posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w400${posterPath}`}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <FilmIcon className="w-12 h-12 text-slate-400" />
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <button
            onClick={(e) => { e.stopPropagation(); onDetails(movie); }}
            className="flex items-center gap-1.5 text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-full hover:bg-white/30 transition-colors"
          >
            <InformationCircleIcon className="w-3.5 h-3.5" />
            Details
          </button>
        </div>
        {/* Rating badge */}
        {rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            <StarIcon className="w-3 h-3 fill-white stroke-none" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug mb-1">{movie.title}</h3>
        {year && <p className="text-xs text-slate-400 mb-3">{year}</p>}
        <div className="space-y-1.5">
          <button
            onClick={() => onAdd(movie, 'watchlist')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <BookmarkIcon className="w-3.5 h-3.5" />
            Watchlist
          </button>
          <button
            onClick={() => onAdd(movie, 'watched')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            Watched
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Search({ user, onMovieChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchPopular = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/movies/popular`);
      const data = await res.json();
      setResults(data); setIsSearching(false);
    } catch (err) { console.error(err); toast.error("Failed to load popular movies"); }
    setLoading(false);
  };

  useEffect(() => { fetchPopular(); }, []);

  const searchMovies = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true); setLoading(true);
    try {
      const res = await fetch(`${API}/api/movies/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) { console.error(err); toast.error("Failed to search movies"); }
    setLoading(false);
  };

  const addMovie = async (movie, status) => {
    if (!user || user.isGuest) {
      toast.error('Sign in to add movies to your lists');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const loadingToast = toast.loading(`Adding to ${status}...`);
    try {
      const otherStatus = status === "watchlist" ? "watched" : "watchlist";
      const checkRes = await fetch(`${API}/api/movies?userId=${user.uid}&status=${otherStatus}`);
      if (checkRes.ok) {
        const otherList = await checkRes.json();
        const existing = otherList.find(m => String(m.tmdbId) === String(movie.id));
        if (existing) {
          await fetch(`${API}/api/movies/${existing._id}`, { method: "DELETE" });
          try {
            const postsRes = await fetch(`${API}/api/posts`);
            const allPosts = await postsRes.json();
            const ap = allPosts.find(p => p.userId === user.uid && p.type === "movie_activity" && p.movieActivity?.action === otherStatus && String(p.movieActivity?.movie?.tmdbId) === String(movie.id));
            if (ap) await fetch(`${API}/api/posts/${ap._id}`, { method: "DELETE" });
          } catch(e) { console.error(e); }
        }
      }
      const res = await fetch(`${API}/api/posts/movie-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.id, title: movie.title, posterPath: movie.poster_path, releaseDate: movie.release_date, overview: movie.overview || '', userId: user.uid, status }),
      });
      toast.dismiss(loadingToast);
      if (res.ok) {
        toast.success(`Added to ${status}! 🎬`);
        onMovieChange?.();
        setSelectedMovie(null);
      } else {
        const errData = await res.json();
        if (errData.message === 'Movie already in this list') {
          toast.success(`Already in your ${status}`);
          onMovieChange?.();
        } else { toast.error(errData.message || "Failed to add movie"); }
      }
    } catch (error) { toast.dismiss(loadingToast); toast.error("Error adding movie"); }
  };

  const clearSearch = () => { setQuery(""); setIsSearching(false); fetchPopular(); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Discover Movies</h1>
        <p className="text-slate-500 text-sm">Search for films and add them to your lists</p>
      </div>

      {/* Search bar */}
      <form onSubmit={searchMovies} className="mb-6">
        <div className="flex gap-2 max-w-2xl">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for movies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all shadow-sm"
            />
            {query && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-brand flex items-center gap-2 text-sm"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MagnifyingGlassIcon className="w-4 h-4" />}
            {loading && isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {!isSearching && <FireIcon className="w-5 h-5 text-orange-500" />}
          <h2 className="text-lg font-bold text-slate-800">
            {isSearching ? `Results for "${query}"` : "Trending Now"}
          </h2>
          {!loading && <span className="text-sm text-slate-400">({results.length})</span>}
        </div>
        {isSearching && (
          <button onClick={clearSearch} className="text-sm text-violet-600 hover:text-violet-500 font-medium flex items-center gap-1 transition-colors">
            ← Popular movies
          </button>
        )}
      </div>

      {/* Grid / Skeletons / Empty */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onDetails={setSelectedMovie}
              onAdd={addMovie}
            />
          ))}
        </div>
      ) : isSearching ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlassIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No movies found</h3>
          <p className="text-slate-500 text-sm mb-4">Try different keywords</p>
          <button onClick={clearSearch} className="text-violet-600 hover:text-violet-500 font-medium text-sm transition-colors">
            Browse trending instead
          </button>
        </div>
      ) : null}

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAdd={(movie, status) => { addMovie(movie, status); }}
        />
      )}
    </div>
  );
}

export { MovieCard, MovieModal, SkeletonCard };

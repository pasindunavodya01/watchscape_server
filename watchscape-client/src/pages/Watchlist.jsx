import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { API } from "../config";
import toast from 'react-hot-toast';
import {
  BookmarkIcon, FilmIcon, EyeIcon, TrashIcon,
  StarIcon, XMarkIcon, InformationCircleIcon
} from "@heroicons/react/24/outline";

const genreMap = {
  28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",
  18:"Drama",10751:"Family",14:"Fantasy",36:"History",27:"Horror",
  10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",
  10770:"TV Movie",53:"Thriller",10752:"War",37:"Western"
};

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-200 animate-pulse">
      <div className="aspect-[2/3] skeleton-light" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 skeleton-light rounded" />
        <div className="h-3 skeleton-light rounded w-2/3" />
        <div className="h-7 skeleton-light rounded-lg" />
        <div className="h-7 skeleton-light rounded-lg" />
      </div>
    </div>
  );
}

function MovieModal({ movie, onClose, onMarkWatched, onRemove }) {
  if (!movie) return null;
  const posterPath = movie.posterPath;
  const backdropPath = movie.backdropPath;
  const rating = movie.vote_average;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-dark-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-40 sm:h-48">
          {backdropPath
            ? <img src={`https://image.tmdb.org/t/p/w780${backdropPath}`} alt={movie.title} className="w-full h-full object-cover" />
            : <div className="h-full bg-gradient-to-br from-violet-900 to-slate-900" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
          {rating > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <StarIcon className="w-3.5 h-3.5 fill-white stroke-none" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(92vh-10rem)]">
          <div className="flex gap-4">
            {posterPath
              ? <img src={`https://image.tmdb.org/t/p/w300${posterPath}`} alt={movie.title} className="w-20 sm:w-28 object-cover rounded-xl shadow-dark flex-shrink-0 -mt-12 sm:-mt-16 ring-2 ring-slate-800" />
              : <div className="w-20 sm:w-28 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 -mt-12 ring-2 ring-slate-800 min-h-[7rem]"><FilmIcon className="w-8 h-8 text-slate-600" /></div>
            }
            <div className="flex-1 min-w-0 pt-2">
              <h2 className="text-xl font-bold text-white leading-tight mb-1">{movie.title}</h2>
              {movie.releaseDate && <p className="text-slate-400 text-sm">{new Date(movie.releaseDate).getFullYear()}</p>}
            </div>
          </div>
          {movie.overview && <p className="mt-4 text-slate-400 text-sm leading-relaxed">{movie.overview}</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={onMarkWatched} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all">
              <EyeIcon className="w-4 h-4" /> Mark Watched
            </button>
            <button onClick={onRemove} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-sm font-semibold rounded-xl border border-rose-500/30 transition-all">
              <TrashIcon className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Watchlist({ user, onMovieChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [hasMore, setHasMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchMovies = async (pageNum = 1) => {
    if (!user?.uid || user?.isGuest) { setMovies([]); setLoading(false); return; }
    if (pageNum === 1) setLoading(true);
    try {
      const res = await fetch(`${API}/api/movies?userId=${user.uid}&status=watchlist&page=${pageNum}&limit=${limit}`);
      const data = await res.json();
      const xTotal = res.headers.get("X-Total-Count");
      if (xTotal !== null) setTotalCount(parseInt(xTotal, 10));
      if (pageNum === 1) setMovies(Array.isArray(data) ? data : []);
      else setMovies(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
      setHasMore(Array.isArray(data) ? data.length === limit : false);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchMovies(1); }, [user]);

  const loadMore = () => { const next = page + 1; setPage(next); fetchMovies(next); };

  const removeMovie = async (id, closeModal = false) => {
    const movieToRemove = movies.find(m => m._id === id);
    try {
      const res = await fetch(`${API}/api/movies/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (movieToRemove) {
          try {
            const postsRes = await fetch(`${API}/api/posts`);
            const allPosts = await postsRes.json();
            const ap = allPosts.find(p => p.userId === user.uid && p.type === "movie_activity" && p.movieActivity?.action === "watchlist" && String(p.movieActivity?.movie?.tmdbId) === String(movieToRemove.tmdbId));
            if (ap) await fetch(`${API}/api/posts/${ap._id}`, { method: "DELETE" });
          } catch(e) { console.error(e); }
        }
        setMovies(prev => prev.filter(m => m._id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
        onMovieChange?.();
        toast.success('Removed from watchlist');
        if (closeModal) setSelectedMovie(null);
      } else { toast.error("Failed to remove movie"); }
    } catch { toast.error("Error removing movie"); }
  };

  const markAsWatched = async (movie) => {
    const loadingToast = toast.loading('Marking as watched...');
    try {
      const res = await fetch(`${API}/api/posts/movie-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, title: movie.title, posterPath: movie.posterPath, releaseDate: movie.releaseDate, overview: movie.overview || '', userId: user.uid, status: "watched" }),
      });
      if (res.ok || (await res.json()).message === 'Movie already in this list') {
        await fetch(`${API}/api/movies/${movie._id}`, { method: "DELETE" });
        try {
          const postsRes = await fetch(`${API}/api/posts`);
          const allPosts = await postsRes.json();
          const ap = allPosts.find(p => p.userId === user.uid && p.type === "movie_activity" && p.movieActivity?.action === "watchlist" && String(p.movieActivity?.movie?.tmdbId) === String(movie.tmdbId));
          if (ap) await fetch(`${API}/api/posts/${ap._id}`, { method: "DELETE" });
        } catch(e) { console.error(e); }
        setMovies(prev => prev.filter(m => m._id !== movie._id));
        setTotalCount(prev => Math.max(0, prev - 1));
        onMovieChange?.();
        toast.dismiss(loadingToast);
        toast.success('Marked as watched! 🎬');
        setSelectedMovie(null);
      } else {
        toast.dismiss(loadingToast);
        toast.error("Failed to mark as watched");
      }
    } catch { toast.dismiss(loadingToast); toast.error("Error updating movie"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookmarkIcon className="w-6 h-6 text-violet-600" />
            My Watchlist
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {totalCount > 0 ? `${totalCount} movies saved` : 'Movies you want to watch'}
          </p>
        </div>
      </div>

      {/* Guest prompt */}
      {(!user?.uid || user?.isGuest) && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 text-center mb-6 animate-fade-in">
          <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookmarkIcon className="w-7 h-7 text-violet-600" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Sign in to view your watchlist</h3>
          <p className="text-slate-500 text-sm mb-4">Keep track of movies you want to watch.</p>
          <button
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Log in
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : movies.length === 0 && user?.uid && !user?.isGuest ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <BookmarkIcon className="w-12 h-12 text-violet-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Your watchlist is empty</h3>
          <p className="text-slate-400 text-sm mb-6">Search for movies and add them here.</p>
          <button
            onClick={() => navigate('/dashboard/search')}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all inline-flex items-center gap-2"
          >
            <FilmIcon className="w-4 h-4" />
            Discover movies
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => {
              const posterPath = movie.posterPath;
              const rating = movie.vote_average;
              const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
              return (
                <div key={movie._id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="relative aspect-[2/3] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedMovie(movie)}>
                    {posterPath
                      ? <img src={`https://image.tmdb.org/t/p/w400${posterPath}`} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center"><FilmIcon className="w-12 h-12 text-slate-400" /></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                      <button className="flex items-center gap-1.5 text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                        <InformationCircleIcon className="w-3.5 h-3.5" /> Details
                      </button>
                    </div>
                    {rating > 0 && (
                      <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        <StarIcon className="w-3 h-3 fill-white stroke-none" />{rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug mb-1">{movie.title}</h3>
                    {year && <p className="text-xs text-slate-400 mb-3">{year}</p>}
                    <div className="space-y-1.5">
                      <button onClick={() => markAsWatched(movie)} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors">
                        <EyeIcon className="w-3.5 h-3.5" /> Watched
                      </button>
                      <button onClick={() => removeMovie(movie._id)} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-lg transition-colors">
                        <TrashIcon className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button onClick={loadMore} disabled={loading} className="px-6 py-2.5 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-xl text-violet-600 font-medium text-sm transition-all disabled:opacity-50">
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onMarkWatched={() => markAsWatched(selectedMovie)}
          onRemove={() => removeMovie(selectedMovie._id, true)}
        />
      )}
    </div>
  );
}
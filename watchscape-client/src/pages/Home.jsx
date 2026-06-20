import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileLink from "../components/ProfileLink";
import {
  HeartIcon as HeartOutline,
  ChatBubbleLeftIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  FilmIcon,
  UserIcon,
  PlusIcon,
  XMarkIcon,
  BookmarkIcon,
  EyeIcon,
  PencilSquareIcon,
  StarIcon,
  InformationCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { API } from "../config";
import toast from "react-hot-toast";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const genreMap = {
  28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",
  18:"Drama",10751:"Family",14:"Fantasy",36:"History",27:"Horror",
  10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",
  10770:"TV Movie",53:"Thriller",10752:"War",37:"Western",
};

// ─── Dark cinematic movie modal (reused everywhere) ───────────────────────
function MovieModal({ movie, onClose, onAdd }) {
  if (!movie) return null;
  const posterPath = movie.poster_path || movie.posterPath;
  const backdropPath = movie.backdrop_path || movie.backdropPath;
  const releaseDate = movie.release_date || movie.releaseDate;
  const rating = movie.vote_average;
  const genreIds = movie.genre_ids;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-dark-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop */}
        <div className="relative h-40 sm:h-52 flex-shrink-0 bg-slate-950">
          {backdropPath ? (
            <img src={`https://image.tmdb.org/t/p/w780${backdropPath}`} alt={movie.title} className="w-full h-full object-cover" />
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
          <div className="flex gap-4">
            {posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${posterPath}`}
                alt={movie.title}
                className="w-20 sm:w-28 aspect-[2/3] object-contain bg-slate-800 rounded-xl shadow-dark flex-shrink-0 relative z-10 -mt-14 sm:-mt-16 ring-2 ring-slate-800"
              />
            ) : (
              <div className="w-20 sm:w-28 aspect-[2/3] bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 -mt-14 sm:-mt-16 ring-2 ring-slate-800">
                <FilmIcon className="w-8 h-8 text-slate-600" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-2">
              <h2 className="text-xl font-bold text-white leading-tight mb-1">{movie.title}</h2>
              {releaseDate && <p className="text-slate-400 text-sm">{new Date(releaseDate).getFullYear()}</p>}
              {genreIds && genreIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {genreIds.slice(0, 3).map((id) => genreMap[id] && (
                    <span key={id} className="px-2 py-0.5 bg-violet-600/20 text-violet-300 text-xs rounded-full border border-violet-600/30">
                      {genreMap[id]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {movie.overview && (
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">{movie.overview}</p>
          )}

          {onAdd && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => onAdd(movie, "watchlist")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <BookmarkIcon className="w-4 h-4" /> Watchlist
              </button>
              <button
                onClick={() => onAdd(movie, "watched")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <EyeIcon className="w-4 h-4" /> Watched
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton post loader ──────────────────────────────────────────────────
function SkeletonPost() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full skeleton-light flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 skeleton-light rounded w-1/3" />
          <div className="h-3 skeleton-light rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 skeleton-light rounded w-full" />
        <div className="h-4 skeleton-light rounded w-5/6" />
        <div className="h-4 skeleton-light rounded w-3/4" />
      </div>
    </div>
  );
}

// ─── Time helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Comment input ────────────────────────────────────────────────────────
function CommentInput({ myProfilePic, user, onSubmit }) {
  const [text, setText] = useState("");
  return (
    <div className="px-4 pb-4 border-t border-slate-100">
      <div className="flex gap-2.5 mt-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500">
          {myProfilePic ? (
            <img src={myProfilePic} alt={user?.name || "You"} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none bg-slate-50 text-slate-800 placeholder-slate-400"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) {
                onSubmit(text, () => setText(""));
              }
            }}
          />
          <button
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-500 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => onSubmit(text, () => setText(""))}
            disabled={!text.trim()}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comments list ────────────────────────────────────────────────────────
function CommentsList({ comments, myProfilePic, user, onSubmit, onClose }) {
  const sorted = useMemo(
    () => [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [comments]
  );
  return (
    <div className="border-t border-slate-100">
      <div className="px-4 py-3 max-h-60 overflow-y-auto space-y-3">
        {sorted.map((c, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500">
              {c.userProfilePic ? (
                <img src={c.userProfilePic} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <ProfileLink uid={c.userId} className="font-semibold text-violet-600 hover:text-violet-500 transition-colors">
                  {c.userName}
                </ProfileLink>{" "}
                {c.text}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
        ))}
        {sorted.length > 1 && (
          <button className="text-xs text-slate-400 hover:text-violet-600 font-medium transition-colors" onClick={onClose}>
            Hide comments
          </button>
        )}
      </div>
      <CommentInput myProfilePic={myProfilePic} user={user} onSubmit={onSubmit} />
    </div>
  );
}

// ─── Action bar (like / comment / share) ──────────────────────────────────
function ActionBar({ post, currentUid, onToggleLike, onToggleComments, onShare, showShare = true }) {
  const liked = post.likes?.includes(currentUid);
  return (
    <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-5">
      <button
        className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-150 ${liked ? "text-rose-500" : "text-slate-500 hover:text-rose-500"}`}
        onClick={onToggleLike}
      >
        {liked ? <HeartSolid className="w-5 h-5" /> : <HeartOutline className="w-5 h-5" />}
        {post.likes?.length || 0}
      </button>
      <button
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors"
        onClick={onToggleComments}
      >
        <ChatBubbleLeftIcon className="w-5 h-5" />
        {post.comments?.length || 0}
      </button>
      {showShare && (
        <button
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          onClick={onShare}
        >
          <ShareIcon className="w-5 h-5" />
          Share
        </button>
      )}
    </div>
  );
}

// ─── Post header ──────────────────────────────────────────────────────────
function PostHeader({ post }) {
  return (
    <div className="p-4 pb-2 flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
        {post.userProfilePic ? (
          <img src={post.userProfilePic} alt="Author" className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <ProfileLink uid={post.userId} className="font-semibold text-slate-800 hover:text-violet-600 transition-colors block truncate">
          {post.userName || post.username || post.userId}
        </ProfileLink>
        <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
      </div>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────
function PostCard({ post, currentUid, onAddMovie, onToggleLike, onAddComment, onShare, user, myProfilePic, onMovieClick }) {
  const [showComments, setShowComments] = useState(false);
  const comments = post.comments || [];
  const commentsSorted = useMemo(() => [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [comments]);
  const latestComment = commentsSorted[0];

  const handleMovieClick = () => {
    if (!post.movie) return;
    onMovieClick({
      id: post.movie.tmdbId,
      title: post.movie.title,
      poster_path: post.movie.posterPath,
      release_date: post.movie.releaseDate,
      overview: post.movie.overview,
      backdrop_path: post.movie.backdropPath,
      genre_ids: post.movie.genre_ids,
      vote_average: post.movie.vote_average,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <PostHeader post={post} />

      {/* Text */}
      {post.text && (
        <div className="px-4 pb-3">
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">{post.text}</p>
        </div>
      )}

      {/* Attached movie */}
      {post.movie && (
        <div className="relative mx-4 mb-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer group" onClick={handleMovieClick}>
          {post.movie.posterPath ? (
            <div className="flex justify-center bg-slate-900">
              <img
                src={`https://image.tmdb.org/t/p/w400${post.movie.posterPath}`}
                alt={post.movie.title}
                className="h-56 object-contain"
              />
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-slate-200">
              <FilmIcon className="w-12 h-12 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <InformationCircleIcon className="w-3.5 h-3.5" /> View details
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-sm font-semibold text-slate-800 truncate">{post.movie.title}</p>
            {post.movie.releaseDate && (
              <p className="text-xs text-slate-400">{new Date(post.movie.releaseDate).getFullYear()}</p>
            )}
          </div>
        </div>
      )}

      <ActionBar
        post={post}
        currentUid={currentUid}
        onToggleLike={onToggleLike}
        onToggleComments={() => setShowComments((s) => !s)}
        onShare={onShare}
      />

      {/* Latest comment preview */}
      {latestComment && !showComments && (
        <div className="px-4 pb-3">
          <p className="text-sm text-slate-700">
            <ProfileLink uid={latestComment.userId} className="font-semibold text-violet-600 hover:text-violet-500 transition-colors">
              {latestComment.userName}
            </ProfileLink>{" "}
            {latestComment.text}
          </p>
          {comments.length > 1 && (
            <button className="text-xs text-slate-400 hover:text-violet-600 mt-0.5 transition-colors" onClick={() => setShowComments(true)}>
              View all {comments.length} comments
            </button>
          )}
        </div>
      )}

      {showComments && (
        <CommentsList
          comments={comments}
          myProfilePic={myProfilePic}
          user={user}
          onSubmit={onAddComment}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}

// ─── MovieActivityCard ────────────────────────────────────────────────────
function MovieActivityCard({ post, currentUid, onAddMovie, onToggleLike, onAddComment, onShare, user, myProfilePic, onMovieClick }) {
  const [showComments, setShowComments] = useState(false);
  const comments = post.comments || [];
  const commentsSorted = useMemo(() => [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [comments]);
  const latestComment = commentsSorted[0];

  const action = post.movieActivity?.action;
  const movie = post.movieActivity?.movie;
  const isWatched = action === "watched";

  const handleMovieClick = () => {
    if (!movie) return;
    onMovieClick({
      id: movie.tmdbId,
      title: movie.title,
      poster_path: movie.posterPath,
      release_date: movie.releaseDate,
      overview: movie.overview,
      backdrop_path: movie.backdropPath,
      genre_ids: movie.genre_ids,
      vote_average: movie.vote_average,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
          {post.userProfilePic ? (
            <img src={post.userProfilePic} alt="Author" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700">
            <ProfileLink uid={post.userId} className="font-semibold text-slate-800 hover:text-violet-600 transition-colors">
              {post.userName || post.username || post.userId}
            </ProfileLink>{" "}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isWatched ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>
              {isWatched ? <EyeIcon className="w-3 h-3" /> : <BookmarkIcon className="w-3 h-3" />}
              {isWatched ? "watched" : "added to watchlist"}
            </span>
          </p>
          <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Movie block */}
      {movie && (
        <div
          className="mx-4 mb-3 rounded-xl overflow-hidden border border-slate-200 flex gap-3 cursor-pointer group hover:border-slate-300 transition-colors"
          onClick={handleMovieClick}
        >
          {movie.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w200${movie.posterPath}`}
              alt={movie.title}
              className="w-20 flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-20 flex-shrink-0 bg-slate-200 flex items-center justify-center">
              <FilmIcon className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{movie.title}</h3>
            {movie.releaseDate && (
              <p className="text-xs text-slate-400 mt-1">{new Date(movie.releaseDate).getFullYear()}</p>
            )}
            {movie.overview && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{movie.overview}</p>
            )}
            <div className="flex gap-2 mt-2.5">
              <button
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                onClick={(e) => { e.stopPropagation(); onAddMovie(movie, "watchlist"); }}
              >
                <BookmarkIcon className="w-3 h-3" /> Watchlist
              </button>
              <button
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                onClick={(e) => { e.stopPropagation(); onAddMovie(movie, "watched"); }}
              >
                <EyeIcon className="w-3 h-3" /> Watched
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionBar
        post={post}
        currentUid={currentUid}
        onToggleLike={onToggleLike}
        onToggleComments={() => setShowComments((s) => !s)}
        onShare={onShare}
        showShare={true}
      />

      {latestComment && !showComments && (
        <div className="px-4 pb-3">
          <p className="text-sm text-slate-700">
            <ProfileLink uid={latestComment.userId} className="font-semibold text-violet-600 hover:text-violet-500 transition-colors">
              {latestComment.userName}
            </ProfileLink>{" "}
            {latestComment.text}
          </p>
          {comments.length > 1 && (
            <button className="text-xs text-slate-400 hover:text-violet-600 mt-0.5 transition-colors" onClick={() => setShowComments(true)}>
              View all {comments.length} comments
            </button>
          )}
        </div>
      )}

      {showComments && (
        <CommentsList
          comments={comments}
          myProfilePic={myProfilePic}
          user={user}
          onSubmit={onAddComment}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}

// ─── Search People Modal ──────────────────────────────────────────────────
function SearchPeopleModal({ onClose, currentUid, following = [], onToggleFollow }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const search = async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/users?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (active) setResults(data);
      } catch (e) { console.error(e); }
      finally { if (active) setLoading(false); }
    };
    const t = setTimeout(search, 300);
    return () => { active = false; clearTimeout(t); };
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-dark-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-violet-500" />
            Search People
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            results.map((u) => {
              if (u.uid === currentUid) return null;
              const isFollowing = following.includes(u.uid);
              return (
                <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-slate-800/40 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 cursor-pointer min-w-0 flex-1" onClick={() => { navigate(`/dashboard/profile/${u.uid}`); onClose(); }}>
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.profilePic ? (
                        <img src={u.profilePic} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{u.name || u.email}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleFollow(u.uid)}
                    className={`ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isFollowing
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        : "bg-violet-600 text-white hover:bg-violet-500"
                    }`}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                </div>
              );
            })
          ) : query.trim() ? (
            <p className="text-center text-sm text-slate-500 py-8">No matching people found</p>
          ) : (
            <p className="text-center text-sm text-slate-500 py-8">Type a name to begin searching</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────
export default function Home({ user, onMovieChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedMode, setFeedMode] = useState("following"); // "following" | "discover"

  // people search
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const [myDbUser, setMyDbUser] = useState(null);

  // composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [myProfilePic, setMyProfilePic] = useState(null);
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState([]);
  const [movieLoading, setMovieLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // movie search panel
  const [globalMovieQuery, setGlobalMovieQuery] = useState("");
  const [globalMovieResults, setGlobalMovieResults] = useState([]);
  const [globalMovieLoading, setGlobalMovieLoading] = useState(false);
  const [activeModalMovie, setActiveModalMovie] = useState(null);

  useBodyScrollLock(!!activeModalMovie || !!showPeopleSearch);

  const postMoviePreviewUrl = useMemo(() => {
    const path = selectedMovie?.poster_path || selectedMovie?.posterPath;
    return path ? `https://image.tmdb.org/t/p/w200${path}` : null;
  }, [selectedMovie]);

  // ── fetch posts ──
  const fetchPosts = useCallback(async (pageNum = 1, mode = feedMode) => {
    if (pageNum === 1) setPostsLoading(true);
    try {
      let url;
      if (mode === "following" && user?.uid && !user?.isGuest) {
        url = `${API}/api/posts/feed?page=${pageNum}&limit=10&userId=${user.uid}`;
      } else {
        url = `${API}/api/posts?page=${pageNum}&limit=10`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (pageNum === 1) setPosts(data);
      else setPosts((prev) => [...prev, ...data]);
      setHasMore(data.length === 10);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setHasMore(false);
    } finally {
      setPostsLoading(false);
    }
  }, [feedMode, user]);

  useEffect(() => { fetchPosts(1); }, [feedMode, user?.uid]);

  useEffect(() => {
    let mounted = true;
    if (!user?.uid) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/users/${user.uid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setMyDbUser(data);
          if (data.profilePic) setMyProfilePic(data.profilePic);
        }
      } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
  }, [user]);

  const loadMorePosts = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  // ── add movie (watchlist/watched) ──
  const addMovie = async (movie, status) => {
    if (!user || user.isGuest) {
      toast.error("Sign in to add movies to your lists");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const loadingToast = toast.loading(`Adding to ${status}...`);
    try {
      const otherStatus = status === "watchlist" ? "watched" : "watchlist";
      const checkRes = await fetch(`${API}/api/movies?userId=${user.uid}&status=${otherStatus}`);
      if (checkRes.ok) {
        const otherList = await checkRes.json();
        const tmdbId = movie.id || movie.tmdbId;
        const existing = otherList.find((m) => String(m.tmdbId) === String(tmdbId));
        if (existing) {
          await fetch(`${API}/api/movies/${existing._id}`, { method: "DELETE" });
          try {
            const postsRes = await fetch(`${API}/api/posts`);
            const allPosts = await postsRes.json();
            const ap = allPosts.find(
              (p) => p.userId === user.uid && p.type === "movie_activity" && p.movieActivity?.action === otherStatus && String(p.movieActivity?.movie?.tmdbId) === String(tmdbId)
            );
            if (ap) await fetch(`${API}/api/posts/${ap._id}`, { method: "DELETE" });
          } catch (e) { console.error("Cleanup error:", e); }
        }
      }
      const tmdbId = movie.id || movie.tmdbId;
      const posterPath = movie.poster_path || movie.posterPath;
      const releaseDate = movie.release_date || movie.releaseDate;
      const res = await fetch(`${API}/api/posts/movie-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, title: movie.title, posterPath, releaseDate, overview: movie.overview || "", userId: user.uid, status }),
      });
      toast.dismiss(loadingToast);
      if (res.ok) {
        toast.success(`Added to ${status}! 🎬`);
        onMovieChange?.();
        fetchPosts(1);
        setPage(1);
      } else {
        const errData = await res.json();
        if (errData.message === "Movie already in this list") {
          toast.success(`Already in your ${status}`);
          onMovieChange?.();
        } else {
          toast.error(errData.message || "Failed to add movie");
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error adding movie");
    }
  };

  // ── create post ──
  const createPost = async () => {
    if (!text.trim()) return;
    if (!user || user.isGuest) {
      toast.error("Sign in to create posts");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const body = {
      userId: user.uid,
      text,
      movie: selectedMovie ? {
        tmdbId: (selectedMovie.id || selectedMovie.tmdbId)?.toString(),
        title: selectedMovie.title,
        posterPath: selectedMovie.poster_path || selectedMovie.posterPath || "",
        releaseDate: selectedMovie.release_date || selectedMovie.releaseDate || "",
        overview: selectedMovie.overview || "",
      } : undefined,
    };
    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create post");
      toast.success("Post created! ✨");
      setText(""); setSelectedMovie(null); setMovieQuery(""); setMovieResults([]); setComposerOpen(false);
      setPage(1); fetchPosts(1);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create post");
    }
  };

  const toggleLike = async (postId) => {
    if (!user || user.isGuest) {
      toast.error("Sign in to like posts");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    try {
      const res = await fetch(`${API}/api/posts/${postId}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!res.ok) throw new Error("Like failed");
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likes: data.likes } : p)));
    } catch (err) { console.error(err); }
  };

  const addComment = async (postId, commentText, clear) => {
    if (!commentText.trim()) return;
    if (!user || user.isGuest) {
      toast.error("Sign in to comment");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, text: commentText }),
      });
      if (!res.ok) throw new Error("Comment failed");
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: data.comments } : p)));
      clear?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to post comment");
    }
  };

  const toggleFollow = async (targetUid) => {
    if (!user || user.isGuest) {
      toast.error("Sign in to follow users");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    try {
      const res = await fetch(`${API}/api/users/${targetUid}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerUid: user.uid }),
      });
      if (res.ok) {
        setMyDbUser(prev => {
          if (!prev) return null;
          const isFollowing = prev.following?.includes(targetUid);
          return {
            ...prev,
            following: isFollowing
              ? prev.following.filter(uid => uid !== targetUid)
              : [...(prev.following || []), targetUid]
          };
        });
      }
      fetchPosts(1);
    } catch (err) { console.error(err); }
  };

  const sharePost = async (postId) => {
    if (!user || user.isGuest) {
      toast.error("Sign in to share posts");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    try {
      await fetch(`${API}/api/posts/${postId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      toast.success("Post shared!");
      fetchPosts(1);
    } catch (err) { console.error(err); }
  };

  // ── movie search (composer) ──
  const searchMovies = async () => {
    if (!movieQuery.trim()) return;
    setMovieLoading(true);
    try {
      const res = await fetch(`${API}/api/movies/search?q=${encodeURIComponent(movieQuery)}`);
      const data = await res.json();
      setMovieResults(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch (err) { console.error(err); }
    finally { setMovieLoading(false); }
  };

  // ── global movie search ──
  const searchGlobalMovies = async (e) => {
    e?.preventDefault();
    if (!globalMovieQuery.trim()) return;
    setGlobalMovieLoading(true);
    try {
      const res = await fetch(`${API}/api/movies/search?q=${encodeURIComponent(globalMovieQuery)}`);
      const data = await res.json();
      setGlobalMovieResults(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setGlobalMovieLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* ── Feed Header with Search People ── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Home Feed</h1>
          <p className="text-xs text-slate-400">
            {feedMode === "following" ? "Posts from people you follow" : "Discover posts from everyone"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && !user.isGuest && (
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              <button
                onClick={() => { setFeedMode("following"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  feedMode === "following"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Following
              </button>
              <button
                onClick={() => { setFeedMode("discover"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  feedMode === "discover"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Discover
              </button>
            </div>
          )}
          <button
            onClick={() => setShowPeopleSearch(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold text-violet-600 shadow-sm"
            title="Search People"
          >
            <UserPlusIcon className="w-3.5 h-3.5" />
            <span>Find People</span>
          </button>
        </div>
      </div>

      {/* ── Composer ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {!composerOpen ? (
          <div
            className="p-4 cursor-text hover:bg-slate-50 transition-colors"
            onClick={() => {
              if (!user || user.isGuest) {
                toast.error("Sign in to create posts");
                navigate("/login", { state: { from: location.pathname } });
                return;
              }
              setComposerOpen(true);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex-shrink-0">
                {myProfilePic ? (
                  <img src={myProfilePic} alt={user?.name || "You"} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 py-2.5 px-4 bg-slate-100 rounded-full text-slate-400 text-sm">
                What's on your mind?
              </div>
              <PencilSquareIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Movie search in composer */}
            <div className="mb-4 pb-4 border-b border-slate-100">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none bg-slate-50 text-slate-800 placeholder-slate-400"
                    placeholder="Attach a movie..."
                    value={movieQuery}
                    onChange={(e) => setMovieQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchMovies())}
                  />
                  {movieQuery && (
                    <button
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => { setMovieQuery(""); setMovieResults([]); }}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={searchMovies}
                  disabled={movieLoading || !movieQuery.trim()}
                  className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-500 disabled:opacity-40 transition-colors"
                >
                  {movieLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Find"}
                </button>
              </div>

              {/* Movie results grid */}
              {movieResults.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {movieResults.map((m) => (
                    <button
                      key={m.id}
                      className="group text-left border border-slate-200 rounded-xl overflow-hidden hover:border-violet-400 transition-all"
                      onClick={() => { setSelectedMovie({ id: m.id, title: m.title, poster_path: m.poster_path || "" }); setMovieResults([]); setMovieQuery(m.title); }}
                    >
                      {m.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} alt={m.title} className="w-full aspect-[2/3] object-cover" />
                      ) : (
                        <div className="w-full aspect-[2/3] flex items-center justify-center bg-slate-100">
                          <FilmIcon className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="p-1.5">
                        <div className="text-xs font-medium text-slate-700 line-clamp-2 leading-tight">{m.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected movie preview */}
              {selectedMovie && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-200">
                  {postMoviePreviewUrl ? (
                    <img src={postMoviePreviewUrl} alt={selectedMovie.title} className="w-12 h-18 object-cover rounded-lg shadow-sm flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-18 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FilmIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{selectedMovie.title}</p>
                    <p className="text-xs text-violet-500 mt-0.5">Attached to post</p>
                  </div>
                  <button className="text-slate-400 hover:text-rose-500 transition-colors p-1" onClick={() => setSelectedMovie(null)}>
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Text area */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex-shrink-0">
                {myProfilePic ? (
                  <img src={myProfilePic} alt={user?.name || "You"} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <textarea
                className="flex-1 border border-slate-200 rounded-xl p-3 resize-none text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none bg-slate-50 text-slate-800 placeholder-slate-400"
                rows={3}
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                onClick={() => { setComposerOpen(false); setText(""); setSelectedMovie(null); setMovieResults([]); setMovieQuery(""); }}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={createPost}
                disabled={!text.trim()}
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Global Movie Search ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MagnifyingGlassIcon className="w-4 h-4 text-violet-600" />
          Search &amp; add movies
        </h2>
        <form onSubmit={searchGlobalMovies} className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search movies..."
              value={globalMovieQuery}
              onChange={(e) => setGlobalMovieQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none bg-slate-50 text-slate-800 placeholder-slate-400"
            />
            {globalMovieQuery && (
              <button
                type="button"
                onClick={() => { setGlobalMovieQuery(""); setGlobalMovieResults([]); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={globalMovieLoading || !globalMovieQuery.trim()}
            className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-500 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {globalMovieLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Global results */}
        {!globalMovieLoading && globalMovieResults.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {globalMovieResults.map((movie) => (
              <div key={movie.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div
                  className="relative aspect-[2/3] bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => setActiveModalMovie(movie)}
                >
                  {movie.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <FilmIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  {movie.vote_average > 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <StarIcon className="w-2.5 h-2.5 fill-white stroke-none" />
                      {movie.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-tight mb-2">{movie.title}</p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => addMovie(movie, "watchlist")}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <BookmarkIcon className="w-3.5 h-3.5" /> Watchlist
                    </button>
                    <button
                      onClick={() => addMovie(movie, "watched")}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <EyeIcon className="w-3.5 h-3.5" /> Watched
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Feed ── */}
      <div className="space-y-4">
        {postsLoading && page === 1 ? (
          <>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {feedMode === "following" ? (
                <UserPlusIcon className="w-8 h-8 text-violet-300" />
              ) : (
                <ChatBubbleLeftIcon className="w-8 h-8 text-violet-300" />
              )}
            </div>
            <p className="text-lg font-semibold text-slate-700">
              {feedMode === "following" ? "No posts from your circle yet" : "No posts yet"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {feedMode === "following"
                ? "Follow people to see their posts here, or switch to Discover!"
                : "Start sharing your movie thoughts!"}
            </p>
            {feedMode === "following" && (
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowPeopleSearch(true)}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-500 transition-colors flex items-center gap-1.5"
                >
                  <UserPlusIcon className="w-4 h-4" /> Find People
                </button>
                <button
                  onClick={() => { setFeedMode("discover"); setPage(1); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Discover
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {posts.map((p) =>
              p.type === "movie_activity" ? (
                <MovieActivityCard
                  key={p._id}
                  post={p}
                  currentUid={user?.uid}
                  user={user}
                  myProfilePic={myProfilePic}
                  onAddMovie={addMovie}
                  onToggleLike={() => toggleLike(p._id)}
                  onAddComment={(txt, clear) => addComment(p._id, txt, clear)}
                  onToggleFollow={() => toggleFollow(p.userId)}
                  onShare={() => sharePost(p._id)}
                  onMovieClick={setActiveModalMovie}
                />
              ) : (
                <PostCard
                  key={p._id}
                  post={p}
                  currentUid={user?.uid}
                  user={user}
                  myProfilePic={myProfilePic}
                  onAddMovie={addMovie}
                  onToggleLike={() => toggleLike(p._id)}
                  onAddComment={(txt, clear) => addComment(p._id, txt, clear)}
                  onToggleFollow={() => toggleFollow(p.userId)}
                  onShare={() => sharePost(p._id)}
                  onMovieClick={setActiveModalMovie}
                />
              )
            )}

            {hasMore && (
              <div className="text-center py-2">
                <button
                  onClick={loadMorePosts}
                  disabled={postsLoading}
                  className="px-6 py-2.5 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-xl text-violet-600 font-medium text-sm transition-all disabled:opacity-50"
                >
                  {postsLoading ? "Loading..." : "Load more posts"}
                </button>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">
                You've seen all the posts 🎬
              </div>
            )}
          </>
        )}
      </div>

      {/* Global/Feed movie modal */}
      {activeModalMovie && (
        <MovieModal
          movie={activeModalMovie}
          onClose={() => setActiveModalMovie(null)}
          onAdd={(mv, status) => { addMovie(mv, status); setActiveModalMovie(null); }}
        />
      )}

      {/* People search modal */}
      {showPeopleSearch && (
        <SearchPeopleModal
          currentUid={user?.uid}
          following={myDbUser?.following || []}
          onToggleFollow={toggleFollow}
          onClose={() => setShowPeopleSearch(false)}
        />
      )}
    </div>
  );
}
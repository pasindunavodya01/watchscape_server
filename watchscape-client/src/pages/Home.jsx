import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  HeartIcon as HeartOutline,
  ChatBubbleLeftIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  FilmIcon,
  UserIcon,
  PlusIcon,
  XMarkIcon,
  UserPlusIcon,
  PhotoIcon,
  PencilSquareIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  StarIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

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
  37: "Western",
};

const API = "https://patient-determination-production.up.railway.app";

export default function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // user search
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);
  const userSearchRef = useRef(null);

  // composer UI
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");

  // movie search
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState([]);
  const [movieLoading, setMovieLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // fetch posts
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch(`${API}/api/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // user search
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!userQuery.trim()) {
        setUserResults([]);
        return;
      }
      setUserSearching(true);
      try {
        const res = await fetch(`${API}/api/users?q=${encodeURIComponent(userQuery)}`);
        const data = await res.json();
        if (active) {
          setUserResults(data);
          setShowUserResults(true);
        }
      } catch (e) { console.error(e); } 
      finally { if (active) setUserSearching(false); }
    };
    const t = setTimeout(run, 300);
    return () => { active = false; clearTimeout(t); };
  }, [userQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) setShowUserResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // movie search
  const searchMovies = async () => {
    if (!movieQuery.trim()) return;
    setMovieLoading(true);
    try {
      const res = await fetch(`${API}/api/movies/search?q=${encodeURIComponent(movieQuery)}`);
      const data = await res.json();
      setMovieResults(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch (err) {
      console.error(err);
      setMovieResults([]);
    } finally { setMovieLoading(false); }
  };

  const postMoviePreviewUrl = useMemo(() => {
    if (!selectedMovie?.posterPath && !selectedMovie?.poster_path) return null;
    const path = selectedMovie.posterPath || selectedMovie.poster_path;
    return `https://image.tmdb.org/t/p/w300${path}`;
  }, [selectedMovie]);

  // actions
  const createPost = async () => {
    if (!text.trim()) return;
    const body = {
      userId: user.uid,
      text,
      movie: selectedMovie ? {
        tmdbId: selectedMovie.id?.toString?.() || selectedMovie.tmdbId,
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
      setText(""); setSelectedMovie(null); setMovieQuery(""); setMovieResults([]); setComposerOpen(false);
      fetchPosts();
    } catch (err) { console.error(err); alert(err.message || "Failed to create post"); }
  };

  const toggleLike = async (postId) => {
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
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, text: commentText }),
      });
      if (!res.ok) throw new Error("Comment failed");
      const data = await res.json();
      setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, comments: data.comments } : p));
      clear?.();
    } catch (err) { console.error(err); alert("Failed to post comment"); }
  };

  const toggleFollow = async (targetUid) => {
    try {
      await fetch(`${API}/api/users/${targetUid}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerUid: user.uid }),
      });
      fetchPosts();
    } catch (err) { console.error(err); }
  };

  const sharePost = async (postId) => {
    try {
      await fetch(`${API}/api/posts/${postId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      fetchPosts();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
          <div className="relative w-full md:w-96" ref={userSearchRef}>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Search users by name or email..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onFocus={() => setShowUserResults(true)}
              />
            </div>
            {showUserResults && userQuery && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full max-h-64 overflow-auto shadow-lg">
                {userSearching && (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                )}
                {!userSearching && userResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
                )}
                {userResults.map((u) => (
                  <Link
                    key={u.uid}
                    to={`/dashboard/profile/${u.uid}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserResults(false)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="font-medium text-gray-900">{u.name || u.username || "Unknown"}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {!composerOpen ? (
          <div 
            className="p-6 cursor-text hover:bg-gray-50 transition-colors"
            onClick={() => setComposerOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 py-3 px-4 bg-gray-100 rounded-full text-gray-500">
                Write something ...
              </div>
              <PencilSquareIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <textarea
                className="flex-1 border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                rows={3}
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

           {/* Movie Search */}
<div className="mb-4">
  <div className="flex gap-3 mb-3">
    <div className="flex-1 relative">
      <input
        className="w-full px-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        placeholder="Search a movie..."
        value={movieQuery}
        onChange={(e) => setMovieQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchMovies())}
      />
    </div>
    <button
      onClick={searchMovies}
      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
      disabled={movieLoading}
    >
      {movieLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <MagnifyingGlassIcon className="w-4 h-4" />
      )}
      {movieLoading ? "Searching..." : "Find"}
    </button>
  </div>


              {movieResults.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-3">Search Results:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {movieResults.map((m) => (
                      <button
                        key={m.id}
                        className="group text-left border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-purple-300 transition-all"
                        onClick={() => {
                          setSelectedMovie({ id: m.id, title: m.title, poster_path: m.poster_path || "" });
                          setMovieResults([]); setMovieQuery(m.title);
                        }}
                      >
                        {m.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} 
                            alt={m.title} 
                            className="w-full aspect-[2/3] object-cover" 
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] flex items-center justify-center bg-gray-100 text-gray-400">
                            <FilmIcon className="w-8 h-8" />
                          </div>
                        )}
                        <div className="p-2">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">{m.title}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMovie && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {postMoviePreviewUrl ? (
                      <img 
                        src={postMoviePreviewUrl} 
                        alt={selectedMovie.title} 
                        className="w-16 h-24 object-cover rounded-lg shadow-sm" 
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FilmIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{selectedMovie.title}</div>
                      <button 
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 mt-2 transition-colors" 
                        onClick={() => setSelectedMovie(null)}
                      >
                        <XMarkIcon className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => { 
                  setComposerOpen(false); 
                  setText(""); 
                  setSelectedMovie(null); 
                  setMovieResults([]); 
                  setMovieQuery(""); 
                }}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={createPost}
                disabled={!text.trim()}
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {postsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No posts yet</p>
            <p className="text-gray-400 mt-1">Start sharing your movie thoughts!</p>
          </div>
        ) : (
          posts.map((p) => (
            p.type === 'movie_activity' ? (
              <MovieActivityCard
                key={p._id}
                post={p}
                currentUid={user.uid}
                onToggleLike={() => toggleLike(p._id)}
                onAddComment={(txt, clear) => addComment(p._id, txt, clear)}
                onToggleFollow={() => toggleFollow(p.userId)}
                onShare={() => sharePost(p._id)}
              />
            ) : (
              <PostCard
                key={p._id}
                post={p}
                currentUid={user.uid}
                onToggleLike={() => toggleLike(p._id)}
                onAddComment={(txt, clear) => addComment(p._id, txt, clear)}
                onToggleFollow={() => toggleFollow(p.userId)}
                onShare={() => sharePost(p._id)}
              />
            )
          ))
        )}
      </div>
    </div>
  );
}

// POST CARD
function PostCard({ post, currentUid, onToggleLike, onAddComment, onToggleFollow, onShare }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedPostMovie, setSelectedPostMovie] = useState(null);

  const liked = post.likes?.includes(currentUid);
  const comments = post.comments || [];
  const commentsSorted = useMemo(() => [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [comments]);
  const latestComment = commentsSorted[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <Link 
                to={`/dashboard/profile/${post.userId}`} 
                className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
              >
                {post.userName || post.username || post.userId}
              </Link>
              <p className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
         
        </div>
      </div>

      {/* Text */}
      {post.text && (
        <div className="px-4 pb-4">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.text}</p>
        </div>
      )}

      {/* Movie cover */}
      {post.movie && (
        <div className="relative bg-gray-50">
          {post.movie.posterPath ? (
          <div className="flex justify-center">
  <img
    src={`https://image.tmdb.org/t/p/original${post.movie.posterPath}`}
    alt={post.movie.title}
    className="w-64 sm:w-96 h-auto object-contain"
  />
</div>

          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
              <FilmIcon className="w-16 h-16" />
            </div>
          )}
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black bg-opacity-60 text-white flex items-center justify-center hover:bg-opacity-80 transition-all"
            title="View Movie Details"
    onClick={() =>
  setSelectedPostMovie({
    title: post.movie.title,
    posterPath: post.movie.posterPath,
    releaseDate: post.movie.releaseDate,
    overview: post.movie.overview,
    backdropPath: post.movie.backdropPath,
    genre_ids: post.movie.genre_ids,
    vote_average: post.movie.vote_average,
  })
}

          >
            <InformationCircleIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors group" 
              onClick={onToggleLike}
            >
              {liked ? 
                <HeartSolid className="w-5 h-5 text-red-500" /> : 
                <HeartOutline className="w-5 h-5 group-hover:text-red-500" />
              }
              <span className="text-sm font-medium">{post.likes?.length || 0}</span>
            </button>
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
              onClick={() => setShowComments(s => !s)}
            >
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments?.length || 0}</span>
            </button>
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              onClick={onShare}
            >
              <ShareIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Latest comment preview */}
      {latestComment && !showComments && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3">
            <p className="text-sm text-gray-800">
              <Link 
                to={`/dashboard/profile/${latestComment.userId}`} 
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                {latestComment.userName}
              </Link>
              {" "}{latestComment.text}
            </p>
            {comments.length > 1 && (
              <button 
                className="text-sm text-gray-500 hover:text-purple-600 mt-1 transition-colors" 
                onClick={() => setShowComments(true)}
              >
                View all {comments.length} comments
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full comments section */}
      {showComments && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-4 max-h-64 overflow-y-auto">
            <div className="space-y-3">
              {commentsSorted.map((c, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link 
                        to={`/dashboard/profile/${c.userId}`} 
                        className="font-semibold text-purple-600 hover:text-purple-700"
                      >
                        {c.userName}
                      </Link>
                      {" "}{c.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(c.createdAt).toLocaleDateString()} • {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="flex gap-3 mt-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onAddComment(commentText, () => setCommentText(""))}
                />
                <button 
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={() => onAddComment(commentText, () => setCommentText(""))}
                  disabled={!commentText.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Movie Modal */}
      {selectedPostMovie && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50"
          onClick={() => setSelectedPostMovie(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative">
              {(selectedPostMovie.backdrop_path || selectedPostMovie.backdropPath) ? (
                <div className="relative h-48 bg-gradient-to-t from-black/60 to-transparent">
                  <img
                    src={`https://image.tmdb.org/t/p/w780${selectedPostMovie.backdrop_path || selectedPostMovie.backdropPath}`}
                    alt={selectedPostMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-purple-600 to-blue-600"></div>
              )}
              
              <button
                onClick={() => setSelectedPostMovie(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              <div className="flex gap-6 mb-6">
                {/* Poster */}
                {(selectedPostMovie.posterPath || selectedPostMovie.poster_path) ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedPostMovie.posterPath || selectedPostMovie.poster_path}`}
                    alt={selectedPostMovie.title}
                    className="w-32 h-48 object-cover rounded-xl shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-32 h-48 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FilmIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {/* Movie Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{selectedPostMovie.title}</h3>
                  <p className="text-gray-600 mb-2">
                    {selectedPostMovie.releaseDate ? new Date(selectedPostMovie.releaseDate).toDateString() : "N/A"}
                  </p>
                  {selectedPostMovie.genre_ids && selectedPostMovie.genre_ids.length > 0 && (
                    <p className="text-gray-600 mb-2">
                      Genres: {selectedPostMovie.genre_ids.map(id => genreMap[id]).join(", ") || "N/A"}
                    </p>
                  )}
                  <p className="text-gray-700">{selectedPostMovie.overview || "No description available."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// MOVIE ACTIVITY CARD
function MovieActivityCard({ post, currentUid, onToggleLike, onAddComment, onToggleFollow, onShare }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedPostMovie, setSelectedPostMovie] = useState(null);

  const liked = post.likes?.includes(currentUid);
  const comments = post.comments || [];
  const commentsSorted = useMemo(() => [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [comments]);
  const latestComment = commentsSorted[0];
  
  const actionText = post.movieActivity.action === 'watchlist' 
    ? 'added to their watchlist' 
    : 'watched';
  
  const actionIcon = post.movieActivity.action === 'watchlist' 
    ? <PlusIcon className="w-4 h-4" />
    : <FilmIcon className="w-4 h-4" />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  to={`/dashboard/profile/${post.userId}`} 
                  className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                >
                  {post.userName || post.username || post.userId}
                </Link>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  {actionIcon}
                  <span>{actionText}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
          
        </div>

        {/* Movie info */}
        {post.movieActivity.movie && (
          <div className="relative flex gap-4 p-4 bg-gray-50 rounded-lg">
            {post.movieActivity.movie.posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w200${post.movieActivity.movie.posterPath}`}
                alt={post.movieActivity.movie.title}
                className="w-20 h-30 object-cover rounded-lg shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-30 flex items-center justify-center bg-gray-200 text-gray-400 rounded-lg flex-shrink-0">
                <FilmIcon className="w-8 h-8" />
              </div>
            )}
            
            {/* Info Button - Added to Movie Activity Card */}
            <button
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black bg-opacity-60 text-white flex items-center justify-center hover:bg-opacity-80 transition-all"
              title="View Movie Details"
              onClick={() =>
                setSelectedPostMovie({
                  title: post.movieActivity.movie.title,
                  posterPath: post.movieActivity.movie.posterPath,
                  releaseDate: post.movieActivity.movie.releaseDate,
                  overview: post.movieActivity.movie.overview,
                  backdropPath: post.movieActivity.movie.backdropPath,
                  genre_ids: post.movieActivity.movie.genre_ids,
                  vote_average: post.movieActivity.movie.vote_average,
                })
              }
            >
              <InformationCircleIcon className="w-4 h-4" />
            </button>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg">{post.movieActivity.movie.title}</h3>
              {post.movieActivity.movie.releaseDate && (
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(post.movieActivity.movie.releaseDate).getFullYear()}
                </p>
              )}
              {post.movieActivity.movie.overview && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-3 leading-relaxed">{post.movieActivity.movie.overview}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors group" 
              onClick={onToggleLike}
            >
              {liked ? 
                <HeartSolid className="w-5 h-5 text-red-500" /> : 
                <HeartOutline className="w-5 h-5 group-hover:text-red-500" />
              }
              <span className="text-sm font-medium">{post.likes?.length || 0}</span>
            </button>
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
              onClick={() => setShowComments(s => !s)}
            >
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments?.length || 0}</span>
            </button>
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              onClick={onShare}
            >
              <ShareIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Latest comment preview */}
      {latestComment && !showComments && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3">
            <p className="text-sm text-gray-800">
              <Link 
                to={`/dashboard/profile/${latestComment.userId}`} 
                className="font-semibold text-purple-600 hover:text-purple-700"
              >
                {latestComment.userName}
              </Link>
              {" "}{latestComment.text}
            </p>
            {comments.length > 1 && (
              <button 
                className="text-sm text-gray-500 hover:text-purple-600 mt-1 transition-colors" 
                onClick={() => setShowComments(true)}
              >
                View all {comments.length} comments
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full comments section */}
      {showComments && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-4 max-h-64 overflow-y-auto">
            <div className="space-y-3">
              {commentsSorted.map((c, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link 
                        to={`/dashboard/profile/${c.userId}`} 
                        className="font-semibold text-purple-600 hover:text-purple-700"
                      >
                        {c.userName}
                      </Link>
                      {" "}{c.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(c.createdAt).toLocaleDateString()} • {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="flex gap-3 mt-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddComment(commentText, () => setCommentText(''))}
                />
                <button 
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={() => onAddComment(commentText, () => setCommentText(''))}
                  disabled={!commentText.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Movie Modal for Movie Activity Card */}
      {selectedPostMovie && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50"
          onClick={() => setSelectedPostMovie(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative">
              {(selectedPostMovie.backdrop_path || selectedPostMovie.backdropPath) ? (
                <div className="relative h-48 bg-gradient-to-t from-black/60 to-transparent">
                  <img
                    src={`https://image.tmdb.org/t/p/w780${selectedPostMovie.backdrop_path || selectedPostMovie.backdropPath}`}
                    alt={selectedPostMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-purple-600 to-blue-600"></div>
              )}
              
              <button
                onClick={() => setSelectedPostMovie(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              <div className="flex gap-6 mb-6">
                {/* Poster */}
                {(selectedPostMovie.posterPath || selectedPostMovie.poster_path) ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedPostMovie.posterPath || selectedPostMovie.poster_path}`}
                    alt={selectedPostMovie.title}
                    className="w-32 h-48 object-cover rounded-xl shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-32 h-48 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FilmIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {/* Movie Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{selectedPostMovie.title}</h3>
                  <p className="text-gray-600 mb-2">
                    {selectedPostMovie.releaseDate ? new Date(selectedPostMovie.releaseDate).toDateString() : "N/A"}
                  </p>
                  {selectedPostMovie.genre_ids && selectedPostMovie.genre_ids.length > 0 && (
                    <p className="text-gray-600 mb-2">
                      Genres: {selectedPostMovie.genre_ids.map(id => genreMap[id]).join(", ") || "N/A"}
                    </p>
                  )}
                  {selectedPostMovie.vote_average && (
                    <p className="text-gray-600 mb-2 flex items-center gap-1">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      {selectedPostMovie.vote_average.toFixed(1)}/10
                    </p>
                  )}
                  <p className="text-gray-700">{selectedPostMovie.overview || "No description available."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
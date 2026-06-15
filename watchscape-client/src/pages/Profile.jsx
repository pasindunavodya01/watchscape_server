import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import ProfileLink from "../components/ProfileLink";
import {
  UserIcon,
  FilmIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  UserMinusIcon,
  XMarkIcon,
  ChevronRightIcon,
  StarIcon,
  PlusIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { API } from "../config";

// Genre mapping for TMDB
const genreMap = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror",
  10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western"
};

const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
};

export default function Profile({ user }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // followers 
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Movie collections
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [totalWatchlist, setTotalWatchlist] = useState(0);
  const [totalWatched, setTotalWatched] = useState(0);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [watchedPage, setWatchedPage] = useState(1);
  const watchlistLimit = 6;
  const watchedLimit = 6;
  const [watchlistHasMore, setWatchlistHasMore] = useState(false);
  const [watchedHasMore, setWatchedHasMore] = useState(false);

  // posts fetched EXACTLY like Home, then filtered to this user
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const postsLimit = 6;
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postFilter, setPostFilter] = useState("all");

  // New states for interactions
  const [likingPosts, setLikingPosts] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [submittingComments, setSubmittingComments] = useState({});
  const [selectedPostMovie, setSelectedPostMovie] = useState(null);
  const [showFullProfilePic, setShowFullProfilePic] = useState(null);

  const fetchFollowers = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/api/users/${userId}/followers`);
      const data = await res.json();
      setFollowersList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchFollowing = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/api/users/${userId}/following`);
      const data = await res.json();
      setFollowingList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/users/${userId}/profile?viewerUid=${user?.uid || ''}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setFollowed(data.followedByViewer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setMoviesLoading(true);
      const res = await fetch(`${API}/api/movies?userId=${userId}&status=watchlist&page=${pageNum}&limit=${watchlistLimit}`);
      const data = await res.json();
      const xTotal = res.headers.get("X-Total-Count");
      if (xTotal !== null) setTotalWatchlist(parseInt(xTotal, 10));
      if (pageNum === 1) setWatchlistMovies(Array.isArray(data) ? data : []);
      else setWatchlistMovies((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
      setWatchlistHasMore(Array.isArray(data) ? data.length === watchlistLimit : false);
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
    } finally {
      setMoviesLoading(false);
    }
  };

  const fetchWatched = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setMoviesLoading(true);
      const res = await fetch(`${API}/api/movies?userId=${userId}&status=watched&page=${pageNum}&limit=${watchedLimit}`);
      const data = await res.json();
      const xTotal = res.headers.get("X-Total-Count");
      if (xTotal !== null) setTotalWatched(parseInt(xTotal, 10));
      if (pageNum === 1) setWatchedMovies(Array.isArray(data) ? data : []);
      else setWatchedMovies((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
      setWatchedHasMore(Array.isArray(data) ? data.length === watchedLimit : false);
    } catch (err) {
      console.error("Failed to fetch watched movies:", err);
    } finally {
      setMoviesLoading(false);
    }
  };

  const fetchUserPosts = async (pageNum = 1) => {
    setPostsLoading(true);
    try {
      const res = await fetch(`${API}/api/posts?userId=${userId}&page=${pageNum}&limit=${postsLimit}`);
      const data = await res.json();
      if (pageNum === 1) setPosts(Array.isArray(data) ? data : []);
      else setPosts((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
      setPostsHasMore(Array.isArray(data) ? data.length === postsLimit : false);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user || user.isGuest) {
      const goLogin = window.confirm('You must sign in to follow users.\n\nPress OK to go to Login, or Cancel to continue browsing as a guest.');
      if (goLogin) navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      await fetch(`${API}/api/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerUid: user.uid }),
      });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  // New interaction functions
  const toggleLike = async (postId) => {
    if (!user || user.isGuest || likingPosts[postId]) {
      if (!user || user.isGuest) {
        const goLogin = window.confirm('You must sign in to like posts.\n\nPress OK to go to Login, or Cancel to continue browsing as a guest.');
        if (goLogin) navigate('/login', { state: { from: location.pathname } });
      }
      return;
    }
    
    setLikingPosts(prev => ({ ...prev, [postId]: true }));
    
    try {
      const res = await fetch(`${API}/api/posts/${postId}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      
      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();
      
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, likes: data.likes } : post
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setLikingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  const addComment = async (postId) => {
    const commentText = commentTexts[postId];
    if (!user || user.isGuest || !commentText?.trim() || submittingComments[postId]) {
      if (!user || user.isGuest) {
        const goLogin = window.confirm('You must sign in to comment.\n\nPress OK to go to Login, or Cancel to continue browsing as a guest.');
        if (goLogin) navigate('/login', { state: { from: location.pathname } });
      }
      return;
    }
    
    setSubmittingComments(prev => ({ ...prev, [postId]: true }));
    
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, text: commentText }),
      });
      
      if (!res.ok) throw new Error("Failed to comment");
      const data = await res.json();
      
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, comments: data.comments } : post
      ));
      
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentKeyPress = (e, postId) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment(postId);
    }
  };

  const addMovie = async (movie, status) => {
    if (!user || user.isGuest) {
      const goLogin = window.confirm('You must sign in to add movies.\n\nPress OK to go to Login, or Cancel to continue browsing as a guest.');
      if (goLogin) navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      const otherStatus = status === "watchlist" ? "watched" : "watchlist";
      const checkRes = await fetch(`${API}/api/movies?userId=${user.uid}&status=${otherStatus}`);
      
      if (checkRes.ok) {
        const otherList = await checkRes.json();
        const existingMovie = otherList.find(m => String(m.tmdbId) === String(movie.id));
        
        if (existingMovie) {
          await fetch(`${API}/api/movies/${existingMovie._id}`, { method: "DELETE" });
          try {
            const postsRes = await fetch(`${API}/api/posts`);
            const allPosts = await postsRes.json();
            const associatedPost = allPosts.find(p => 
              p.userId === user.uid && p.type === "movie_activity" && 
              p.movieActivity?.action === otherStatus && String(p.movieActivity?.movie?.tmdbId) === String(movie.id)
            );
            if (associatedPost) await fetch(`${API}/api/posts/${associatedPost._id}`, { method: "DELETE" });
          } catch (e) { console.error("Cleanup post error:", e); }
        }
      }

      const res = await fetch(`${API}/api/posts/movie-activity`, {
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
      } else {
        const errData = await res.json();
        alert(errData.message === 'Movie already in this list' ? `Movie is already in your ${status}!` : (errData.message || "Failed to add movie"));
      }
    } catch (error) {
      console.error(error);
      alert("Error adding movie");
    }
  };

  useEffect(() => {
    fetchProfile();
    setPostsPage(1);
    setWatchlistPage(1);
    setWatchedPage(1);
    fetchUserPosts(1);
    fetchWatchlist(1);
    fetchWatched(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadMoreWatchlist = () => {
    const next = watchlistPage + 1;
    setWatchlistPage(next);
    fetchWatchlist(next);
  };

  const loadMoreWatched = () => {
    const next = watchedPage + 1;
    setWatchedPage(next);
    fetchWatched(next);
  };

  const collapseWatchlist = () => {
    setWatchlistPage(1);
    fetchWatchlist(1);
  };

  const collapseWatched = () => {
    setWatchedPage(1);
    fetchWatched(1);
  };

  const loadMorePosts = () => {
    const next = postsPage + 1;
    setPostsPage(next);
    fetchUserPosts(next);
  };

  // Helper function to render a movie card
  const renderMovieCard = (movie, size = "normal") => {
    const sizeClasses = size === "small" 
      ? "w-20 sm:w-24" 
      : "w-full";
    
    return (
      <div key={movie._id || movie.tmdbId} className={`${size === "small" ? "flex-shrink-0" : ""} text-center`}>
        {movie.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w200${movie.posterPath}`}
            alt={movie.title}
            className={`${sizeClasses} aspect-[2/3] object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105`}
          />
        ) : (
          <div className={`${sizeClasses} aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500 shadow-md`}>
            <FilmIcon className="w-6 h-6" />
          </div>
        )}
        <p className="text-xs mt-2 font-medium text-gray-800 px-1 leading-tight" style={{ maxWidth: size === "small" ? "80px" : "100%" }}>
          {movie.title}
        </p>
        {movie.releaseDate && (
          <p className="text-xs text-gray-500">
            {new Date(movie.releaseDate).getFullYear()}
          </p>
        )}
      </div>
    );
  };

  // Enhanced helper function to render post with interactions
  const renderPost = (post) => {
    const isLiked = post.likes?.includes(user?.uid);
    const commentText = commentTexts[post._id] || "";
    const isSubmittingComment = submittingComments[post._id];
    const isLikingPost = likingPosts[post._id];

    // Handle movie activity posts
    if (post.type === 'movie_activity' && post.movieActivity) {
      const movie = post.movieActivity.movie;
      const actionText = post.movieActivity.action === 'watchlist' 
        ? 'added to watchlist' 
        : 'watched';

      return (
        <div key={post._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FilmIcon className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-gray-600 font-medium capitalize">
                {actionText}
              </p>
            </div>
            
            {movie && (
              <div className="relative flex gap-3 mb-4 pr-10">
                {movie.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.posterPath}`}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-24 flex items-center justify-center bg-gray-100 text-gray-500 text-xs rounded-lg">
                    <FilmIcon className="w-6 h-6" />
                  </div>
                )}
                <button
                  className="absolute top-0 right-0 w-8 h-8 rounded-full bg-black bg-opacity-60 text-white flex items-center justify-center hover:bg-opacity-80 transition-all"
                  title="View Movie Details"
                  onClick={() => setSelectedPostMovie({
                    id: movie.tmdbId,
                    title: movie.title,
                    poster_path: movie.posterPath,
                    release_date: movie.releaseDate,
                    overview: movie.overview,
                    backdrop_path: movie.backdropPath,
                    genre_ids: movie.genre_ids,
                    vote_average: movie.vote_average,
                  })}
                >
                  <InformationCircleIcon className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{movie.title}</h3>
                  {movie.releaseDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(movie.releaseDate).getFullYear()}
                    </p>
                  )}
                  {movie.overview && (
                    <p className="text-sm mt-2 text-gray-600 line-clamp-3">{movie.overview}</p>
                  )}
                </div>
              </div>
            )}

            {/* Interactive buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(post._id)}
                  disabled={isLikingPost || !user}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    isLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  {isLiked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
                  <span>{post.likes?.length || 0}</span>
                </button>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Comment section */}
            {user && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                    onKeyPress={(e) => handleCommentKeyPress(e, post._id)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => addComment(post._id)}
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingComment ? "..." : "Post"}
                  </button>
                </div>

                {/* Comments list */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {post.comments.slice(-3).map((comment, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <div className="flex items-center gap-2">
                          {comment.userProfilePic ? (
                            <img src={comment.userProfilePic} alt="User" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                              <UserIcon className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <span className="font-medium">{comment.userName || comment.username || "Anonymous"}</span>
                        </div>
                        {comment.createdAt && (
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        )}
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Handle regular posts
    return (
      <div key={post._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {post.movie?.posterPath && (
          <div className="relative bg-gray-100 overflow-hidden">
            <img
              src={`https://image.tmdb.org/t/p/w500${post.movie.posterPath}`}
              alt={post.movie.title}
              className="w-full h-auto object-cover"
            />
            <button
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black bg-opacity-60 text-white flex items-center justify-center hover:bg-opacity-80 transition-all"
              title="View Movie Details"
              onClick={() => setSelectedPostMovie({
                id: post.movie.tmdbId,
                title: post.movie.title,
                poster_path: post.movie.posterPath,
                release_date: post.movie.releaseDate,
                overview: post.movie.overview,
                backdrop_path: post.movie.backdropPath,
                genre_ids: post.movie.genre_ids,
                vote_average: post.movie.vote_average,
              })}
            >
              <InformationCircleIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-4">
          <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.text}</p>
          
          {/* Interactive buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleLike(post._id)}
                disabled={isLikingPost || !user}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                }`}
              >
                {isLiked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
                <span>{post.likes?.length || 0}</span>
              </button>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{post.comments?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Comment section */}
          {user && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                  onKeyPress={(e) => handleCommentKeyPress(e, post._id)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={() => addComment(post._id)}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? "..." : "Post"}
                </button>
              </div>

              {/* Comments list */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {post.comments.slice(-3).map((comment, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <div className="flex items-center gap-2">
                          {comment.userProfilePic ? (
                            <img src={comment.userProfilePic} alt="User" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                              <UserIcon className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <span className="font-medium">{comment.userName || comment.username || "Anonymous"}</span>
                        </div>
                        {comment.createdAt && (
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-20">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Cover banner */}
        {profile.user.coverPic ? (
          <img src={profile.user.coverPic} alt="Cover" className="w-full h-32 sm:h-36 object-cover" />
        ) : (
          <div className="h-28 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600" />
        )}
        <div className="px-5 pb-5 relative z-10">
          <div className="relative z-10 flex items-end justify-between -mt-12 mb-4">
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:scale-[1.02] transition-transform shadow-inner ring-4 ring-white"
              onClick={() => {
                if (profile.user.profilePic) {
                  setShowFullProfilePic(profile.user.profilePic);
                }
              }}
              title={profile.user.profilePic ? "Click to view full size" : ""}
            >
              {profile.user.profilePic ? (
                <img src={profile.user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              )}
            </div>
            
            {user.uid !== userId && (
              <button
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  followed 
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
                onClick={toggleFollow}
              >
                {followed ? (
                  <>
                    <UserMinusIcon className="w-4 h-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4" />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {profile.user.name || profile.user.username || "Profile"}
            </h1>
            
            {profile.user.bio && (
              <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-2xl whitespace-pre-wrap">{profile.user.bio}</p>
            )}

            {(profile.user.socialLinks?.facebook || profile.user.socialLinks?.instagram || profile.user.socialLinks?.github || profile.user.socialLinks?.website || profile.user.socialLinks?.custom?.length > 0) && (
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {profile.user.socialLinks.instagram && (
                  <a href={ensureAbsoluteUrl(profile.user.socialLinks.instagram)} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {profile.user.socialLinks.facebook && (
                  <a href={ensureAbsoluteUrl(profile.user.socialLinks.facebook)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                  </a>
                )}
                {profile.user.socialLinks.github && (
                  <a href={ensureAbsoluteUrl(profile.user.socialLinks.github)} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-black transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
                  </a>
                )}
                {profile.user.socialLinks.website && (
                  <a href={ensureAbsoluteUrl(profile.user.socialLinks.website)} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                  </a>
                )}
                {profile.user.socialLinks.custom?.map((link, idx) => (
                  <a key={idx} href={ensureAbsoluteUrl(link.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors" title={link.name}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    {link.name && <span className="text-sm font-medium">{link.name}</span>}
                  </a>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4 sm:gap-6 mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <button 
                className="hover:text-purple-600 transition-colors"
                onClick={() => { setShowFollowers(true); fetchFollowers(); }}
              >
                <span className="font-semibold text-gray-900 text-base">{profile.followersCount}</span> followers
              </button>
              <button 
                className="hover:text-purple-600 transition-colors"
                onClick={() => { setShowFollowing(true); fetchFollowing(); }}
              >
                <span className="font-semibold text-gray-900 text-base">{profile.followingCount}</span> following
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Films */}
      <div className="bg-white rounded-xl shadow-sm p-6 relative">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FilmIcon className="w-6 h-6 text-purple-600" />
          Pinned Films
        </h2>

        {profile?.pinnedFilms?.length ? (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-2 pr-10" style={{ width: 'max-content' }}>
                {profile.pinnedFilms.slice(0, 8).map((film) => renderMovieCard(film, "small"))}
              </div>
            </div>

            {/* Gradient scroll hint */}
            <div className="absolute top-0 right-0 h-full w-12 pointer-events-none bg-gradient-to-l from-white to-transparent" />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FilmIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No pinned films yet</p>
          </div>
        )}
      </div>

      {/* Movie Collections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Watchlist */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Watchlist ({totalWatchlist})
            </h2>
            {/* pagination handled with Load More */}
          </div>
          
          {moviesLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : watchlistMovies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <EyeIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No movies in watchlist</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {watchlistMovies.map(renderMovieCard)}
            </div>

            {(watchlistHasMore || watchlistPage > 1) && (
              <div className="flex justify-center gap-4 mt-4">
                {watchlistHasMore && (
                  <button onClick={loadMoreWatchlist} className="px-4 py-2 bg-white border border-gray-200 rounded text-purple-600 font-medium">Load More</button>
                )}
                {watchlistPage > 1 && (
                  <button onClick={collapseWatchlist} className="px-4 py-2 bg-white border border-gray-200 rounded text-gray-600 font-medium">Collapse</button>
                )}
              </div>
            )}
            </>
          )}
        </div>

        {/* Watched Movies */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Watched ({totalWatched})
            </h2>
            {/* pagination handled with Load More */}
          </div>
          
          {moviesLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : watchedMovies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FilmIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No watched movies</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {watchedMovies.map(renderMovieCard)}
            </div>

            {(watchedHasMore || watchedPage > 1) && (
              <div className="flex justify-center gap-4 mt-4">
                {watchedHasMore && (
                  <button onClick={loadMoreWatched} className="px-4 py-2 bg-white border border-gray-200 rounded text-green-600 font-medium">Load More</button>
                )}
                {watchedPage > 1 && (
                  <button onClick={collapseWatched} className="px-4 py-2 bg-white border border-gray-200 rounded text-gray-600 font-medium">Collapse</button>
                )}
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Posts ({posts.length})
        </h2>

        {/* Post Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4">
          <button
            onClick={() => setPostFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              postFilter === "all"
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setPostFilter("posts")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              postFilter === "posts"
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Thoughts ({posts.filter(p => p.type !== 'movie_activity').length})
          </button>
          <button
            onClick={() => setPostFilter("activity")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              postFilter === "activity"
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Movie Activity ({posts.filter(p => p.type === 'movie_activity').length})
          </button>
        </div>

        {postsLoading && posts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No posts yet</p>
            <p className="text-sm mt-1">Start sharing your movie thoughts!</p>
          </div>
        ) : (() => {
          const filteredPosts = posts.filter((post) => {
            if (postFilter === "posts") return post.type !== "movie_activity";
            if (postFilter === "activity") return post.type === "movie_activity";
            return true;
          });

          if (filteredPosts.length === 0) {
            return (
              <div className="text-center py-12 text-gray-500">
                <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No matching posts</p>
                <p className="text-sm mt-1">
                  {postFilter === "posts" ? "No movie thoughts shared yet." : "No movie watchlist or watched activity yet."}
                </p>
              </div>
            );
          }

          return (
            <>
              <div className="columns-1 sm:columns-2 gap-6">
                {filteredPosts.map((post) => (
                  <div key={post._id} className="break-inside-avoid mb-6">
                    {renderPost(post)}
                  </div>
                ))}
              </div>

              {postsHasMore && (
                <div className="text-center mt-6">
                  <button onClick={loadMorePosts} className="px-6 py-2 bg-white border border-gray-200 rounded text-purple-600 font-medium">Load More Posts</button>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg text-gray-900">Followers</h2>
              <button 
                onClick={() => setShowFollowers(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-96 p-4">
              {loadingList ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : followersList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No followers yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {followersList.map((f) => (
                    <ProfileLink
                      key={f.uid}
                      uid={f.uid}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setShowFollowers(false)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        {f.profilePic ? (
                          <img src={f.profilePic} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{f.name}</span>
                    </ProfileLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg text-gray-900">Following</h2>
              <button 
                onClick={() => setShowFollowing(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-96 p-4">
              {loadingList ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : followingList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Not following anyone yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {followingList.map((f) => (
                    <ProfileLink
                      key={f.uid}
                      uid={f.uid}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setShowFollowing(false)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        {f.profilePic ? (
                          <img src={f.profilePic} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{f.name}</span>
                    </ProfileLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Movie Details Modal */}
      {selectedPostMovie && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-2 sm:p-4 z-50"
          onClick={() => setSelectedPostMovie(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col mx-2 sm:mx-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {selectedPostMovie.backdrop_path ? (
                <div className="relative h-32 sm:h-48 bg-slate-950 flex-shrink-0">
                  <img
                    src={`https://image.tmdb.org/t/p/w780${selectedPostMovie.backdrop_path}`}
                    alt={selectedPostMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ) : (
                <div className="h-32 sm:h-48 bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0"></div>
              )}
              <button
                onClick={() => setSelectedPostMovie(null)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-8rem)] sm:max-h-[calc(90vh-12rem)]">
              <div className="flex gap-4 sm:gap-6 mb-4 sm:mb-6">
                {selectedPostMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${selectedPostMovie.poster_path}`}
                    alt={selectedPostMovie.title}
                    className="w-24 h-36 sm:w-32 sm:h-48 aspect-[2/3] object-contain bg-slate-800 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0 relative z-10 -mt-12 sm:-mt-16"
                  />
                ) : (
                  <div className="w-24 h-36 sm:w-32 sm:h-48 bg-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 -mt-12 sm:-mt-16">
                    <FilmIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">{selectedPostMovie.title}</h3>
                  <p className="text-gray-600 mb-2 text-sm sm:text-base">
                    {selectedPostMovie.release_date ? new Date(selectedPostMovie.release_date).toDateString() : "N/A"}
                  </p>
                  {selectedPostMovie.genre_ids && selectedPostMovie.genre_ids.length > 0 && (
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      Genres: {selectedPostMovie.genre_ids.map(id => genreMap[id]).join(", ") || "N/A"}
                    </p>
                  )}
                  {selectedPostMovie.vote_average && (
                    <p className="text-gray-600 mb-2 flex items-center gap-1 text-sm sm:text-base">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      {selectedPostMovie.vote_average.toFixed(1)}/10
                    </p>
                  )}
                  <p className="hidden sm:block text-gray-700 text-sm sm:text-base leading-relaxed mb-4">
                    {selectedPostMovie.overview || "No description available."}
                  </p>
                  <div className="hidden sm:flex mt-4 gap-3">
                    <button
                      onClick={() => { addMovie(selectedPostMovie, "watchlist"); setSelectedPostMovie(null); }}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Watchlist
                    </button>
                    <button
                      onClick={() => { addMovie(selectedPostMovie, "watched"); setSelectedPostMovie(null); }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      <FilmIcon className="w-4 h-4" />
                      Watched
                    </button>
                  </div>
                </div>
              </div>
              <div className="block sm:hidden mb-6">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedPostMovie.overview || "No description available."}
                </p>
              </div>
              <div className="block sm:hidden flex flex-col gap-3 mt-4">
                <button
                  onClick={() => { addMovie(selectedPostMovie, "watchlist"); setSelectedPostMovie(null); }}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Watchlist
                </button>
                <button
                  onClick={() => { addMovie(selectedPostMovie, "watched"); setSelectedPostMovie(null); }}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <FilmIcon className="w-4 h-4" />
                  Watched
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Full Size Profile Picture Modal */}
      {showFullProfilePic && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
          onClick={() => setShowFullProfilePic(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[90vh] bg-white p-2 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullProfilePic(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors flex items-center gap-1 font-medium bg-black/40 px-3 py-1.5 rounded-full"
            >
              <XMarkIcon className="w-5 h-5" />
              Close
            </button>
            <img
              src={showFullProfilePic}
              alt="Profile Full Size"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
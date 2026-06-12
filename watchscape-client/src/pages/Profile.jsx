import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
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

const API = "https://patient-determination-production.up.railway.app";

// Genre mapping for TMDB
const genreMap = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror",
  10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western"
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

  // New states for interactions
  const [likingPosts, setLikingPosts] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [submittingComments, setSubmittingComments] = useState({});
  const [selectedPostMovie, setSelectedPostMovie] = useState(null);

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
                        <div className="flex justify-between items-start text-xs text-gray-500 mb-1">
                          <span className="font-medium">{comment.userName || comment.username || "Anonymous"}</span>
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
                      <div className="flex justify-between items-start text-xs text-gray-500 mb-1">
                        <span className="font-medium">{comment.userName || comment.username || "Anonymous"}</span>
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.user.name || profile.user.username || "Profile"}
              </h1>
              <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                <button 
                  className="hover:text-purple-600 transition-colors"
                  onClick={() => { setShowFollowers(true); fetchFollowers(); }}
                >
                  <span className="font-semibold">{profile.followersCount}</span> followers
                </button>
                <button 
                  className="hover:text-purple-600 transition-colors"
                  onClick={() => { setShowFollowing(true); fetchFollowing(); }}
                >
                  <span className="font-semibold">{profile.followingCount}</span> following
                </button>
              </div>
            </div>
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
              Watchlist ({watchlistMovies.length})
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

            {watchlistHasMore && (
              <div className="text-center mt-4">
                <button onClick={loadMoreWatchlist} className="px-4 py-2 bg-white border border-gray-200 rounded text-purple-600 font-medium">Load More</button>
              </div>
            )}
            </>
          )}
        </div>

        {/* Watched Movies */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Watched ({watchedMovies.length})
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

            {watchedHasMore && (
              <div className="text-center mt-4">
                <button onClick={loadMoreWatched} className="px-4 py-2 bg-white border border-gray-200 rounded text-green-600 font-medium">Load More</button>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Posts ({posts.length})
        </h2>

        {postsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No posts yet</p>
            <p className="text-sm mt-1">Start sharing your movie thoughts!</p>
          </div>
        ) : (
          <>
          <div className="grid sm:grid-cols-2 gap-6">
            {posts.map(renderPost)}
          </div>

          {postsHasMore && (
            <div className="text-center mt-6">
              <button onClick={loadMorePosts} className="px-6 py-2 bg-white border border-gray-200 rounded text-purple-600 font-medium">Load More Posts</button>
            </div>
          )}
          </>
        )}
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
                    <Link
                      key={f.uid}
                      to={`/dashboard/profile/${f.uid}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setShowFollowers(false)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{f.name}</span>
                    </Link>
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
                    <Link
                      key={f.uid}
                      to={`/dashboard/profile/${f.uid}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setShowFollowing(false)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{f.name}</span>
                    </Link>
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
            className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl mx-2 sm:mx-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {selectedPostMovie.backdrop_path ? (
                <div className="relative h-32 sm:h-48 bg-gradient-to-t from-black/60 to-transparent">
                  <img
                    src={`https://image.tmdb.org/t/p/w780${selectedPostMovie.backdrop_path}`}
                    alt={selectedPostMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              ) : (
                <div className="h-32 sm:h-48 bg-gradient-to-br from-purple-600 to-blue-600"></div>
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
                    className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-lg sm:rounded-xl shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-36 sm:w-32 sm:h-48 bg-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
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
    </div>
  );
}
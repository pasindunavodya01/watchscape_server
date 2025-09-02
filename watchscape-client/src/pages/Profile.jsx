import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  UserIcon,
  FilmIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  UserMinusIcon,
  XMarkIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

const API = "https://patient-determination-production.up.railway.app";

export default function Profile({ user }) {
  const { userId } = useParams();
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
  const [showAllWatchlist, setShowAllWatchlist] = useState(false);
  const [showAllWatched, setShowAllWatched] = useState(false);

  // posts fetched EXACTLY like Home, then filtered to this user
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

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
      const res = await fetch(`${API}/api/users/${userId}/profile?viewerUid=${user.uid}`);
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

  const fetchMovieCollections = async () => {
    setMoviesLoading(true);
    try {
      // Fetch watchlist
      const watchlistRes = await fetch(`${API}/api/movies?userId=${userId}&status=watchlist`);
      const watchlistData = await watchlistRes.json();
      setWatchlistMovies(Array.isArray(watchlistData) ? watchlistData : []);

      // Fetch watched movies
      const watchedRes = await fetch(`${API}/api/movies?userId=${userId}&status=watched`);
      const watchedData = await watchedRes.json();
      setWatchedMovies(Array.isArray(watchedData) ? watchedData : []);
    } catch (err) {
      console.error("Failed to fetch movie collections:", err);
    } finally {
      setMoviesLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      // same endpoint Home uses
      const res = await fetch(`${API}/api/posts`);
      const data = await res.json();
      // show ONLY this user's posts, but with the enriched likes/comments
      setPosts(Array.isArray(data) ? data.filter(p => p.userId === userId) : []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const toggleFollow = async () => {
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

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
    fetchMovieCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  // Helper function to render post with proper movie activity handling
  const renderPost = (post) => {
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
              <div className="flex gap-3 mb-4">
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

            <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <HeartIcon className="w-4 h-4" />
                  <span>{post.likes?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle regular posts
    return (
      <div key={post._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {post.movie?.posterPath && (
          <div className="bg-gray-100 overflow-hidden">
            <img
              src={`https://image.tmdb.org/t/p/w500${post.movie.posterPath}`}
              alt={post.movie.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        <div className="p-4">
          <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.text}</p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4" />
                <span>{post.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{post.comments?.length || 0}</span>
              </div>
            </div>
          </div>
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
        <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
          {profile.pinnedFilms.slice(0, 8).map((film) => renderMovieCard(film, "small"))}
        </div>
      </div>

      {/* Gradient + arrow scroll hint */}
      <div className="absolute top-0 right-0 h-full w-12 flex items-center justify-center pointer-events-none bg-gradient-to-l from-white to-transparent">
        <span className="text-gray-400 text-xl font-bold">&gt;</span>
      </div>
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
            {watchlistMovies.length > 6 && (
              <button
                onClick={() => setShowAllWatchlist(!showAllWatchlist)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                {showAllWatchlist ? 'Show Less' : 'View All'}
                <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAllWatchlist ? 'rotate-90' : ''}`} />
              </button>
            )}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(showAllWatchlist ? watchlistMovies : watchlistMovies.slice(0, 6)).map(renderMovieCard)}
            </div>
          )}
        </div>

        {/* Watched Movies */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Watched ({watchedMovies.length})
            </h2>
            {watchedMovies.length > 6 && (
              <button
                onClick={() => setShowAllWatched(!showAllWatched)}
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
              >
                {showAllWatched ? 'Show Less' : 'View All'}
                <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAllWatched ? 'rotate-90' : ''}`} />
              </button>
            )}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(showAllWatched ? watchedMovies : watchedMovies.slice(0, 6)).map(renderMovieCard)}
            </div>
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
          <div className="grid sm:grid-cols-2 gap-6">
            {posts.map(renderPost)}
          </div>
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
    </div>
  );
}
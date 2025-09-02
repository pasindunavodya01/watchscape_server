import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  UserIcon,
  FilmIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from "@heroicons/react/24/outline";

const API = "https://patient-determination-production.up.railway.app";

export default function MyProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Followers/Following
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Movie search & pin
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAllPinned, setShowAllPinned] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API}/api/users/${user.uid}/profile?viewerUid=${user.uid}`
      );
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch(`${API}/api/posts`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data.filter((p) => p.userId === user.uid) : []);
    } catch (err) {
      console.error(err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/api/users/${user.uid}/followers`);
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
      const res = await fetch(`${API}/api/users/${user.uid}/following`);
      const data = await res.json();
      setFollowingList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // Search movies
  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`${API}/api/movies/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Pin movie
  const pinMovie = async (movie) => {
    try {
      const res = await fetch(`${API}/api/users/${user.uid}/pin-film`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.id.toString(),
          title: movie.title,
          posterPath: movie.poster_path,
        }),
      });
      if (!res.ok) throw new Error("Failed to pin movie");
      alert("Movie pinned successfully!");
      fetchProfile();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error pinning movie:", err);
      alert("Failed to pin movie");
    }
  };

  // Unpin movie
  const unpinMovie = async (tmdbId) => {
    try {
      const res = await fetch(`${API}/api/users/${user.uid}/pin-film/${tmdbId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unpin movie");
      alert("Movie unpinned successfully!");
      fetchProfile();
    } catch (err) {
      console.error("Error unpinning movie:", err);
      alert("Failed to unpin movie");
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    try {
      const res = await fetch(`${API}/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      alert("Post deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  // Edit post
  const editPost = async (postId, newText) => {
    try {
      const res = await fetch(`${API}/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });
      if (!res.ok) throw new Error("Failed to edit post");
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, text: newText } : p)));
      alert("Post updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to edit post");
    }
  };

  // Helper functions
  const getMoviePoster = (post) => {
    if (post.type === 'movie_activity' && post.movieActivity?.movie?.posterPath) {
      return `https://image.tmdb.org/t/p/w300${post.movieActivity.movie.posterPath}`;
    } else if (post.movie?.posterPath) {
      return `https://image.tmdb.org/t/p/w300${post.movie.posterPath}`;
    }
    return null;
  };

  const getMovieTitle = (post) => {
    if (post.type === 'movie_activity' && post.movieActivity?.movie?.title) {
      return post.movieActivity.movie.title;
    } else if (post.movie?.title) {
      return post.movie.title;
    }
    return "Unknown Movie";
  };

  const getActionText = (post) => {
    if (post.type === 'movie_activity') {
      return post.movieActivity?.action === 'watchlist' 
        ? 'Added to watchlist' 
        : post.movieActivity?.action === 'watched'
        ? 'Watched'
        : 'Movie activity';
    }
    return null;
  };

  // Render post function
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
        {getMoviePoster(post) && (
          <div className="bg-gray-100 overflow-hidden">
            <img
              src={getMoviePoster(post)}
              alt={getMovieTitle(post)}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        <div className="p-4">
          {getActionText(post) && (
            <div className="text-sm text-gray-600 mb-2 font-medium">
              {getActionText(post)}: {getMovieTitle(post)}
            </div>
          )}
          
          {post.text && (
            <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.text}</p>
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

          {/* Edit/Delete buttons - Only for regular posts, not movie activities */}
          {post.type !== 'movie_activity' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  const newText = prompt("Edit post text:", post.text);
                  if (newText !== null && newText !== post.text) {
                    editPost(post._id, newText);
                  }
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                <PencilIcon className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => deletePost(post._id)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchProfile();
    fetchMyPosts();
  }, []);

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
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.user.name || profile.user.username || "My Profile"}
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
      </div>

      {/* Movie Search & Pin */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MagnifyingGlassIcon className="w-6 h-6 text-purple-600" />
          Search Movies to Pin
        </h2>
        
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch} 
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
            disabled={searchLoading}
          >
            {searchLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <MagnifyingGlassIcon className="w-4 h-4" />
            )}
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-3">Search Results:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.slice(0, 12).map((movie) => (
                <div key={movie.id} className="group">
                  <div className="relative">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center shadow-md">
                        <FilmIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button 
                      onClick={() => pinMovie(movie)} 
                      className="absolute top-2 right-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-purple-700"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs mt-2 font-medium text-gray-800 line-clamp-2">{movie.title}</p>
                  {movie.release_date && (
                    <p className="text-xs text-gray-500">
                      {new Date(movie.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pinned Films */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FilmIcon className="w-6 h-6 text-purple-600" />
            Pinned Films ({profile?.pinnedFilms?.length || 0})
          </h2>
          {profile?.pinnedFilms?.length > 8 && (
            <button
              onClick={() => setShowAllPinned(!showAllPinned)}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
            >
              {showAllPinned ? 'Show Less' : 'View All'}
              <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAllPinned ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        
        {profile?.pinnedFilms?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {(showAllPinned ? profile.pinnedFilms : profile.pinnedFilms.slice(0, 8)).map((film) => (
              <div key={film.tmdbId} className="group">
                <div className="relative">
                  {film.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${film.posterPath}`}
                      alt={film.title}
                      className="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center shadow-md">
                      <FilmIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <button 
                    onClick={() => unpinMovie(film.tmdbId)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs mt-2 font-medium text-gray-800 line-clamp-2">{film.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FilmIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No pinned films yet</p>
            <p className="text-sm mt-1">Search and pin your favorite movies above!</p>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          My Posts ({posts.length})
        </h2>

        {postsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No posts yet</p>
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
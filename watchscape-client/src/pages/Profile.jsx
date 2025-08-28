import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

const API = "https://patient-determination-production.up.railway.app";

export default function Profile({ user }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [followed, setFollowed] = useState(false);
  
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
      const res = await fetch(`${API}/api/users/${userId}/profile?viewerUid=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setFollowed(data.followedByViewer);
    } catch (err) {
      console.error(err);
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

  if (!profile) return <p>Loading...</p>;

  // Helper function to render a movie card
  const renderMovieCard = (movie) => (
    <div key={movie._id || movie.tmdbId} className="text-center">
      {movie.posterPath ? (
        <img
          src={`https://image.tmdb.org/t/p/w200${movie.posterPath}`}
          alt={movie.title}
          className="w-full rounded shadow hover:shadow-lg transition-shadow cursor-pointer"
        />
      ) : (
        <div className="aspect-[2/3] bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
          No Image
        </div>
      )}
      <p className="text-xs mt-1 font-medium">{movie.title}</p>
      {movie.releaseDate && (
        <p className="text-xs text-gray-500">
          {new Date(movie.releaseDate).getFullYear()}
        </p>
      )}
    </div>
  );

  // Helper function to render post with proper movie activity handling
  const renderPost = (post) => {
    // Handle movie activity posts
    if (post.type === 'movie_activity' && post.movieActivity) {
      const movie = post.movieActivity.movie;
      const actionText = post.movieActivity.action === 'watchlist' 
        ? 'added to watchlist' 
        : 'watched';

      return (
        <div key={post._id} className="border rounded bg-white overflow-hidden shadow-sm">
          <div className="p-3">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">{actionText}</span>
            </p>
            
            {movie && (
              <div className="flex gap-3 mb-3">
                {movie.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.posterPath}`}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 flex items-center justify-center bg-gray-100 text-gray-500 text-xs rounded">
                    No Image
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{movie.title}</h3>
                  {movie.releaseDate && (
                    <p className="text-sm text-gray-600">
                      {new Date(movie.releaseDate).getFullYear()}
                    </p>
                  )}
                  {movie.overview && (
                    <p className="text-sm mt-1 line-clamp-3">{movie.overview}</p>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </p>

            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>👍 {post.likes?.length || 0} Likes</span>
              <span>💬 {post.comments?.length || 0} Comments</span>
            </div>

            {post.comments?.length > 0 && (
              <div className="mt-2 border-t pt-2 text-sm">
                {(post.comments.slice(0, 2) || []).map((c, i) => (
                  <p key={i}>
                    <span className="font-semibold">{c.userName}:</span> {c.text}
                  </p>
                ))}
                {post.comments.length > 2 && (
                  <div className="text-xs text-blue-600 mt-1">
                    View all {post.comments.length} comments
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
      <div key={post._id} className="border rounded bg-white overflow-hidden shadow-sm">
        {post.movie?.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${post.movie.posterPath}`}
            alt={post.movie.title}
            className="w-full h-auto object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500">
            No Cover
          </div>
        )}

        <div className="p-3">
          <p className="whitespace-pre-wrap">{post.text}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(post.createdAt).toLocaleString()}
          </p>

          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>👍 {post.likes?.length || 0} Likes</span>
            <span>💬 {post.comments?.length || 0} Comments</span>
          </div>

          {post.comments?.length > 0 && (
            <div className="mt-2 border-t pt-2 text-sm">
              {(post.comments.slice(0, 2) || []).map((c, i) => (
                <p key={i}>
                  <span className="font-semibold">{c.userName}:</span> {c.text}
                </p>
              ))}
              {post.comments.length > 2 && (
                <div className="text-xs text-blue-600 mt-1">
                  View all {post.comments.length} comments
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {profile.user.name || profile.user.username || "Profile"}
        </h1>
        {user.uid !== userId && (
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={toggleFollow}
          >
            {followed ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-4">
        <p className="cursor-pointer" onClick={() => { setShowFollowers(true); fetchFollowers(); }}>
          Followers: {profile.followersCount}
        </p>
        <p className="cursor-pointer" onClick={() => { setShowFollowing(true); fetchFollowing(); }}>
          Following: {profile.followingCount}
        </p>
      </div>

      {/* Pinned Films */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Pinned Films</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {profile?.pinnedFilms?.length
            ? profile.pinnedFilms.slice(0, 6).map((f) => (
                <div key={f.tmdbId} className="text-center">
                  {f.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${f.posterPath}`}
                      alt={f.title}
                      className="rounded shadow"
                    />
                  ) : (
                    <div className="aspect-[2/3] bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      No Image
                    </div>
                  )}
                  <p className="text-xs mt-1">{f.title}</p>
                </div>
              ))
            : <div className="text-sm text-gray-500">No pinned films</div>}
        </div>
      </div>

      {/* Movie Collections */}
      <div className="mb-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Watchlist */}
          <div>
            <h2 className="font-semibold mb-3">Watchlist ({watchlistMovies.length})</h2>
            {moviesLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : watchlistMovies.length === 0 ? (
              <div className="text-sm text-gray-500">No movies in watchlist</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {watchlistMovies.slice(0, 8).map(renderMovieCard)}
                {watchlistMovies.length > 8 && (
                  <div className="text-xs text-blue-600 col-span-full text-center mt-2">
                    +{watchlistMovies.length - 8} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Watched Movies */}
          <div>
            <h2 className="font-semibold mb-3">Watched ({watchedMovies.length})</h2>
            {moviesLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : watchedMovies.length === 0 ? (
              <div className="text-sm text-gray-500">No watched movies</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {watchedMovies.slice(0, 8).map(renderMovieCard)}
                {watchedMovies.length > 8 && (
                  <div className="text-xs text-blue-600 col-span-full text-center mt-2">
                    +{watchedMovies.length - 8} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Posts ({posts.length})</h2>

        {postsLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-gray-500 text-sm">No posts yet</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {posts.map(renderPost)}
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-80 max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Followers</h2>
              <button onClick={() => setShowFollowers(false)}>Close</button>
            </div>
            {loadingList ? (
              <p>Loading...</p>
            ) : followersList.length === 0 ? (
              <p>No followers yet</p>
            ) : (
              followersList.map((f) => (
                <Link
                  key={f.uid}
                  to={`/dashboard/profile/${f.uid}`}
                  className="flex items-center gap-2 mb-2 hover:bg-gray-100 rounded p-1"
                  onClick={() => setShowFollowers(false)}
                >
                  <span>{f.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-80 max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Following</h2>
              <button onClick={() => setShowFollowing(false)}>Close</button>
            </div>
            {loadingList ? (
              <p>Loading...</p>
            ) : followingList.length === 0 ? (
              <p>Not following anyone yet</p>
            ) : (
              followingList.map((f) => (
                <Link
                  key={f.uid}
                  to={`/dashboard/profile/${f.uid}`}
                  className="flex items-center gap-2 mb-2 hover:bg-gray-100 rounded p-1"
                  onClick={() => setShowFollowing(false)}
                >
                  <span>{f.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
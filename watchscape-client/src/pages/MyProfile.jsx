import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "https://patient-determination-production.up.railway.app";

export default function MyProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

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

  const fetchProfile = async () => {
    try {
      const res = await fetch(
        `${API}/api/users/${user.uid}/profile?viewerUid=${user.uid}`
      );
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
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

  const pinMovie = async (movie) => {
    try {
      const res = await fetch(`${API}/api/movies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          releaseDate: movie.release_date,
          userId: user.uid,
          status: "pinned",
        }),
      });
      if (!res.ok) throw new Error("Failed to pin movie");
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit/Delete posts
  const deletePost = async (postId) => {
    try {
      const res = await fetch(`${API}/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const editPost = async (postId, newText) => {
    try {
      const res = await fetch(`${API}/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });
      if (!res.ok) throw new Error("Failed to edit post");
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, text: newText } : p)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMyPosts();
  }, []);

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{profile.user.name || profile.user.username}</h1>

      {/* Stats */}
      <div className="mb-4 flex gap-4">
        <p className="cursor-pointer" onClick={() => { setShowFollowers(true); fetchFollowers(); }}>
          Followers: {profile.followersCount}
        </p>
        <p className="cursor-pointer" onClick={() => { setShowFollowing(true); fetchFollowing(); }}>
          Following: {profile.followingCount}
        </p>
      </div>

      {/* Search & Pin Movies */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Search Movies to Pin</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="border p-2 rounded flex-1"
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-3 rounded">Search</button>
        </div>

        {searchLoading ? (
          <p>Searching...</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {searchResults.map((m) => (
              <div key={m.id} className="text-center">
                {m.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${m.poster_path}`}
                    alt={m.title}
                    className="rounded shadow"
                  />
                ) : (
                  <div className="h-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
                <p className="text-xs mt-1">{m.title}</p>
                <button onClick={() => pinMovie(m)} className="mt-1 text-xs text-blue-600 hover:underline">
                  Pin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinned Films */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Pinned Films</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {profile?.pinnedFilms?.length ? (
            profile.pinnedFilms.map(f => (
              <div key={f.tmdbId} className="text-center">
                {f.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${f.posterPath}`}
                    alt={f.title}
                    className="rounded shadow"
                  />
                ) : (
                  <div className="h-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
                <p className="text-xs mt-1">{f.title}</p>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No pinned films</div>
          )}
        </div>
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
              followersList.map(f => (
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
              followingList.map(f => (
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

      {/* Posts */}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">My Posts</h2>
        {postsLoading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven't posted anything yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {posts.map(p => (
              <div key={p._id} className="border rounded bg-white overflow-hidden shadow-sm">
                {p.movie?.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${p.movie.posterPath}`}
                    alt={p.movie.title}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500">
                    No Cover
                  </div>
                )}
                <div className="p-3">
                  <p className="whitespace-pre-wrap">{p.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(p.createdAt).toLocaleString()}
                  </p>

                  {/* Edit/Delete buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const newText = prompt("Edit post text:", p.text);
                        if (newText) editPost(p._id, newText);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(p._id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

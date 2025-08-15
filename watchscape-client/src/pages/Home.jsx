// pages/Home.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

const API = "https://spectacular-solace-watchscape.up.railway.app";

export default function Home({ user }) {
  const [posts, setPosts] = useState([]);

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
    try {
      const res = await fetch(`${API}/api/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
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
    <div className="max-w-5xl mx-auto p-6">
      {/* Top row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Feed</h1>
        <div className="relative w-full md:w-96" ref={userSearchRef}>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Search users by name or email…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onFocus={() => setShowUserResults(true)}
          />
          {showUserResults && userQuery && (
            <div className="absolute z-10 bg-white border rounded mt-1 w-full max-h-64 overflow-auto shadow">
              {userSearching && <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>}
              {!userSearching && userResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
              )}
              {userResults.map((u) => (
                <Link
                  key={u.uid}
                  to={`/profile/${u.uid}`}
                  className="block px-3 py-2 hover:bg-gray-100"
                  onClick={() => setShowUserResults(false)}
                >
                  <div className="font-medium">{u.name || u.username || "Unknown"}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      {!composerOpen ? (
        <div className="border bg-white rounded p-3 cursor-text" onClick={() => setComposerOpen(true)}>
          <div className="text-gray-500">Write something or attach a movie…</div>
        </div>
      ) : (
        <div className="border bg-white rounded p-4 mb-6">
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded px-3 py-2"
                placeholder="Search a movie…"
                value={movieQuery}
                onChange={(e) => setMovieQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchMovies())}
              />
              <button
                onClick={searchMovies}
                className="px-4 py-2 bg-purple-700 text-white rounded"
                disabled={movieLoading}
              >
                {movieLoading ? "Searching…" : "Find"}
              </button>
            </div>

            {movieResults.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {movieResults.map((m) => (
                  <button
                    key={m.id}
                    className="text-left border rounded overflow-hidden hover:shadow"
                    onClick={() => {
                      setSelectedMovie({ id: m.id, title: m.title, poster_path: m.poster_path || "" });
                      setMovieResults([]); setMovieQuery(m.title);
                    }}
                  >
                    {m.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} alt={m.title} className="w-full" />
                    ) : (
                      <div className="h-32 flex items-center justify-center bg-gray-100 text-gray-500">No Image</div>
                    )}
                    <div className="p-2 text-sm font-medium">{m.title}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedMovie && (
              <div className="mt-3 flex items-center gap-3">
                {postMoviePreviewUrl ? (
                  <img src={postMoviePreviewUrl} alt={selectedMovie.title} className="w-16 h-24 object-cover rounded" />
                ) : (
                  <div className="w-16 h-24 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">No Image</div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{selectedMovie.title}</div>
                  <button className="text-red-600 text-sm mt-1" onClick={() => setSelectedMovie(null)}>Remove</button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <button
              className="px-4 py-2 rounded border"
              onClick={() => { setComposerOpen(false); setText(""); setSelectedMovie(null); setMovieResults([]); setMovieQuery(""); }}
            >
              Cancel
            </button>
            <button className="px-4 py-2 rounded bg-purple-700 text-white" onClick={createPost}>Post</button>
          </div>
        </div>
      )}

      {/* FEED */}
      <div className="space-y-4">
        {posts.map((p) => (
          <PostCard
            key={p._id}
            post={p}
            currentUid={user.uid}
            onToggleLike={() => toggleLike(p._id)}
            onAddComment={(txt, clear) => addComment(p._id, txt, clear)}
            onToggleFollow={() => toggleFollow(p.userId)}
            onShare={() => sharePost(p._id)}
          />
        ))}
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
    <div className="border bg-white rounded p-3 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${post.userId}`} className="text-blue-600 hover:underline font-semibold">
            {post.userName || post.username || post.userId}
          </Link>
          {post.userId !== currentUid && <button className="text-xs px-2 py-1 rounded bg-blue-600 text-white" onClick={onToggleFollow}>+ Follow</button>}
        </div>
        <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
      </div>

      {/* Movie cover */}
      {post.movie?.posterPath && (
        <div className="relative w-64 mx-auto rounded overflow-hidden mb-2">
          <img src={`https://image.tmdb.org/t/p/w500${post.movie.posterPath}`} alt={post.movie.title} className="w-64 h-auto object-cover" />
          <button
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold hover:bg-purple-800"
            title="View Movie Details"
            onClick={() => setSelectedPostMovie(post.movie)}
          >
            i
          </button>
        </div>
      )}

      {/* Text */}
      <div className="mb-3 whitespace-pre-wrap">{post.text}</div>

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm">
        <button className="flex items-center gap-1" onClick={onToggleLike}>
          {liked ? <HeartSolid className="w-5 h-5 text-blue-600" /> : <HeartOutline className="w-5 h-5 text-gray-500" />}
          <span>({post.likes?.length || 0})</span>
        </button>
        <button className="hover:underline" onClick={() => setShowComments(s => !s)}>Comment ({post.comments?.length || 0})</button>
        <button className="hover:underline" onClick={onShare}>Share</button>
      </div>

      {/* Latest comment */}
      {latestComment && !showComments && (
        <>
          <div className="mt-2 text-sm">
            <Link to={`/profile/${latestComment.userId}`} className="font-medium text-blue-600 hover:underline">
              {latestComment.userName}
            </Link>
            : {latestComment.text}
          </div>
          {comments.length > 1 && (
            <button className="text-xs text-blue-600 hover:underline mt-1" onClick={() => setShowComments(true)}>
              View all {comments.length} comments
            </button>
          )}
        </>
      )}

      {/* Full comments section */}
      {showComments && (
        <div className="mt-3 border-t pt-3">
          <div className="space-y-2 mb-3">
            {commentsSorted.map((c, idx) => (
              <div key={idx} className="text-sm">
                <Link to={`/profile/${c.userId}`} className="font-medium text-blue-600 hover:underline">
                  {c.userName}
                </Link>
                : {c.text}
                <span className="text-xs text-gray-500 ml-2">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddComment(commentText, () => setCommentText(""))}
            />
            <button className="px-3 py-2 rounded bg-purple-700 text-white text-sm" onClick={() => onAddComment(commentText, () => setCommentText(""))}>Post</button>
          </div>
        </div>
      )}

      {/* Movie modal */}
      {selectedPostMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" onClick={() => setSelectedPostMovie(null)}>
          <div className="bg-white rounded max-w-lg w-full p-6 overflow-auto max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{selectedPostMovie.title}</h2>
            {selectedPostMovie.posterPath && <img src={`https://image.tmdb.org/t/p/w300${selectedPostMovie.posterPath}`} alt={selectedPostMovie.title} className="mb-4 rounded mx-auto" />}
            {selectedPostMovie.releaseDate && <p className="mb-2"><strong>Release Date:</strong> {selectedPostMovie.releaseDate}</p>}
            {selectedPostMovie.overview && <p className="text-gray-700">{selectedPostMovie.overview}</p>}
            <div className="mt-6 text-right">
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded" onClick={() => setSelectedPostMovie(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

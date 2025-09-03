import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

const API = import.meta.env.VITE_API_URL || "https://patient-determination-production.up.railway.app";

export default function PostDetail({ user }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/api/posts/${postId}`);
        if (!res.ok) throw new Error(res.status === 404 ? "Post not found" : "Failed to fetch post");
        const data = await res.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const toggleLike = async () => {
    if (!user?.uid || liking) return;
    setLiking(true);
    try {
      const res = await fetch(`${API}/api/posts/${post._id}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();
      setPost(prev => ({ ...prev, likes: data.likes }));
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  };

  const addComment = async () => {
    if (!user?.uid || !commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${API}/api/posts/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, text: commentText }),
      });
      if (!res.ok) throw new Error("Failed to comment");
      const data = await res.json();
      setPost(prev => ({ ...prev, comments: data.comments }));
      setCommentText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto p-6 flex justify-center items-center h-96">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !post) return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <p className="text-red-500 text-lg mb-4">{error || "Post not found"}</p>
      <button
        onClick={() => navigate(-1)}
        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2 mx-auto"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Go Back
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24 sm:pb-6">
  {/* Back Button */}
  <button
    onClick={() => navigate(-1)}
    className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
  >
    <ArrowLeftIcon className="w-4 h-4" /> Back
  </button>

  {/* Post Card */}
  <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 space-y-4">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 break-words">{post.username || post.userName || 'Anonymous'}</h2>
        <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}</p>
      </div>
    </div>

    {/* Post Text */}
    {post.text && <p className="text-gray-800 whitespace-pre-wrap break-words">{post.text}</p>}

    {/* Movie Section */}
    {(post.type === "movie_activity" && post.movieActivity) || post.movie ? (
      <div className="mt-4 p-3 sm:p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
        <img
          src={`https://image.tmdb.org/t/p/w300${post.movieActivity?.movie?.posterPath || post.movie?.posterPath}`}
          alt={post.movieActivity?.movie?.title || post.movie?.title}
          className="w-32 sm:w-40 h-48 sm:h-60 object-cover rounded"
        />
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h3 className="font-semibold text-gray-900 break-words">{post.movieActivity?.movie?.title || post.movie?.title}</h3>
          {(post.movieActivity?.movie?.releaseDate || post.movie?.releaseDate) && (
            <p className="text-sm text-gray-600">({new Date(post.movieActivity?.movie?.releaseDate || post.movie?.releaseDate).getFullYear()})</p>
          )}
          {(post.movieActivity?.movie?.overview || post.movie?.overview) && (
            <p className="text-sm text-gray-600 line-clamp-3">{post.movieActivity?.movie?.overview || post.movie?.overview}</p>
          )}
        </div>
      </div>
    ) : null}

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t">
      <button
        onClick={toggleLike}
        disabled={liking || !user}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg w-full sm:w-auto transition-colors ${
          post.likes?.includes(user?.uid) ? "text-red-500 bg-red-50 hover:bg-red-100" : "hover:bg-gray-100"
        }`}
      >
        {post.likes?.includes(user?.uid) ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
        <span>{post.likes?.length || 0} Like{(post.likes?.length || 0) !== 1 ? "s" : ""}</span>
      </button>
      <div className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto">
        <ChatBubbleLeftIcon className="w-5 h-5" />
        <span>{post.comments?.length || 0} Comment{(post.comments?.length || 0) !== 1 ? "s" : ""}</span>
      </div>
    </div>

    {/* Comments Section */}
    <div className="mt-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Comments</h3>

      {user ? (
        <div className="flex flex-col gap-3">
          <textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
          <button
            onClick={addComment}
            disabled={submittingComment || !commentText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {submittingComment ? "Posting..." : "Post Comment"}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">Please log in to comment.</div>
      )}

      <div className="space-y-3">
        {post.comments && post.comments.length > 0 ? (
          post.comments.map((comment, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row justify-between mb-1">
                <span className="font-medium text-gray-900">{comment.userName || comment.username || "Anonymous"}</span>
                <span className="text-sm text-gray-500">{comment.createdAt && new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.text}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-2" />
            <p>No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  </div>
</div>

    
  );
}

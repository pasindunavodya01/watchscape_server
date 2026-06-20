import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ProfileLink from "../components/ProfileLink";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { API } from "../config";

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
    <div className="max-w-2xl mx-auto p-6 flex justify-center items-center h-96">
      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !post) return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <p className="text-red-500 text-lg mb-4">{error || "Post not found"}</p>
      <button
        onClick={() => navigate(-1)}
        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Go Back
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 sm:pb-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-xl text-slate-600 font-medium text-sm transition-all flex items-center gap-2 w-fit"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </button>

      {/* Post Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {post.userProfilePic ? (
              <img src={post.userProfilePic} alt={post.user?.name || post.userName || 'Author'} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <ProfileLink 
              uid={post.userId}
              className="font-semibold text-slate-800 hover:text-violet-600 transition-colors block truncate text-base sm:text-lg"
            >
              {post.username || post.userName || 'Anonymous'}
            </ProfileLink>
            {post.createdAt && (
              <p className="text-xs sm:text-sm text-slate-400">
                {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Post Text */}
        {post.text && (
          <div className="px-4 sm:px-5 pb-3">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.text}</p>
          </div>
        )}

        {/* Movie Section */}
        {(post.type === "movie_activity" && post.movieActivity) || post.movie ? (
          <div className="mx-4 sm:mx-5 mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start p-3 sm:p-4">
            <img
              src={`https://image.tmdb.org/t/p/w300${post.movieActivity?.movie?.posterPath || post.movie?.posterPath}`}
              alt={post.movieActivity?.movie?.title || post.movie?.title}
              className="w-32 sm:w-28 h-48 sm:h-40 object-cover rounded-lg shadow-sm flex-shrink-0"
            />
            <div className="flex-1 text-center sm:text-left space-y-1.5 pt-1">
              <h3 className="font-semibold text-slate-800 break-words text-lg sm:text-base">
                {post.movieActivity?.movie?.title || post.movie?.title}
              </h3>
              {(post.movieActivity?.movie?.releaseDate || post.movie?.releaseDate) && (
                <p className="text-sm text-slate-500">
                  {new Date(post.movieActivity?.movie?.releaseDate || post.movie?.releaseDate).getFullYear()}
                </p>
              )}
              {(post.movieActivity?.movie?.overview || post.movie?.overview) && (
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mt-2">
                  {post.movieActivity?.movie?.overview || post.movie?.overview}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center gap-5">
          <button
            onClick={toggleLike}
            disabled={liking || !user}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-150 ${
              post.likes?.includes(user?.uid) ? "text-rose-500 hover:text-rose-600" : "text-slate-500 hover:text-rose-500"
            }`}
          >
            {post.likes?.includes(user?.uid) ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
            <span>{post.likes?.length || 0} Like{(post.likes?.length || 0) !== 1 ? "s" : ""}</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <ChatBubbleLeftIcon className="w-5 h-5" />
            <span>{post.comments?.length || 0} Comment{(post.comments?.length || 0) !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

        {/* Comments Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-4 p-4 sm:p-5">
        <h3 className="font-bold text-slate-800 mb-4 text-lg">Comments</h3>

          {user ? (
          <div className="flex gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex-shrink-0">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full p-3 border border-slate-200 rounded-xl resize-none text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none bg-slate-50 text-slate-800 placeholder-slate-400"
                rows={2}
              />
              <div className="flex justify-end">
                <button
                  onClick={addComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="px-5 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
            </div>
          ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm mb-6 border border-slate-100">
            Please log in to comment.
          </div>
          )}

          <div className="space-y-3">
            {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mt-1">
                    {comment.userProfilePic ? (
                      <img src={comment.userProfilePic} alt={comment.userName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <ProfileLink 
                        uid={comment.userId}
                        className="font-semibold text-slate-800 hover:text-violet-600 transition-colors cursor-pointer text-sm"
                      >
                        {comment.userName || comment.username || "Anonymous"}
                      </ProfileLink>
                      <span className="text-xs text-slate-400">
                        {comment.createdAt && new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                  </div>
                </div>
                ))
              ) : (
            <div className="text-center py-8 text-slate-500">
              <ChatBubbleLeftIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No comments yet</p>
              <p className="text-sm mt-1">Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
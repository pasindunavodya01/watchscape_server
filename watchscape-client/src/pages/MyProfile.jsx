import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  PencilIcon,
  InformationCircleIcon,
  StarIcon
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

export default function MyProfile({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const postsLimit = 6;
  const [postsHasMore, setPostsHasMore] = useState(false);
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

  // New states for interactions
  const [likingPosts, setLikingPosts] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [submittingComments, setSubmittingComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [selectedPostMovie, setSelectedPostMovie] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editSocialLinks, setEditSocialLinks] = useState({
    instagram: "",
    facebook: "",
    github: "",
    website: "",
    custom: []
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset); 
    formData.append("cloud_name", cloudName); 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.secure_url) {
        await fetch(`${API}/api/users/${user.uid}/profile-pic`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePic: data.secure_url }),
        });
        
        setProfile(prev => ({
          ...prev,
          user: { ...prev.user, profilePic: data.secure_url }
        }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchProfile = async () => {
    try {
      // If no authenticated user or browsing as guest, don't call user-specific API
      if (!user?.uid || user?.isGuest) {
        setProfile({ user: { name: "Guest", username: "guest" }, followersCount: 0, followingCount: 0, pinnedFilms: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await fetch(
        `${API}/api/users/${user.uid}/profile?viewerUid=${user.uid}`
      );
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      if (data.user) {
        setEditBio(data.user.bio || "");
        setEditSocialLinks({
          instagram: data.user.socialLinks?.instagram || "",
          facebook: data.user.socialLinks?.facebook || "",
          github: data.user.socialLinks?.github || "",
          website: data.user.socialLinks?.website || "",
          custom: data.user.socialLinks?.custom || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPosts = async (pageNum = 1) => {
    setPostsLoading(true);
    try {
      if (!user?.uid || user?.isGuest) {
        setPosts([]);
        setPostsHasMore(false);
        return;
      }
      const res = await fetch(`${API}/api/posts?userId=${user.uid}&page=${pageNum}&limit=${postsLimit}`);
      const data = await res.json();
      const postsArray = Array.isArray(data) ? data : [];
      if (pageNum === 1) {
        setPosts(postsArray);
      } else {
        setPosts((prev) => [...prev, ...postsArray]);
      }
      setPostsHasMore(postsArray.length === postsLimit);
    } catch (err) {
      console.error(err);
      if (pageNum === 1) setPosts([]);
      setPostsHasMore(false);
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
    if (!window.confirm("Are you sure you want to unpin this movie?")) return;
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

  // New interaction functions
  const toggleLike = async (postId) => {
    if (!user?.uid || likingPosts[postId]) return;
    
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
    if (!user?.uid || !commentText?.trim() || submittingComments[postId]) return;
    
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

  const toggleCommentsView = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const addMovie = async (movie, status) => {
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

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(`${API}/api/users/${user.uid}/edit-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: editBio, socialLinks: editSocialLinks }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      
      setProfile(prev => ({
        ...prev,
        user: { ...prev.user, bio: editBio, socialLinks: editSocialLinks }
      }));
      setIsEditingProfile(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    }
  };

  const handleAddCustomLink = () => {
    setEditSocialLinks(prev => ({
      ...prev,
      custom: [...(prev.custom || []), { name: "", url: "" }]
    }));
  };

  const handleCustomLinkChange = (index, field, value) => {
    const newCustom = [...(editSocialLinks.custom || [])];
    newCustom[index][field] = value;
    setEditSocialLinks({ ...editSocialLinks, custom: newCustom });
  };

  const handleRemoveCustomLink = (index) => {
    const newCustom = [...(editSocialLinks.custom || [])];
    newCustom.splice(index, 1);
    setEditSocialLinks({ ...editSocialLinks, custom: newCustom });
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

  // Enhanced render post function
  const renderPost = (post) => {
    const isLiked = post.likes?.includes(user?.uid);
    const commentText = commentTexts[post._id] || "";
    const isSubmittingComment = submittingComments[post._id];
    const isLikingPost = likingPosts[post._id];
    const showingComments = showComments[post._id];

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
                <button
                  onClick={() => toggleCommentsView(post._id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>
            </div>

            {/* Comments section */}
            {showingComments && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex gap-2 mb-3">
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
                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {post.comments.map((comment, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
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
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first!</p>
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
        {getMoviePoster(post) && (
          <div className="relative bg-gray-100 overflow-hidden">
            <img
              src={getMoviePoster(post)}
              alt={getMovieTitle(post)}
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
          {getActionText(post) && (
            <div className="text-sm text-gray-600 mb-2 font-medium">
              {getActionText(post)}: {getMovieTitle(post)}
            </div>
          )}
          
          {post.text && (
            <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.text}</p>
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
              <button
                onClick={() => toggleCommentsView(post._id)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{post.comments?.length || 0}</span>
              </button>
            </div>
          </div>

          {/* Comments section */}
          {showingComments && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex gap-2 mb-3">
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
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {post.comments.map((comment, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
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
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first!</p>
              )}
            </div>
          )}

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
    setPostsPage(1);
    fetchMyPosts(1);
  }, [user]);

  // If browsing as guest, show a simple login prompt instead of profile content
  if (!user?.uid || user?.isGuest) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Please sign in to view your profile</h2>
          <p className="text-gray-600 mb-6">Create an account or log in to access your profile and posts.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-5 py-2 border border-gray-300 rounded-lg"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
          <div 
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center relative group cursor-pointer overflow-hidden flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {profile.user.profilePic ? (
              <img src={profile.user.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingImage ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-white text-xs sm:text-sm font-medium">Edit</span>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          <div className="flex-1 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {profile.user.name || profile.user.username || "My Profile"}
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
              
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="ml-auto px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 flex items-center gap-2 transition-colors"
              >
                <PencilIcon className="w-4 h-4" /> 
                <span className="hidden sm:inline">Edit Profile</span>
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
                    <button 
                      onClick={() => setSelectedPostMovie({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        release_date: movie.release_date,
                        overview: movie.overview,
                        backdrop_path: movie.backdrop_path,
                        genre_ids: movie.genre_ids,
                        vote_average: movie.vote_average,
                      })}
                      className="absolute top-2 left-2 w-8 h-8 bg-black bg-opacity-60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-opacity-80"
                    >
                      <InformationCircleIcon className="w-4 h-4" />
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
                  <button 
                    onClick={() => setSelectedPostMovie({
                      id: film.tmdbId || film.id,
                      title: film.title,
                      poster_path: film.posterPath || film.poster_path,
                      release_date: film.releaseDate || film.release_date,
                      overview: film.overview,
                      backdrop_path: film.backdropPath || film.backdrop_path,
                      genre_ids: film.genre_ids,
                      vote_average: film.vote_average,
                    })}
                    className="absolute top-2 left-2 w-8 h-8 bg-black bg-opacity-60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-opacity-80"
                  >
                    <InformationCircleIcon className="w-4 h-4" />
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
          <>
            <div className="grid sm:grid-cols-2 gap-6">
              {posts.map(renderPost)}
            </div>
            {postsHasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    const next = postsPage + 1;
                    setPostsPage(next);
                    fetchMyPosts(next);
                  }}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-purple-600 font-medium hover:bg-gray-50"
                  disabled={postsLoading}
                >
                  {postsLoading ? "Loading..." : "Load More Posts"}
                </button>
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
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        {f.profilePic ? (
                          <img src={f.profilePic} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
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
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                        {f.profilePic ? (
                          <img src={f.profilePic} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
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
              <div className="sm:hidden flex flex-col gap-3 mt-4">
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

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-lg text-gray-900">Edit Profile</h2>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us a little about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-right text-xs text-gray-500 mt-1">{editBio.length}/160</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2 mb-3">Social Links</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    <input
                      type="url"
                      placeholder="Instagram URL"
                      value={editSocialLinks.instagram}
                      onChange={(e) => setEditSocialLinks({...editSocialLinks, instagram: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                    />
                  </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                <input
                  type="url"
                  placeholder="Facebook URL"
                  value={editSocialLinks.facebook}
                  onChange={(e) => setEditSocialLinks({...editSocialLinks, facebook: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                />
              </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
                    <input
                      type="url"
                      placeholder="GitHub URL"
                      value={editSocialLinks.github}
                      onChange={(e) => setEditSocialLinks({...editSocialLinks, github: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    <input
                      type="url"
                      placeholder="Personal Website URL"
                      value={editSocialLinks.website}
                      onChange={(e) => setEditSocialLinks({...editSocialLinks, website: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                    />
                  </div>

              {/* Custom Links Edit */}
              <div className="pt-3 border-t mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Additional Links</span>
                  <button type="button" onClick={handleAddCustomLink} className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 font-medium transition-colors">+ Add Link</button>
                </div>
                <div className="space-y-3">
                  {editSocialLinks.custom?.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Name (e.g. TikTok)"
                        value={link.name}
                        onChange={(e) => handleCustomLinkChange(idx, 'name', e.target.value)}
                        className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => handleCustomLinkChange(idx, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      />
                      <button type="button" onClick={() => handleRemoveCustomLink(idx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
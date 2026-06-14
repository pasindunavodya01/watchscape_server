import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLink from "../components/ProfileLink";
import {
  BellIcon, HeartIcon, ChatBubbleLeftIcon, ShareIcon,
  UserPlusIcon, DocumentTextIcon, FilmIcon, EyeIcon, UserIcon, CheckIcon
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  UserPlusIcon as UserPlusSolid,
  FilmIcon as FilmSolid
} from "@heroicons/react/24/solid";
import { API } from "../config";

const TYPE_CONFIG = {
  like:           { icon: HeartSolid,    color: 'bg-rose-500/20 text-rose-400',    border: 'border-l-rose-500',    label: 'liked your post' },
  comment:        { icon: ChatBubbleLeftIcon, color: 'bg-blue-500/20 text-blue-400', border: 'border-l-blue-500', label: 'commented on your post' },
  share:          { icon: ShareIcon,     color: 'bg-green-500/20 text-green-400',  border: 'border-l-green-500',   label: 'shared your post' },
  follow:         { icon: UserPlusSolid, color: 'bg-violet-500/20 text-violet-400',border: 'border-l-violet-500', label: 'followed you' },
  post:           { icon: DocumentTextIcon,color:'bg-indigo-500/20 text-indigo-400',border:'border-l-indigo-500', label: 'posted something new' },
  movie_activity: { icon: FilmSolid,    color: 'bg-amber-500/20 text-amber-400',  border: 'border-l-amber-500',   label: 'movie activity' },
};

function NotificationItem({ notification, onMarkRead, onViewPost, onViewProfile }) {
  const config = TYPE_CONFIG[notification.type] || { icon: BellIcon, color: 'bg-slate-500/20 text-slate-400', border: 'border-l-slate-500' };
  const Icon = config.icon;
  const isRead = notification.isRead;

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-xl border-l-4 transition-all duration-200 ${config.border} ${
        isRead ? 'bg-white border border-slate-200 border-l-[4px]' : 'bg-violet-50/50 border border-violet-100 border-l-[4px]'
      }`}
      onClick={() => !isRead && onMarkRead(notification._id)}
    >
      {/* Icon / Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {notification.senderProfilePic ? (
          <div className="relative">
            <img
              src={notification.senderProfilePic}
              alt={notification.senderName}
              className="w-9 h-9 rounded-full object-cover"
            />
            {/* Type badge */}
            <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center ${config.color} border border-white`}>
              <Icon className="w-2.5 h-2.5" />
            </div>
          </div>
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${config.color}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${isRead ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
          <ProfileLink
            uid={notification.senderUid}
            className="font-semibold text-violet-600 hover:text-violet-500 transition-colors"
            onClick={() => onMarkRead(notification._id)}
          >
            {notification.senderName}
          </ProfileLink>
          {' '}{notification.message}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-slate-400">{timeAgo(notification.createdAt)}</span>
          {!isRead && (
            <span className="inline-flex items-center gap-1 text-xs text-violet-500 font-medium">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              New
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-2.5">
          {notification.type === 'follow' && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(notification.senderUid, notification._id); }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <UserIcon className="w-3 h-3" /> View Profile
            </button>
          )}
          {['like', 'comment', 'share'].includes(notification.type) && notification.postId && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewPost(notification.postId, notification._id); }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg transition-colors"
            >
              <EyeIcon className="w-3 h-3" /> View Post
            </button>
          )}
        </div>
      </div>

      {/* Read indicator */}
      {!isRead && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-violet-500 rounded-full mt-1.5" />
        </div>
      )}
    </div>
  );
}

function SkeletonNotification() {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 animate-pulse">
      <div className="w-9 h-9 rounded-full skeleton-light flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 skeleton-light rounded w-3/4" />
        <div className="h-3 skeleton-light rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Notifications({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum = 1) => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/notifications/${user.uid}?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (pageNum === 1) setNotifications(data.notifications || []);
      else setNotifications(prev => [...prev, ...(data.notifications || [])]);
      setHasMore(data.notifications?.length === 20);
    } catch (err) { console.error(err); setHasMore(false); }
    finally { setLoading(false); }
  };

  const fetchUnreadCount = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API}/api/notifications/${user.uid}/unread-count`);
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    if (user?.uid) { fetchNotifications(); fetchUnreadCount(); }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API}/api/notifications/${user.uid}/read-all`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const loadMore = () => {
    if (!loading && hasMore) { const next = page + 1; setPage(next); fetchNotifications(next); }
  };

  const handleViewPost = (postId, notificationId) => {
    if (notificationId) markAsRead(notificationId);
    navigate(`/dashboard/posts/${postId}`);
  };

  const handleViewProfile = (senderUid, notificationId) => {
    if (notificationId) markAsRead(notificationId);
    const isMe = user?.uid === senderUid;
    navigate(isMe ? "/dashboard/my-profile" : `/dashboard/profile/${senderUid}`);
  };

  // Guest state
  if (!user?.uid || user?.isGuest) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <BellIcon className="w-10 h-10 text-violet-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Sign in to see notifications</h2>
          <p className="text-slate-500 text-sm mb-6">Get notified when people like, comment, or follow you.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login', { state: { from: '/dashboard/notifications' } })}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Log in
            </button>
            <button onClick={() => navigate('/signup')} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all">
              Sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-violet-600 font-medium">
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-200 transition-all"
          >
            <CheckIcon className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <SkeletonNotification key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <BellIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No notifications yet</h3>
          <p className="text-slate-400 text-sm">When people interact with your posts, it'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={markAsRead}
              onViewPost={handleViewPost}
              onViewProfile={handleViewProfile}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-medium text-sm transition-all disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
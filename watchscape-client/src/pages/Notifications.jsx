import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BellIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  UserPlusIcon,
  DocumentTextIcon,
  FilmIcon 
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  ChatBubbleLeftIcon as ChatBubbleSolid,
  ShareIcon as ShareSolid,
  UserPlusIcon as UserPlusSolid,
  DocumentTextIcon as DocumentTextSolid,
  FilmIcon as FilmSolid
} from "@heroicons/react/24/solid";

const API = "https://patient-determination-production.up.railway.app";

export default function Notifications({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1) => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/notifications/${user.uid}?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (pageNum === 1) setNotifications(data.notifications || []);
      else setNotifications(prev => [...prev, ...(data.notifications || [])]);
      setHasMore(data.notifications && data.notifications.length === 20);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count separately
  const fetchUnreadCount = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API}/api/notifications/${user.uid}/unread-count`);
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    await fetch(`${API}/api/notifications/${notificationId}/read`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await fetch(`${API}/api/notifications/${user.uid}/read-all`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  // ... Keep your JSX/UI code the same


  const getNotificationIcon = (type, isRead) => {
    const iconClass = `w-5 h-5 ${isRead ? 'text-gray-400' : 'text-blue-600'}`;
    
    switch (type) {
      case 'like':
        return isRead ? <HeartIcon className={iconClass} /> : <HeartSolid className={iconClass} />;
      case 'comment':
        return isRead ? <ChatBubbleLeftIcon className={iconClass} /> : <ChatBubbleSolid className={iconClass} />;
      case 'share':
        return isRead ? <ShareIcon className={iconClass} /> : <ShareSolid className={iconClass} />;
      case 'follow':
        return isRead ? <UserPlusIcon className={iconClass} /> : <UserPlusSolid className={iconClass} />;
      case 'post':
        return isRead ? <DocumentTextIcon className={iconClass} /> : <DocumentTextSolid className={iconClass} />;
      case 'movie_activity':
        return isRead ? <FilmIcon className={iconClass} /> : <FilmSolid className={iconClass} />;
      default:
        return <BellIcon className={iconClass} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like': return 'border-l-red-500';
      case 'comment': return 'border-l-blue-500';
      case 'share': return 'border-l-green-500';
      case 'follow': return 'border-l-purple-500';
      case 'post': return 'border-l-indigo-500';
      case 'movie_activity': return 'border-l-yellow-500';
      default: return 'border-l-gray-400';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BellIcon className="w-8 h-8 text-purple-700" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800 text-sm"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-2">
            When people interact with your posts or follow you, you'll see it here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`
                border-l-4 bg-white rounded-r-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer
                ${getNotificationColor(notification.type)}
                ${!notification.isRead ? 'bg-blue-50' : 'bg-white'}
              `}
              onClick={() => {
                if (!notification.isRead) {
                  markAsRead(notification._id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                {/* Notification Icon */}
                <div className="mt-1">
                  {getNotificationIcon(notification.type, notification.isRead)}
                </div>
                
                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        <Link 
                          to={`/dashboard/profile/${notification.senderUid}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {notification.senderName}
                        </Link>
                        {' '}
                        {notification.message}
                        {notification.movieTitle && (
                          <span className="text-purple-600 font-medium">
                            {' '}{notification.movieTitle}
                          </span>
                        )}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1">
                      {notification.postId && (
                        <Link
                          to={`/dashboard`} // You might want to create a specific post view route
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Post
                        </Link>
                      )}
                      
                      {notification.type === 'follow' && (
                        <Link
                          to={`/dashboard/profile/${notification.senderUid}`}
                          className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded text-purple-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Profile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
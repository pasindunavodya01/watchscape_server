import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BellIcon } from "@heroicons/react/24/outline";
import { BellIcon as BellSolid } from "@heroicons/react/24/solid";


const API = "https://patient-determination-production.up.railway.app";

export default function NotificationBadge({ user }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/notifications/${user.uid}/unread-count`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Link
      to="/dashboard/notifications"
      className="relative flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors"
      title="Notifications"
    >
      {unreadCount > 0 ? (
        <BellSolid className="w-6 h-6 text-purple-700" />
      ) : (
        <BellIcon className="w-6 h-6 text-gray-600" />
      )}
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
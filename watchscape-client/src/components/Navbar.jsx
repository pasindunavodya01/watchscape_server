import React, { useState, useEffect } from "react";
import { Bars3Icon, EllipsisVerticalIcon, ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBadge from "./NotificationBadge";
import { API } from "../config";

export default function Navbar({ user, onToggleRightbar, onOpenNotifications }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePic, setProfilePic] = useState(user?.photoURL || null);

  useEffect(() => {
    if (user?.uid && !user?.isGuest) {
      fetch(`${API}/api/users/${user.uid}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => {
          if (data.profilePic) setProfilePic(data.profilePic);
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-blue-600 shadow px-4 flex justify-between items-center z-50">
      {/* Left Section */}
      <div className="flex items-center space-x-4">

        <h1 className="text-xl font-bold text-white">WatchScape</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* User name - hidden on very small screens */}
        <span className="font-medium text-white hidden sm:inline">
          {user?.name || user?.email}
        </span>

        {/* Show Login button for guests */}
        {(!user?.uid || user?.isGuest) && (
          <button
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
            className="hidden sm:inline px-3 py-1 bg-white text-blue-600 rounded text-sm font-semibold hover:bg-gray-100 transition"
          >
            Login
          </button>
        )}

        {/* Notification Bell */}
        <NotificationBadge user={user} onOpenNotifications={onOpenNotifications} />

        {/* Mobile-login icon for guests */}
        {(!user?.uid || user?.isGuest) && (
          <button
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
            className="sm:hidden text-white p-2 rounded hover:bg-blue-500"
            aria-label="Login"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        )}


       
        {/* Avatar */}
        {profilePic ? (
          <img
            src={profilePic}
            alt="User Avatar"
            className="hidden sm:block w-10 h-10 rounded-full border-2 border-purple-700 object-cover"
          />
        ) : (
          <div className="hidden sm:flex w-10 h-10 rounded-full border-2 border-purple-700 bg-purple-100 items-center justify-center overflow-hidden">
            <UserIcon className="w-6 h-6 text-purple-600" />
          </div>
        )}

        {/* Three dots - Mobile only */}
        <button
          className="lg:hidden text-white p-2 rounded hover:bg-blue-500"
          onClick={onToggleRightbar}
          aria-label="Toggle rightbar"
        >
          <EllipsisVerticalIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

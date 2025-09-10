import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  XMarkIcon,
  BookmarkIcon,
  UsersIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const API = "https://patient-determination-production.up.railway.app"; // replace with your backend API

export default function Rightbar({
  counts = { watchlist: 0, watched: 0 },
  className = "",
  overlay = false,
  onClose,
}) {
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);
  const userSearchRef = useRef(null);

  // Search API call
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!userQuery.trim()) {
        setUserResults([]);
        setShowUserResults(false);
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
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setUserSearching(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [userQuery]);

  // Hide results on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) {
        setShowUserResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = () => {
    setShowUserResults(false);
    setUserQuery("");
    // Close the rightbar if it's an overlay (mobile)
    if (overlay && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`${className} bg-white shadow-xl border-l flex flex-col p-4 space-y-6 rounded-l-2xl`}
    >
      {/* Close button for mobile overlay */}
      {overlay && (
        <div className="flex justify-end p-2 border-b border-gray-200">
          <button
            onClick={onClose}
            aria-label="Close right sidebar"
            className="text-gray-500 hover:text-gray-800 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Stats Section */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
          <BookmarkIcon className="h-5 w-5 text-purple-600" />
          Your Stacks
        </h2>
        <div className="grid gap-3">
          <div className="p-3 rounded-xl bg-purple-50 flex items-center justify-between">
            <span className="font-medium text-gray-700">Watchlist</span>
            <span className="font-bold text-purple-700">{counts.watchlist}</span>
          </div>
          <div className="p-3 rounded-xl bg-green-50 flex items-center justify-between">
            <span className="font-medium text-gray-700">Watched (30d)</span>
            <span className="font-bold text-green-700">{counts.watched}</span>
          </div>
        </div>
      </section>

      {/* User Search */}
      <section ref={userSearchRef} className="relative">
        <h2 className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-purple-600" />
          Find Users
        </h2>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search users..."
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        {/* Results Dropdown */}
        {showUserResults && (
          <div className="absolute mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
            {userSearching ? (
              <div className="p-3 text-sm text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : userResults.length > 0 ? (
              userResults.map((u) => (
                <Link
                  key={u.uid}
                  to={`/dashboard/profile/${u.uid}`}
                  onClick={handleUserClick}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {u.name || u.username || u.email}
                    </p>
                    {u.name && u.username && (
                      <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500 text-center">
                <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No users found
              </div>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
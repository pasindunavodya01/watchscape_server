import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  BookmarkIcon,
  UsersIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const API = "http://localhost:5000"; // replace with your backend API

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

  // 🔍 Search API call
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

  // 🖱️ Hide results on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) {
        setShowUserResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* Follow Suggestions */}
      <section ref={userSearchRef}>
        <h2 className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-purple-600" />
          Follow Suggestions
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
          <div className="absolute mt-2 w-64 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
            {userSearching ? (
              <p className="p-3 text-sm text-gray-500">Searching...</p>
            ) : userResults.length > 0 ? (
              userResults.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://i.pravatar.cc/40?u=${u.uid}`}
                      alt={u.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium">{u.name || u.email}</span>
                  </div>
                  <button className="px-2 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                    Follow
                  </button>
                </div>
              ))
            ) : (
              <p className="p-3 text-sm text-gray-500">No users found</p>
            )}
          </div>
        )}
      </section>

      {/* Follow Requests */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
          <UserPlusIcon className="h-5 w-5 text-purple-600" />
          Follow Requests
        </h2>
        <p className="text-sm text-gray-500 italic">Coming soon...</p>
      </section>
    </aside>
  );
}

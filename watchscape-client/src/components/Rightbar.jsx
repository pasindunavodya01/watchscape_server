import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLink from "./ProfileLink";
import {
  XMarkIcon,
  BookmarkIcon,
  EyeIcon,
  UsersIcon,
  UserIcon,
  PowerIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { API } from "../config";

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-colors`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-slate-300">{label}</span>
      </div>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  );
}

export default function Rightbar({
  counts = { watchlist: 0, watched: 0 },
  className = "",
  overlay = false,
  onClose,
  onLogout,
  user,
}) {
  const navigate = useNavigate();
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);
  const userSearchRef = useRef(null);

  // Greeting
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.displayName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!userQuery.trim()) { setUserResults([]); setShowUserResults(false); return; }
      setUserSearching(true);
      try {
        const res = await fetch(`${API}/api/users?q=${encodeURIComponent(userQuery)}`);
        const data = await res.json();
        if (active) { setUserResults(data); setShowUserResults(true); }
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

  const handleUserClick = () => {
    setShowUserResults(false);
    setUserQuery("");
    if (overlay && onClose) onClose();
  };

  return (
    <aside className={`${className} bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto`}>
      {/* Close button (mobile) */}
      {overlay && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <span className="text-white font-semibold text-sm">Menu</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex-1 p-4 space-y-5">
        {/* Greeting */}
        {user && !user.isGuest && (
          <div className="animate-fade-in">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">{greeting}</p>
            <p className="text-white font-semibold text-base truncate">{firstName} 👋</p>
          </div>
        )}

        {/* Stats */}
        {user && !user.isGuest && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Your Stats</h2>
            <div className="space-y-2">
              <StatCard
                label="Watchlist"
                value={counts.watchlist}
                color="bg-violet-600/20 text-violet-400"
                icon={BookmarkIcon}
              />
              <StatCard
                label="Watched (30d)"
                value={counts.watched}
                color="bg-emerald-600/20 text-emerald-400"
                icon={EyeIcon}
              />
            </div>
          </section>
        )}

        {/* User Search */}
        <section ref={userSearchRef} className="relative">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Find Users</h2>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            />
          </div>

          {/* Results dropdown */}
          {showUserResults && (
            <div className="absolute mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-dark-lg max-h-60 overflow-y-auto z-50 animate-fade-in">
              {userSearching ? (
                <div className="p-3 text-sm text-slate-400 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : userResults.length > 0 ? (
                userResults.map((u) => (
                  <ProfileLink
                    key={u.uid}
                    uid={u.uid}
                    onClick={handleUserClick}
                    className="flex items-center gap-3 px-3 py-3 hover:bg-slate-700/60 transition-colors cursor-pointer border-b border-slate-700/50 last:border-b-0"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {u.profilePic ? (
                        <img src={u.profilePic} alt={u.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{u.name || u.username || u.email}</p>
                      {u.username && <p className="text-xs text-slate-500 truncate">@{u.username}</p>}
                    </div>
                  </ProfileLink>
                ))
              ) : (
                <div className="p-4 text-center">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm text-slate-500">No users found</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Quick nav for mobile overlay */}
        {overlay && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Access</h2>
            <div className="space-y-1">
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Watchlist', path: '/dashboard/watchlist' },
                { label: 'Watched', path: '/dashboard/watched' },
                { label: 'My Profile', path: '/dashboard/my-profile' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); if (onClose) onClose(); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile logout */}
      {overlay && onLogout && user && !user.isGuest && (
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200"
          >
            <PowerIcon className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
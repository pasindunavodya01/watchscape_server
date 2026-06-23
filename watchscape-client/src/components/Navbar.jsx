import React, { useState, useEffect } from "react";
import { Bars3Icon, ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/24/outline";
import { useNavigate, useLocation, Link } from 'react-router-dom';
import NotificationBadge from "./NotificationBadge";
import { API } from "../config";

export default function Navbar({ user, onToggleSidebar, onToggleRightbar, onOpenNotifications }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePic, setProfilePic] = useState(user?.photoURL || null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user?.uid && !user?.isGuest) {
      fetch(`${API}/api/users/${user.uid}`)
        .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
        .then((data) => { if (data.profilePic) setProfilePic(data.profilePic); })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const initials = (() => {
    const name = user?.displayName || user?.name || user?.email || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  })();

  return (
    <header
      className={`mobile-chrome-aware app-header fixed top-0 left-0 w-full z-50 flex items-center px-4 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-dark border-b border-slate-800/80'
          : 'bg-slate-900 border-b border-slate-800'
      }`}
    >
      {/* Left: brand */}
      <div className="flex items-center gap-3 flex-1">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
            <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="6" width="20" height="13" rx="2" />
              <path strokeLinecap="round" d="M2 10h20M7 6V4M17 6V4M7 10v9M17 10v9M12 10v9" />
            </svg>
          </div>
          <span className="text-white font-bold text-base tracking-tight block">
            Watch<span className="text-violet-400">scape</span>
          </span>
        </Link>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Guest login button */}
        {(!user?.uid || user?.isGuest) && (
          <button
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-brand"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Log in
          </button>
        )}

        {/* Notification bell */}
        <NotificationBadge user={user} onOpenNotifications={onOpenNotifications} />

        {/* User name (desktop) */}
        {user && !user.isGuest && (
          <span className="hidden md:block text-sm font-medium text-slate-400 max-w-[120px] truncate">
            {user?.displayName || user?.name || user?.email?.split('@')[0]}
          </span>
        )}

        {/* Avatar (desktop) */}
        {user && !user.isGuest && (
          <div className="hidden sm:block">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Avatar"
                className="w-9 h-9 rounded-full border-2 border-violet-600/50 object-cover hover:border-violet-500 transition-colors cursor-pointer"
                onClick={() => navigate('/dashboard/my-profile')}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full border-2 border-violet-600/50 bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:border-violet-500 transition-colors"
                onClick={() => navigate('/dashboard/my-profile')}
              >
                {initials}
              </div>
            )}
          </div>
        )}

        {/* Mobile: guest login icon */}
        {(!user?.uid || user?.isGuest) && (
          <button
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
            className="sm:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Login"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        )}

        {/* Mobile: three-dots toggle for rightbar */}
        <button
          className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          onClick={onToggleRightbar}
          aria-label="Toggle options"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
    </header>
  );
}

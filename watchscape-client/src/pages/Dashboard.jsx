import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  HomeIcon, MagnifyingGlassIcon, BookmarkIcon, EyeIcon, UserIcon, BellIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid, MagnifyingGlassIcon as SearchSolid,
  BookmarkIcon as BookmarkSolid, EyeIcon as EyeSolid,
  UserIcon as UserSolid, BellIcon as BellSolid,
} from "@heroicons/react/24/solid";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Rightbar from "../components/Rightbar";
import { API } from "../config";

import Home from "./Home";
import Search from "./Search";
import Watchlist from "./Watchlist";
import Watched from "./Watched";
import Profile from "./Profile";
import MyProfile from "./MyProfile";
import Notifications from "./Notifications";

const mobileNav = [
  { to: "/dashboard",               icon: HomeIcon,           iconA: HomeSolid,     label: "Home",      end: true },
  { to: "/dashboard/search",        icon: MagnifyingGlassIcon,iconA: SearchSolid,   label: "Search" },
  { to: "/dashboard/watchlist",     icon: BookmarkIcon,       iconA: BookmarkSolid, label: "Watchlist" },
  { to: "/dashboard/watched",       icon: EyeIcon,            iconA: EyeSolid,      label: "Watched" },
  { to: "/dashboard/my-profile",    icon: UserIcon,           iconA: UserSolid,     label: "Profile" },
];

export default function Dashboard({ user, onLogout }) {
  const [counts, setCounts] = useState({ watchlist: 0, watched: 0 });
  const [rightbarOpen, setRightbarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const refreshCounts = async () => {
    if (!user?.uid || user?.isGuest) return;
    try {
      const res = await fetch(`${API}/api/movies/stats?userId=${user.uid}`);
      const data = await res.json();
      setCounts({ watchlist: data.watchlistCount, watched: data.watchedRecentCount });
    } catch (err) { console.error("Failed to fetch movie counts", err); }
  };

  useEffect(() => { refreshCounts(); }, [user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { setRightbarOpen(false); setSidebarOpen(false); }
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Fixed top navbar */}
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onToggleRightbar={() => { setRightbarOpen(prev => !prev); setSidebarOpen(false); }}
        onOpenNotifications={() => { setRightbarOpen(false); setSidebarOpen(false); }}
      />

      {/* Main layout row */}
      <div className="flex flex-grow pt-16 min-h-[calc(100vh-64px)]">
        {/* Desktop sidebar */}
        <Sidebar
          user={user}
          onLogout={onLogout}
          className="hidden md:flex fixed top-16 left-0 w-60 h-[calc(100vh-64px)]"
        />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <Sidebar
              user={user}
              onLogout={onLogout}
              overlay
              onClose={() => setSidebarOpen(false)}
              className="fixed top-16 left-0 w-64 h-[calc(100vh-64px)] z-50 animate-fade-in-left"
            />
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        {/* Main content */}
        <main className="flex-grow min-h-[calc(100vh-64px)] overflow-auto md:ml-60 lg:mr-72 bg-slate-50 pb-24 md:pb-0">
          <Routes>
            <Route index element={<Home user={user} onMovieChange={refreshCounts} />} />
            <Route path="search"         element={<Search user={user} onMovieChange={refreshCounts} />} />
            <Route path="notifications"  element={<Notifications user={user} />} />
            <Route path="watchlist"      element={<Watchlist user={user} onMovieChange={refreshCounts} />} />
            <Route path="watched"        element={<Watched user={user} onMovieChange={refreshCounts} />} />
            <Route path="my-profile"     element={<MyProfile user={user} onLogout={onLogout} />} />
            <Route path="profile/:userId"element={<Profile user={user} />} />
          </Routes>
          <Outlet />
        </main>

        {/* Desktop rightbar */}
        <Rightbar
          counts={counts}
          user={user}
          className="hidden lg:flex fixed top-16 right-0 w-72 h-[calc(100vh-64px)]"
        />

        {/* Mobile rightbar overlay */}
        {rightbarOpen && (
          <>
            <Rightbar
              counts={counts}
              overlay
              onClose={() => setRightbarOpen(false)}
              user={user}
              onLogout={onLogout}
              className="fixed top-16 right-0 w-72 h-[calc(100vh-64px)] z-50 animate-slide-in-right overflow-y-auto"
            />
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => setRightbarOpen(false)}
            />
          </>
        )}

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-20 z-50 safe-area-bottom pb-2">
          {mobileNav.map(({ to, icon: Icon, iconA: IconA, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  isActive ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive
                    ? <IconA className="w-5 h-5" />
                    : <Icon className="w-5 h-5" />
                  }
                  <span className="text-[10px] font-medium">{label}</span>
                  {/* Active dot */}
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 bg-violet-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

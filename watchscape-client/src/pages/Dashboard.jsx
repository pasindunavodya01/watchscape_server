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
import useBodyScrollLock from "../hooks/useBodyScrollLock";
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

  useBodyScrollLock(sidebarOpen || rightbarOpen);

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
    <div className="flex flex-col bg-slate-950 min-h-app-vh md:h-screen-dvh md:overflow-hidden">
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onToggleRightbar={() => { setRightbarOpen(prev => !prev); setSidebarOpen(false); }}
        onOpenNotifications={() => { setRightbarOpen(false); setSidebarOpen(false); }}
      />

      <div className="flex flex-grow pt-16 md:min-h-0 md:overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar
          user={user}
          onLogout={onLogout}
          className="hidden md:flex fixed top-16 left-0 w-60 h-below-nav"
        />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <Sidebar
              user={user}
              onLogout={onLogout}
              overlay
              onClose={() => setSidebarOpen(false)}
              className="mobile-overlay-panel left-0 w-64 z-50 animate-fade-in-left"
            />
            <div
              className="mobile-overlay-backdrop bg-black/50 z-40 animate-fade-in"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        {/* Main: document scroll on mobile, inner scroll on desktop */}
        <main className="flex-grow bg-slate-50 md:overflow-auto md:ml-60 lg:mr-72 pb-mobile-nav md:pb-0 md:min-h-0 md:h-below-nav">
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
          className="hidden lg:flex fixed top-16 right-0 w-72 h-below-nav"
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
              className="mobile-overlay-panel right-0 w-72 z-50 animate-slide-in-right"
            />
            <div
              className="mobile-overlay-backdrop bg-black/50 z-40 animate-fade-in"
              onClick={() => setRightbarOpen(false)}
            />
          </>
        )}

        {/* Mobile bottom nav — pinned to visible viewport bottom */}
        <nav className="md:hidden mobile-bottom-nav bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex justify-around items-stretch no-select h-16">
          {mobileNav.map(({ to, icon: Icon, iconA: IconA, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center flex-1 min-w-[56px] min-h-[44px] gap-0.5 transition-all duration-150 press-scale ${
                  isActive ? 'text-violet-400' : 'text-slate-500 active:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-violet-500/10' : ''}`}>
                    {isActive
                      ? <IconA className="w-5 h-5" />
                      : <Icon className="w-5 h-5" />
                    }
                  </div>
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-500 rounded-full" />
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

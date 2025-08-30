import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Rightbar from "../components/Rightbar";

// Pages
import Home from "./Home";
import Search from "./Search";
import Watchlist from "./Watchlist";
import Watched from "./Watched";
import Profile from "./Profile";
import MyProfile from "./MyProfile";
import Notifications from "./Notifications";


export default function Dashboard({ user, onLogout }) {
  const [counts, setCounts] = useState({ watchlist: 0, watched: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightbarOpen, setRightbarOpen] = useState(false);

  // Fetch movie stats
  const refreshCounts = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(
        `https://patient-determination-production.up.railway.app/api/movies/stats?userId=${user.uid}`
      );
      const data = await res.json();
      setCounts({
        watchlist: data.watchlistCount,
        watched: data.watchedRecentCount,
      });
    } catch (err) {
      console.error("Failed to fetch movie counts", err);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, [user]);

  // Auto-close overlays when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
      if (window.innerWidth >= 1024) setRightbarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed top navbar */}
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleRightbar={() => setRightbarOpen((prev) => !prev)}
      />

      {/* Main flex row under navbar */}
      <div className="flex flex-grow pt-16 min-h-[calc(100vh-64px)] bg-blue-50">
        {/* Sidebar - fixed on desktop */}
        <Sidebar
          user={user}
          onLogout={onLogout}
          className="hidden md:flex fixed top-16 left-0 w-64 h-[calc(100vh-64px)]"
        />

        {/* Mobile overlay sidebar */}
        {sidebarOpen && (
          <>
            <Sidebar
              user={user}
              onLogout={onLogout}
              overlay
              onClose={() => setSidebarOpen(false)}
              className="fixed top-16 left-0 w-64 h-[calc(100vh-64px)] z-50"
            />
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        {/* Main content area */}
        <main className="flex-grow min-h-[calc(100vh-64px)] overflow-auto px-4 md:ml-64 lg:mr-72 py-6">
          <Routes>
            <Route index element={<Home user={user} />} />
            <Route
              path="search"
              element={<Search user={user} onMovieChange={refreshCounts} />}
            />
            <Route
              path="notifications"
              element={<Notifications user={user} />}
            />
            <Route
              path="watchlist"
              element={<Watchlist user={user} onMovieChange={refreshCounts} />}
            />
            <Route
              path="watched"
              element={<Watched user={user} onMovieChange={refreshCounts} />}
            />
            {/* My Profile (current user) */}
  <Route path="my-profile" element={<MyProfile user={user} />} />

  {/* Other users' profiles */}
  <Route path="profile/:userId" element={<Profile user={user} />} />

          </Routes>
          <Outlet />
        </main>

        {/* Rightbar - fixed on desktop */}
        <Rightbar
          counts={counts}
          className="hidden lg:flex fixed top-16 right-0 w-72 h-[calc(100vh-64px)]"
        />

        {/* Mobile overlay rightbar */}
        {rightbarOpen && (
          <>
            <Rightbar
              counts={counts}
              overlay
              onClose={() => setRightbarOpen(false)}
              className="fixed top-16 right-0 w-72 h-[calc(100vh-64px)] z-50"
            />
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setRightbarOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}

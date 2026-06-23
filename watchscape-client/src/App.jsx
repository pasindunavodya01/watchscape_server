import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import Notifications from './pages/Notifications';
import PostDetail from './pages/PostDetail';

function LoadingScreen() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-950">
      {/* Clapperboard logo */}
      <div className="relative mb-6 animate-float">
        <svg className="w-16 h-16 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-5.25m0 5.25V9.75m0-9H18A2.25 2.25 0 0120.25 12v6.75m-3.375 0h.008v.008h-.008V19.5z" />
        </svg>
        {/* Spinning ring */}
        <div className="absolute -inset-2 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>

      {/* Brand name */}
      <h1 className="text-2xl font-bold text-white tracking-wide animate-fade-in">
        Watch<span className="text-violet-400">scape</span>
      </h1>
      <p className="text-slate-500 text-sm mt-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
        Every movie tells a part of your story.
      </p>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [guestUser, setGuestUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setGuestUser(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setGuestUser(null);
  };

  const startGuest = () => {
    setGuestUser({ uid: 'guest', isGuest: true });
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1e293b' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#1e293b' },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing startGuest={startGuest} />} />
          {!user && <Route path="/login" element={<Login />} />}
          {!user && <Route path="/signup" element={<Signup />} />}
          {!user && <Route path="/forgot-password" element={<ForgotPassword />} />}

          {/* Protected dashboard */}
          <Route
            path="/dashboard/*"
            element={(user || guestUser) ? <Dashboard user={user || guestUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />

          {/* Post detail route */}
          <Route
            path="/dashboard/posts/:postId"
            element={(user || guestUser) ? <PostDetail user={user || guestUser} /> : <Navigate to="/login" replace />}
          />

          {/* Standalone profile page */}
          <Route
            path="/profile/:userId"
            element={(user || guestUser) ? <Profile user={user || guestUser} /> : <Navigate to="/login" replace />}
          />

          {/* Notifications page */}
          <Route
            path="/notifications"
            element={user ? <Notifications user={user} /> : <Navigate to="/login" replace />}
          />

          {/* My Profile */}
          <Route
            path="/my-profile"
            element={user ? <MyProfile user={user} /> : <Navigate to="/login" replace />}
          />

          {/* Redirect logged-in users away from login/signup */}
          {user && <Route path="/login" element={<Navigate to="/dashboard" replace />} />}
          {user && <Route path="/signup" element={<Navigate to="/dashboard" replace />} />}
        </Routes>
      </Router>
    </>
  );
}

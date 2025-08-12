import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        {!user && <Route path="/login" element={<Login />} />}
        {!user && <Route path="/signup" element={<Signup />} />}
        {!user && <Route path="/forgot-password" element={<ForgotPassword />} />}

        {/* Protected dashboard route with nested routes */}
        <Route
          path="/dashboard/*"  // note the /* here for nested routes inside dashboard
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Redirect logged in users away from login/signup */}
        {user && <Route path="/login" element={<Navigate to="/dashboard" replace />} />}
        {user && <Route path="/signup" element={<Navigate to="/dashboard" replace />} />}
      </Routes>
    </Router>
  );
}

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

function CinemaPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-10">
      {/* Background glow */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-700/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-fuchsia-700/20 rounded-full blur-3xl" />

      {/* Top brand */}
      <div className="relative flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="6" width="20" height="13" rx="2" />
            <path strokeLinecap="round" d="M2 10h20M7 6V4M17 6V4M7 10v9M17 10v9M12 10v9" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg">Watch<span className="text-violet-400">scape</span></span>
      </div>

      {/* Center quote */}
      <div className="relative space-y-4">
        <div className="text-4xl text-violet-300 opacity-30 font-serif leading-none">"</div>
        <p className="text-white text-2xl font-semibold leading-snug">
          Every movie tells<br />a part of your story.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
          Track what you've watched, discover new films, and share your cinematic journey with friends.
        </p>
      </div>

      {/* Feature pills */}
      <div className="relative flex flex-wrap gap-2">
        {['Track films', 'Share reviews', 'Discover movies', 'Follow friends'].map((tag) => (
          <span key={tag} className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back! 👋');
      const dest = location.state?.from || '/dashboard';
      navigate(dest);
    } catch (error) {
      const msg =
        error.code === 'auth/invalid-credential' ? 'Invalid email or password.' :
        error.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.' :
        'Login failed. Please try again.';
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 animate-fade-in">

        {/* Left panel */}
        <CinemaPanel />

        {/* Right: Form */}
        <div className="flex flex-col justify-center">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <svg className="w-6 h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="6" width="20" height="13" rx="2" />
              <path strokeLinecap="round" d="M2 10h20M7 6V4M17 6V4M7 10v9M17 10v9M12 10v9" />
            </svg>
            <span className="text-white font-bold text-lg">Watch<span className="text-violet-400">scape</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-slate-400">Sign in to continue your cinematic journey.</p>
          </div>

          {/* Form error banner */}
          {errors.form && (
            <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm animate-fade-in">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-700 focus:ring-violet-500/30 focus:border-violet-500'
                }`}
              />
              {errors.email && <p className="mt-1.5 text-xs text-rose-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  className={`w-full px-4 py-3 pr-12 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.password ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-700 focus:ring-violet-500/30 focus:border-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-400">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-brand flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign up free
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V9.75M3.375 9.75a1.125 1.125 0 011.125-1.125h13.5A1.125 1.125 0 0119.5 9.75m-16.125 0v-.375c0-.621.504-1.125 1.125-1.125h13.5c.621 0 1.125.504 1.125 1.125v.375m-15 10.5V9.75m16.5 9.75V9.75" />
      </svg>
    ),
    title: "Track",
    desc: "Keep a watchlist and log every film you've seen.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    title: "Share",
    desc: "Post reviews and see what friends are watching.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
      </svg>
    ),
    title: "Discover",
    desc: "Browse trending movies and find your next favourite.",
  },
];

// Floating movie poster placeholders (decorative)
const POSTER_POSITIONS = [
  { top: "8%",  left: "3%",  rotate: "-12deg", delay: "0ms",   size: "w-24 h-36" },
  { top: "55%", left: "1%",  rotate: "8deg",   delay: "200ms", size: "w-20 h-30" },
  { top: "20%", right: "4%", rotate: "10deg",  delay: "100ms", size: "w-28 h-40" },
  { top: "62%", right: "2%", rotate: "-8deg",  delay: "300ms", size: "w-20 h-30" },
  { top: "5%",  right: "18%",rotate: "5deg",   delay: "400ms", size: "w-16 h-24" },
  { top: "75%", left: "15%", rotate: "-5deg",  delay: "250ms", size: "w-16 h-24" },
];

const POSTER_COLORS = [
  "from-violet-800 to-indigo-900",
  "from-rose-800 to-pink-900",
  "from-amber-700 to-orange-900",
  "from-emerald-700 to-teal-900",
  "from-blue-800 to-cyan-900",
  "from-fuchsia-800 to-purple-900",
];

export default function Landing({ startGuest }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleTry = () => {
    startGuest?.();
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-app-vh bg-slate-950 overflow-x-hidden flex flex-col">
      {/* ── Ambient glow blobs ───────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-700/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-fuchsia-700/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-700/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Floating decorative posters ──────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {POSTER_POSITIONS.map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos.size} rounded-xl bg-gradient-to-b ${POSTER_COLORS[i]} opacity-0 animate-fade-in shadow-dark`}
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
              transform: `rotate(${pos.rotate})`,
              animationDelay: `${600 + parseInt(pos.delay)}ms`,
              animationFillMode: "forwards",
            }}
          >
            {/* Film strip lines */}
            <div className="absolute top-1.5 left-0 right-0 flex justify-around px-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="w-2 h-1.5 bg-white/20 rounded-sm" />
              ))}
            </div>
            <div className="absolute bottom-1.5 left-0 right-0 flex justify-around px-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="w-2 h-1.5 bg-white/20 rounded-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Navbar ───────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <svg className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="6" width="20" height="13" rx="2" />
            <path d="M2 10h20M7 6V4M17 6V4M7 10v9M17 10v9M12 10v9" strokeLinecap="round" />
          </svg>
          <span className="text-white font-bold text-xl tracking-tight">
            Watch<span className="text-violet-400">scape</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all duration-200 hover:shadow-brand"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        {/* Eyebrow badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-violet-900/50 border border-violet-700/50 text-violet-300 text-xs font-medium transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
          Your personal cinema companion
        </div>

        {/* Main headline */}
        <h1
          className={`text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-4 max-w-3xl transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          Every Movie{" "}
          <span
            className="text-transparent bg-clip-text animate-gradient-x"
            style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #f472b6, #818cf8, #a78bfa)", backgroundSize: "200% 100%" }}
          >
            Tells a Part
          </span>{" "}
          of Your Story.
        </h1>

        {/* Subtitle */}
        <p
          className={`text-slate-400 text-lg sm:text-xl max-w-xl mb-10 leading-relaxed transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          Track what you've watched, build your watchlist, share reviews, and discover films with friends.
        </p>

        {/* CTA buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-3 items-center transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link
            to="/signup"
            className="group px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-brand-lg hover:scale-105 flex items-center gap-2"
          >
            Get started — it's free
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 hover:bg-slate-800"
          >
            Log in
          </Link>
          <button
            onClick={handleTry}
            className="px-6 py-3.5 text-slate-500 hover:text-slate-300 font-medium text-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Browse as guest
          </button>
        </div>

        {/* Social proof */}
        
        
      </main>

      {/* ── Feature highlights ───────────────────────────── */}
      <section
        className={`relative z-10 max-w-4xl mx-auto w-full px-6 pb-16 transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-700/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${700 + i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="relative z-10 text-center pb-6 text-slate-700 text-xs">
        by EcoMind · © {new Date().getFullYear()} Watchscape
      </footer>
    </div>
  );
}

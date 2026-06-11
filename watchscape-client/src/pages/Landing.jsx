import { Link, useNavigate } from "react-router-dom";

export default function Landing({ startGuest }) {
  const navigate = useNavigate();

  const handleTry = () => {
    startGuest?.();
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="text-right">
        <h1 className="text-5xl font-bold mb-2">Watchscape</h1>
        <p className="text-sm text-blue-100 mb-6 opacity-80">by EcoMind</p>
      </div>
      <p className="text-lg mb-8">Every Movie Tells a Part of Your Story.</p>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition"
          >
            Sign Up
          </Link>
        </div>

        <button
          onClick={handleTry}
          className="px-6 py-2 bg-white/20 border border-white text-white rounded-lg font-semibold hover:bg-white/30 transition"
        >
          Try without login
        </button>
      </div>
    </div>
  );
}

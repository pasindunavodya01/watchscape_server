import React from "react";

export default function Rightbar({
  counts = { watchlist: 0, watched: 0 },
  className = "",
  overlay = false,
  onClose,
}) {
  return (
    <aside
      className={`${className} bg-white shadow-lg border-l flex flex-col p-4 space-y-6`}
    >
      {/* Close button for mobile overlay */}
      {overlay && (
        <div className="flex justify-end p-2 border-b border-blue-100">
          <button
            onClick={onClose}
            aria-label="Close right sidebar"
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2 text-purple-700">Your Stacks</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            <span className="font-semibold">Watchlist:</span> {counts.watchlist}
          </li>
          <li>
            <span className="font-semibold">Watched (last 30 days):</span>{" "}
            {counts.watched}
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-purple-700">
          Follow Suggestions
        </h2>
        <p className="text-sm text-gray-600">Coming soon...</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-purple-700">
          Follow Requests
        </h2>
        <p className="text-sm text-gray-600">Coming soon...</p>
      </section>
    </aside>
  );
}

import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  EyeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({
  user,
  onLogout,
  className = "",
  overlay = false,
  onClose,
}) {
  const menuItems = [
    { name: "Home", to: "/dashboard", icon: HomeIcon, end: true },
    { name: "Search", to: "/dashboard/search", icon: MagnifyingGlassIcon },
    { name: "Watchlist", to: "/dashboard/watchlist", icon: BookmarkIcon },
    { name: "Watched", to: "/dashboard/watched", icon: EyeIcon },
    { name: "Profile", to: `/dashboard/profile/${user.uid}`, icon: UserIcon },
  ];

  return (
    <aside
      className={`${className} bg-white shadow-lg border-r border-blue-100 flex flex-col h-full`}
    >
      {/* Close button for mobile overlay */}
      {overlay && (
        <div className="flex justify-end p-2 border-b border-blue-100">
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Scrollable nav + logout section */}
      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Navigation links */}
        <div className="p-6 flex-1">
          <nav className="flex flex-col space-y-2">
            {menuItems.map(({ name, to, icon: Icon, end }) => (
              <NavLink
                key={name}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                  }`
                }
              >
                <Icon className="h-5 w-5 mr-3" />
                {name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logout button pinned at bottom */}
        <div className="p-6 border-t border-blue-100">
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

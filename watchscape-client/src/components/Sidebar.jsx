import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  EyeIcon,
  UserIcon,
  PowerIcon,
  BellIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as SearchSolid,
  BookmarkIcon as BookmarkSolid,
  EyeIcon as EyeSolid,
  UserIcon as UserSolid,
  BellIcon as BellSolid,
} from "@heroicons/react/24/solid";

const menuItems = [
  { name: "Home",          to: "/dashboard",                icon: HomeIcon,             iconActive: HomeSolid,      end: true },
  { name: "Notifications", to: "/dashboard/notifications",  icon: BellIcon,             iconActive: BellSolid },
  { name: "Search",        to: "/dashboard/search",         icon: MagnifyingGlassIcon,  iconActive: SearchSolid },
  { name: "Watchlist",     to: "/dashboard/watchlist",      icon: BookmarkIcon,         iconActive: BookmarkSolid },
  { name: "Watched",       to: "/dashboard/watched",        icon: EyeIcon,              iconActive: EyeSolid },
  { name: "Profile",       to: `/dashboard/my-profile`,     icon: UserIcon,             iconActive: UserSolid },
];

export default function Sidebar({ user, onLogout, className = "", overlay = false, onClose }) {
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (overlay && onClose) onClose();
  };

  return (
    <aside className={`${className} bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden`}>
      {/* Mobile close button */}
      {overlay && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="6" width="20" height="13" rx="2" />
              <path strokeLinecap="round" d="M2 10h20M7 6V4M17 6V4M7 10v9M17 10v9M12 10v9" />
            </svg>
            <span className="text-white font-bold text-base">Watch<span className="text-violet-400">scape</span></span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {menuItems.map(({ name, to, icon: Icon, iconActive: IconActive, end }) => (
          <NavLink
            key={name}
            to={to}
            end={end}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left accent */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-500 rounded-r-full" />
                )}
                {isActive
                  ? <IconActive className="h-5 w-5 flex-shrink-0 text-violet-400" />
                  : <Icon className="h-5 w-5 flex-shrink-0 group-hover:scale-105 transition-transform" />
                }
                <span>{name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-800" />

      {/* Logout */}
      {onLogout && user && !user.isGuest && (
        <div className="p-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <PowerIcon className="h-5 w-5 flex-shrink-0" />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
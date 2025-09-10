import React from "react";
import { Bars3Icon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import NotificationBadge from "./NotificationBadge";

export default function Navbar({ user, onToggleSidebar, onToggleRightbar, onOpenNotifications }) {
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-blue-600 shadow px-4 flex justify-between items-center z-50">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Hamburger - Mobile only */}
        <button
          className="md:hidden text-white p-2 rounded hover:bg-blue-500"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <h1 className="text-xl font-bold text-white">WatchScape</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* User name - hidden on very small screens */}
        <span className="font-medium text-white hidden sm:inline">
          {user?.name || user?.email}
        </span>

        {/* Notification Bell */}
        <NotificationBadge user={user} onOpenNotifications={onOpenNotifications} />


       
        {/* Avatar */}
        <img
          src={`https://i.pravatar.cc/40?u=${user?.uid}`}
          alt="User Avatar"
          className="hidden sm:block w-10 h-10 rounded-full border-2 border-purple-700"
        />

        {/* Three dots - Mobile only */}
        <button
          className="lg:hidden text-white p-2 rounded hover:bg-blue-500"
          onClick={onToggleRightbar}
          aria-label="Toggle rightbar"
        >
          <EllipsisVerticalIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

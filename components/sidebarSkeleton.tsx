import React from "react";

const SidebarSkeleton = () => {
  return (
    <aside className="fixed top-0 left-0 z-40 h-full w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700/50 shadow-xl">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center space-x-2 animate-pulse">
          <div className="h-5 w-5 bg-slate-700 rounded" />
          <div className="h-6 w-32 bg-slate-700 rounded" />
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-slate-700 animate-pulse" />
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-6 w-32 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 space-y-2">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="h-10 px-4 rounded-lg bg-slate-700/50 animate-pulse flex items-center space-x-3"
          >
            <div className="h-5 w-5 bg-slate-600 rounded" />
            <div className="h-4 w-24 bg-slate-600 rounded" />
          </div>
        ))}
      </nav>

      {/* Footer Buttons */}
      <div className="p-2 border-t border-slate-700/50 bg-slate-900/30">
        <div className="space-y-2">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="h-10 px-4 rounded-lg bg-slate-700/50 animate-pulse flex items-center space-x-3"
            >
              <div className="h-5 w-5 bg-slate-600 rounded" />
              <div className="h-4 w-16 bg-slate-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SidebarSkeleton;

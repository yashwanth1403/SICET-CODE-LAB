"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Code2,
  Terminal,
  Files,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

interface AdminSidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const AdminSidebar = ({ onCollapsedChange }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Handle viewport resizing
  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    // Set initial state based on window size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed);
    }
  }, [collapsed, onCollapsedChange]);

  // Don't render anything on the server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: Terminal,
    },
    {
      name: "Create Assessment",
      href: "/admin/create-assessment",
      icon: Code2,
    },
    { name: "Submissions", href: "/admin/submissions", icon: Files },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Cpu },
  ];

  return (
    <aside
      className={cn(
        "h-screen fixed left-0 top-0 z-40 flex flex-col transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-700",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo and Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 w-8 h-8 rounded-md">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <h1 className="text-lg font-bold text-white font-mono">
              <span className="text-cyan-400">&lt;</span>
              CodeAdmin
              <span className="text-cyan-400">/&gt;</span>
            </h1>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded text-slate-400 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          <li className="px-2 py-2">
            <div
              className={cn(
                "text-xs font-medium uppercase tracking-wider text-slate-500 font-mono",
                collapsed ? "text-center" : "text-left px-2"
              )}
            >
              {collapsed ? "//" : "// MAIN"}
            </div>
          </li>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors font-mono",
                    isActive
                      ? "bg-gradient-to-r from-cyan-900/60 to-blue-900/60 text-cyan-300 border border-cyan-800/50"
                      : "text-slate-300 hover:bg-slate-800 hover:text-cyan-300",
                    collapsed ? "justify-center" : ""
                  )}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0",
                      isActive ? "text-cyan-400" : "text-slate-400"
                    )}
                    size={20}
                  />
                  {!collapsed && (
                    <span className={isActive ? "text-cyan-300" : ""}>
                      {isActive ? `> ${item.name}` : item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <div
            className={cn(
              "text-xs font-medium uppercase tracking-wider text-slate-500 font-mono",
              collapsed ? "text-center" : "text-left px-2 py-2"
            )}
          >
            {!collapsed && "// SYSTEM"}
          </div>
          <ul className="mt-2 space-y-1">
            <li>
              <Link
                href="/api/auth/signout"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-900/20 hover:text-red-400 transition-colors font-mono",
                  collapsed ? "justify-center" : ""
                )}
              >
                <LogOut className="text-slate-400" size={20} />
                {!collapsed && <span>exit()</span>}
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Decorative status indicator */}
      <div
        className={cn(
          "p-4 flex justify-center border-t border-slate-800 font-mono text-xs text-slate-500",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {!collapsed && <span>system:online</span>}
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

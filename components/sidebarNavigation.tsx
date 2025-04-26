"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Code,
  Clock,
  Trophy,
  Settings,
  Users,
  BookOpen,
  LineChart,
  Menu,
  X,
  LogOut,
  Terminal,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SidebarNavigationProps {
  session: Session | null;
  isLoading?: boolean;
}

const SidebarNavigation = ({
  session,
  isLoading = false,
}: SidebarNavigationProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Problems", icon: Code, href: "/problems" },
    { title: "Assessments", icon: BookOpen, href: "/assessments" },
    { title: "Submissions", icon: Clock, href: "/submissions" },
    { title: "Progress", icon: LineChart, href: "/progress" },
    { title: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  ];

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center justify-center text-slate-300 hover:text-slate-900"
        >
          <Menu className="h-4 w-4 " />
        </Button>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full
          bg-gradient-to-b from-slate-800 to-slate-900
          border-r border-slate-700/50
          transition-all duration-300 ease-in-out
          flex flex-col
          shadow-xl
          ${isCollapsed ? "w-16" : "w-64"}
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/50 relative bg-slate-900/50 backdrop-blur-sm">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              <div className="font-mono font-bold text-md md:text-lg bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {"SICET CODE LAB"}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:flex hidden text-slate-400 hover:text-slate-800"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-slate-200"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!isCollapsed && (
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center ring-2 ring-emerald-500/30 shadow-lg">
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
              {isLoading ? (
                <div className="space-y-2 w-full flex flex-col items-center">
                  <div className="h-6 w-32 bg-slate-700 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-slate-700 rounded animate-pulse" />
                </div>
              ) : (
                <div className="text-center">
                  <div className="font-medium text-lg text-slate-200">
                    {session?.user?.name}
                  </div>
                  <div className="text-md text-cyan-400 font-mono bg-slate-800/50 px-2 py-0.5 rounded-full">
                    {`{${session?.user?.collegeId}}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 px-2 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              onClick={() => handleNavClick(item.href)}
              className={`
                w-full flex items-center
                ${
                  isCollapsed
                    ? "justify-center h-12"
                    : "justify-start px-4 h-10"
                }
                text-slate-300 hover:text-slate-900
                hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10
                border border-transparent hover:border-slate-600/50
                transition-all duration-200
                rounded-lg
                group
              `}
            >
              <item.icon
                className={`
                h-5 w-5 
                ${!isCollapsed && "mr-3"} 
                group-hover:text-cyan-700
                transition-colors duration-200
              `}
              />
              {!isCollapsed && (
                <span className="flex-1 text-left font-medium">
                  {item.title}
                </span>
              )}
            </Button>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={`
                w-full flex items-center
                ${
                  isCollapsed
                    ? "justify-center h-12"
                    : "justify-start px-4 h-10"
                }
                text-slate-400 hover:text-slate-700
                hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10
                rounded-lg
                group
              `}
            >
              <Settings
                className={`
                h-5 w-5 
                ${!isCollapsed && "mr-3"}
                group-hover:text-cyan-700
                transition-colors duration-200
              `}
              />
              {!isCollapsed && <span>Settings</span>}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowLogoutDialog(true)}
              className={`
                w-full flex items-center
                ${
                  isCollapsed
                    ? "justify-center h-12"
                    : "justify-start px-4 h-10"
                }
                text-slate-400 
                hover:text-red-400
                hover:bg-red-900/10
                border border-transparent hover:border-red-900/30
                rounded-lg
                group
                transition-all duration-200
              `}
            >
              <LogOut
                className={`
                h-5 w-5 
                ${!isCollapsed && "mr-3"}
                group-hover:text-red-500
                transition-colors duration-200
              `}
              />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}
          bg-slate-900 min-h-screen
        `}
      ></div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600 hover:text-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SidebarNavigation;

"use client";
import { JSX, useState } from "react";
import SidebarNavigation from "./sidebarNavigation";
import StudentDashboard from "./StudentDashboard";
import Assessment from "./assement";
// Import your page components

const Problems = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-slate-200 mb-6">Problems</h1>
    {/* Problems content */}
  </div>
);

const MainLayout = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userRole] = useState("student"); // This would normally come from your auth system

  // Component mapping object
  const pageComponents = {
    dashboard: StudentDashboard,
    problems: Problems,
    assessments: Assessment,
    // Add other page components as needed
  };

  // Handle navigation
  const handleNavigation = (path) => {
    // Remove the leading '/' and convert to page key
    const page = path.substring(1);
    setCurrentPage(page);
  };

  // Get current component
  const CurrentComponent: () => JSX.Element =
    pageComponents[currentPage] || Dashboard;

  return (
    <div className="flex">
      <SidebarNavigation userRole={userRole} onNavigate={handleNavigation} />
      <main className="flex-1 bg-slate-900 min-h-screen">
        <CurrentComponent />
      </main>
    </div>
  );
};

export default MainLayout;

"use client";

import { ReactNode, useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

export function AdminSidebarWrapper() {
  return (
    <AdminSidebar
      onCollapsedChange={(state) => {
        // Store the sidebar state in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("admin-sidebar-collapsed", state.toString());
        }

        // Dispatch a custom event to notify other components
        const event = new CustomEvent("admin-sidebar-collapse", {
          detail: { collapsed: state },
        });
        window.dispatchEvent(event);
      }}
    />
  );
}

export function ContentWrapper({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse events
  useEffect(() => {
    // Initialize state from localStorage if available
    if (typeof window !== "undefined") {
      const storedState = localStorage.getItem("admin-sidebar-collapsed");
      setSidebarCollapsed(storedState === "true");

      const handleSidebarCollapse = (
        e: CustomEvent<{ collapsed: boolean }>
      ) => {
        setSidebarCollapsed(e.detail.collapsed);
      };

      window.addEventListener(
        "admin-sidebar-collapse",
        handleSidebarCollapse as EventListener
      );
      return () => {
        window.removeEventListener(
          "admin-sidebar-collapse",
          handleSidebarCollapse as EventListener
        );
      };
    }
  }, []);

  return (
    <div
      className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}
    >
      <main className="p-6">{children}</main>
    </div>
  );
}

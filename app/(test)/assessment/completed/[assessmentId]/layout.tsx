import React from "react";
import { Toaster } from "react-hot-toast";

interface LayoutProps {
  children: React.ReactNode;
  params: { assessmentId: string };
}

export default function Layout({ children, params }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0f1a]">
      <Toaster />
      <main className="flex-grow">{children}</main>
    </div>
  );
}

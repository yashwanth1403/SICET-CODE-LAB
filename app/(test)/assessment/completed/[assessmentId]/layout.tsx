import React from "react";
import { Toaster } from "react-hot-toast";
import { AssessmentProvider } from "@/lib/store/context/AssessmentContext";

interface LayoutProps {
  children: React.ReactNode;
  params: { assessmentId: string };
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AssessmentProvider>
      <div className="flex flex-col min-h-screen bg-[#0a0f1a]">
        <Toaster />
        <main className="flex-grow">{children}</main>
      </div>
    </AssessmentProvider>
  );
}

//assessment/ongoing/[assessmentId]/layout.tsx
import { auth } from "@/auth"; // Adjust the import path to your auth configuration
import TestSidebar from "@/components/test/TestSidebar";
import { AssessmentProvider } from "@/lib/store/context/AssessmentContext";
import { redirect } from "next/navigation";

export default async function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session check
  const session = await auth();

  // If no session, redirect to login
  if (!session) {
    redirect("/login");
  }

  return (
    <AssessmentProvider>
      <div className="flex relative bg-[#0d1424] overflow-hidden">
        <TestSidebar />
        <main className="flex-1 bg-[#0d1424] min-h-screen ml-0 md:ml-2 lg:ml-20 transition-all duration-300">
          {children}
        </main>
      </div>
    </AssessmentProvider>
  );
}

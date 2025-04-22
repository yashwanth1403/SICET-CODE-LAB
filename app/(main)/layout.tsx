// app/components/DashboardLayout.tsx
import { auth } from "@/auth"; // Adjust the import path to your auth configuration
import SidebarNavigation from "@/components/sidebarNavigation";
import { redirect } from "next/navigation";
import { AssessmentProvider } from "@/lib/store/context/AssessmentContext";

export default async function DashboardLayout({
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
    <div className="flex">
      <SidebarNavigation session={session} />
      <main className="flex-1 bg-slate-900 min-h-screen">
        <AssessmentProvider>{children}</AssessmentProvider>
      </main>
    </div>
  );
}

import { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  AdminSidebarWrapper,
  ContentWrapper,
} from "@/components/admin/ClientWrappers";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  // Determine current path
  const currentPath = {}.toString
    .call({})
    .split(" ")[1]
    .slice(0, -1)
    .toLowerCase();
  console.log(currentPath);
  const isLoginOrSignupPage =
    currentPath?.includes("/admin/login") ||
    currentPath?.includes("/admin/signup");

  console.log(isLoginOrSignupPage);

  // Allow unauthenticated users to access login and signup pages
  // If they're not on login/signup, redirect them to login
  if (!session && !isLoginOrSignupPage) {
    redirect("/admin/login");
  }

  // If an authenticated user is accessing login/signup but doesn't have admin role,
  // redirect them to the dashboard
  if (session && isLoginOrSignupPage && session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-full min-h-screen bg-slate-900 text-slate-200">
      <AdminSidebarWrapper />
      <ContentWrapper>{children}</ContentWrapper>
    </div>
  );
}

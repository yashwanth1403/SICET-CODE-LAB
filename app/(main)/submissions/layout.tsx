import { auth } from "@/auth";
import SidebarNavigation from "@/components/sidebarNavigation";

export default async function SubmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-slate-900">
      <SidebarNavigation session={session} />
      <div className="flex-1 p-2 lg:p-6">{children}</div>
    </div>
  );
}

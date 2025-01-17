import { auth } from "@/auth";
import MainLayout from "@/components/MainLayout";
import { redirect } from "next/navigation";

const dashboard = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  } else if (session.user.role === "admin") {
    redirect("admin/dashboard");
  }
  return (
    <div>
      <MainLayout user={session} />
    </div>
  );
};

export default dashboard;
